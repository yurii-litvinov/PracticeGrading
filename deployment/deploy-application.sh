#!/usr/bin/env bash

set -Eeuo pipefail
umask 077

readonly CONFIG_FILE="${PRACTICEGRADING_DEPLOY_CONFIG:-/etc/practicegrading/deployment.env}"
readonly BACKUP_SCRIPT="${PRACTICEGRADING_BACKUP_SCRIPT:-/usr/local/lib/practicegrading/backup-database.sh}"
readonly MIGRATION_SCRIPT="${PRACTICEGRADING_MIGRATION_SCRIPT:-/usr/local/lib/practicegrading/run-migrations.sh}"

if (( EUID != 0 )); then
    echo "This command must run as root." >&2
    exit 1
fi

if [[ ! -f "$CONFIG_FILE" ]]; then
    echo "Deployment configuration not found: $CONFIG_FILE" >&2
    exit 1
fi

# The file is root-owned and is therefore safe to load.
# shellcheck disable=SC1090
source "$CONFIG_FILE"

BOOTSTRAP_HEALTH_URL="${BOOTSTRAP_HEALTH_URL:-}"
BOOTSTRAP_HEALTH_ACCEPT_ANY_HTTP="${BOOTSTRAP_HEALTH_ACCEPT_ANY_HTTP:-0}"
ALLOW_DEPLOY_TEST_FAILURES="${ALLOW_DEPLOY_TEST_FAILURES:-0}"
DEPLOY_TEST_FAILPOINT="${DEPLOY_TEST_FAILPOINT:-}"

required_variables=(
    DEPLOYMENT_NAME
    COMPOSE_PROJECT_DIRECTORY
    COMPOSE_PROJECT_NAME
    COMPOSE_FILE
    COMPOSE_ENV_FILE
    API_SERVICE
    POSTGRES_CONTAINER
    POSTGRES_USER
    POSTGRES_DB
    BACKUP_DIR
    STATE_DIR
    INCOMING_DIR
    RELEASES_DIR
    FRONTEND_PATH
    MAINTENANCE_FLAG
    HEALTH_URL
    HEALTH_ATTEMPTS
    HEALTH_INTERVAL
    API_IMAGE_REPOSITORY
)

for variable_name in "${required_variables[@]}"; do
    if [[ -z "${!variable_name:-}" ]]; then
        echo "Required configuration variable is missing: $variable_name" >&2
        exit 1
    fi
done

if [[ "$BOOTSTRAP_HEALTH_ACCEPT_ANY_HTTP" != "0" && \
      "$BOOTSTRAP_HEALTH_ACCEPT_ANY_HTTP" != "1" ]]; then
    echo "BOOTSTRAP_HEALTH_ACCEPT_ANY_HTTP must be 0 or 1." >&2
    exit 1
fi

if [[ -n "$DEPLOY_TEST_FAILPOINT" ]]; then
    if [[ "$ALLOW_DEPLOY_TEST_FAILURES" != "1" || \
          "$DEPLOYMENT_NAME" != "deployment-test" ]]; then
        echo "Deployment failpoints are allowed only in the deployment-test environment." >&2
        exit 1
    fi

    if [[ "$DEPLOY_TEST_FAILPOINT" != "after_frontend" ]]; then
        echo "Unsupported deployment test failpoint: $DEPLOY_TEST_FAILPOINT" >&2
        exit 1
    fi
fi

compose=(
    docker compose
    --project-directory "$COMPOSE_PROJECT_DIRECTORY"
    --project-name "$COMPOSE_PROJECT_NAME"
    --env-file "$COMPOSE_ENV_FILE"
    -f "$COMPOSE_FILE"
)

exec 9>"/run/lock/practicegrading-${DEPLOYMENT_NAME}-deploy.lock"

if ! flock -n 9; then
    echo "Another deployment is already running." >&2
    exit 1
fi

read_value() {
    local path="$1"

    if [[ ! -f "$path" ]]; then
        echo "Required deployment file is missing: $path" >&2
        return 1
    fi

    tr -d '\r\n' < "$path"
}

update_api_image() {
    local image="$1"
    local temporary_file

    temporary_file="$(mktemp "$STATE_DIR/compose-env.XXXXXX")"

    if ! awk -v image="$image" '
        BEGIN { found = 0 }
        /^API_IMAGE=/ {
            print "API_IMAGE=" image
            found = 1
            next
        }
        { print }
        END {
            if (!found) {
                exit 42
            }
        }
    ' "$COMPOSE_ENV_FILE" > "$temporary_file"; then
        rm -f "$temporary_file"
        echo "API_IMAGE is missing from $COMPOSE_ENV_FILE" >&2
        return 1
    fi

    install -o root -g root -m 0600 \
        "$temporary_file" "$COMPOSE_ENV_FILE"
    rm -f "$temporary_file"
}

wait_for_health() {
    local health_url="${1:-$HEALTH_URL}"
    local accept_any_http="${2:-0}"
    local attempt
    local http_code

    for (( attempt = 1; attempt <= HEALTH_ATTEMPTS; attempt++ )); do
        if [[ "$accept_any_http" == "1" ]]; then
            if http_code="$(
                curl --silent --show-error \
                    --output /dev/null \
                    --write-out '%{http_code}' \
                    --max-time 5 \
                    "$health_url"
            )" && [[ "$http_code" != "000" ]]; then
                echo "Health check passed with HTTP $http_code."
                return 0
            fi
        elif curl --fail --silent --show-error \
            --output /dev/null \
            --max-time 5 \
            "$health_url"; then
            echo "Liveness check passed."
            return 0
        fi

        echo "Liveness attempt $attempt/$HEALTH_ATTEMPTS failed."
        sleep "$HEALTH_INTERVAL"
    done

    return 1
}

activate_frontend() {
    local target="$1"
    local temporary_link="${FRONTEND_PATH}.new"

    rm -f "$temporary_link"
    ln -s "$target" "$temporary_link"
    mv -Tf "$temporary_link" "$FRONTEND_PATH"
}

restore_database() {
    local backup_path="$1"

    echo "Restoring database from $backup_path..."

    docker exec -i "$POSTGRES_CONTAINER" \
        psql \
            -v ON_ERROR_STOP=1 \
            -v target_database="$POSTGRES_DB" \
            -v target_owner="$POSTGRES_USER" \
            -U "$POSTGRES_USER" \
            -d postgres <<'SQL'
SELECT pg_terminate_backend("pid")
FROM pg_stat_activity
WHERE "datname" = :'target_database'
  AND "pid" <> pg_backend_pid();

DROP DATABASE IF EXISTS :"target_database";
CREATE DATABASE :"target_database" OWNER :"target_owner";
SQL

    docker exec -i "$POSTGRES_CONTAINER" \
        pg_restore \
            --no-owner \
            --no-acl \
            -U "$POSTGRES_USER" \
            -d "$POSTGRES_DB" \
        < "$backup_path"
}

deployment_started=0
database_may_have_changed=0
environment_changed=0
frontend_changed=0
backup_path=""
previous_image=""
previous_frontend=""
rollback_health_url="$HEALTH_URL"
rollback_health_accept_any_http=0

rollback() {
    local original_status="$1"
    local failed_line="$2"
    local rollback_ok=1

    trap - ERR
    set +e

    echo "Deployment failed at line $failed_line. Starting rollback." >&2

    if (( deployment_started )); then
        "${compose[@]}" stop "$API_SERVICE" || rollback_ok=0

        if (( database_may_have_changed )) && [[ -n "$backup_path" ]]; then
            restore_database "$backup_path" || rollback_ok=0
        fi

        if (( environment_changed )) && [[ -n "$previous_image" ]]; then
            update_api_image "$previous_image" || rollback_ok=0
        fi

        if (( frontend_changed )) && [[ -n "$previous_frontend" ]]; then
            activate_frontend "$previous_frontend" || rollback_ok=0
        fi

        "${compose[@]}" up -d --no-deps "$API_SERVICE" || rollback_ok=0

        if (( rollback_ok )) && \
           wait_for_health \
               "$rollback_health_url" \
               "$rollback_health_accept_any_http"; then
            rm -f "$MAINTENANCE_FLAG"
            echo "Rollback completed successfully." >&2
        else
            echo "Rollback failed. Maintenance mode remains enabled." >&2
        fi
    fi

    exit "$original_status"
}

trap 'rollback "$?" "$LINENO"' ERR

release_sha="$(read_value "$INCOMING_DIR/release-sha")"
api_image="$(read_value "$INCOMING_DIR/api-image")"

if [[ ! "$release_sha" =~ ^[0-9a-f]{40}$ ]]; then
    echo "Invalid release SHA: $release_sha" >&2
    exit 1
fi

expected_image="${API_IMAGE_REPOSITORY}:${release_sha}"

if [[ "$api_image" != "$expected_image" ]]; then
    echo "Unexpected API image: $api_image" >&2
    echo "Expected: $expected_image" >&2
    exit 1
fi

incoming_frontend="$INCOMING_DIR/frontend"
incoming_migrations="$INCOMING_DIR/migrations"

if [[ ! -f "$incoming_frontend/index.html" ]]; then
    echo "Frontend artifact does not contain index.html." >&2
    exit 1
fi

if [[ ! -d "$incoming_migrations" ]]; then
    echo "Migrations artifact is missing." >&2
    exit 1
fi

if find "$incoming_frontend" "$incoming_migrations" -type l -print -quit |
    grep -q .; then
    echo "Deployment artifacts must not contain symbolic links." >&2
    exit 1
fi

if find "$incoming_frontend" "$incoming_migrations" \
    ! -type f ! -type d -print -quit | grep -q .; then
    echo "Deployment artifacts contain unsupported file types." >&2
    exit 1
fi

current_release_file="$STATE_DIR/current-release"

if [[ ! -f "$current_release_file" && -n "$BOOTSTRAP_HEALTH_URL" ]]; then
    rollback_health_url="$BOOTSTRAP_HEALTH_URL"
    rollback_health_accept_any_http="$BOOTSTRAP_HEALTH_ACCEPT_ANY_HTTP"
fi

if [[ -f "$current_release_file" ]] && \
   [[ "$(read_value "$current_release_file")" == "$release_sha" ]] && \
   curl --fail --silent --output /dev/null --max-time 5 "$HEALTH_URL"; then
    echo "Release $release_sha is already deployed and healthy."
    exit 0
fi

release_dir="$RELEASES_DIR/$release_sha"

rm -rf "$release_dir"
install -d -o root -g root -m 0755 \
    "$release_dir/frontend" \
    "$release_dir/migrations"

cp -a "$incoming_frontend/." "$release_dir/frontend/"
cp -a "$incoming_migrations/." "$release_dir/migrations/"

chown -R root:root "$release_dir"
find "$release_dir" -type d -exec chmod 0755 {} +
find "$release_dir" -type f -exec chmod 0644 {} +

echo "Pulling $api_image..."
docker pull "$api_image"

previous_image="$(
    sed -n 's/^API_IMAGE=//p' "$COMPOSE_ENV_FILE" |
        tail -n 1 |
        tr -d '\r'
)"

if [[ -z "$previous_image" ]]; then
    echo "Current API_IMAGE cannot be determined." >&2
    exit 1
fi

touch "$MAINTENANCE_FLAG"
chmod 0644 "$MAINTENANCE_FLAG"
deployment_started=1

echo "Maintenance mode enabled."
"${compose[@]}" stop "$API_SERVICE"

backup_output="$(
    env \
        POSTGRES_CONTAINER="$POSTGRES_CONTAINER" \
        POSTGRES_USER="$POSTGRES_USER" \
        POSTGRES_DB="$POSTGRES_DB" \
        BACKUP_DIR="$BACKUP_DIR" \
        "$BACKUP_SCRIPT"
)"
printf '%s\n' "$backup_output"

backup_path="$(
    printf '%s\n' "$backup_output" |
        sed -n 's/^Backup created: //p' |
        tail -n 1
)"

if [[ -z "$backup_path" || ! -s "$backup_path" ]]; then
    echo "A valid backup path was not returned." >&2
    false
fi

docker exec -i "$POSTGRES_CONTAINER" \
    pg_restore --list < "$backup_path" >/dev/null

database_may_have_changed=1

env \
    POSTGRES_CONTAINER="$POSTGRES_CONTAINER" \
    POSTGRES_USER="$POSTGRES_USER" \
    POSTGRES_DB="$POSTGRES_DB" \
    MIGRATIONS_DIR="$release_dir/migrations" \
    "$MIGRATION_SCRIPT"

update_api_image "$api_image"
environment_changed=1

"${compose[@]}" up -d --no-deps "$API_SERVICE"

wait_for_health

if [[ -L "$FRONTEND_PATH" ]]; then
    previous_frontend="$(readlink -f "$FRONTEND_PATH")"
elif [[ -d "$FRONTEND_PATH" ]]; then
    bootstrap_dir="$RELEASES_DIR/bootstrap-$(date -u +%Y%m%dT%H%M%SZ)"
    install -d -o root -g root -m 0755 "$bootstrap_dir"
    previous_frontend="$bootstrap_dir/frontend"
    frontend_changed=1
    mv "$FRONTEND_PATH" "$previous_frontend"
    activate_frontend "$previous_frontend"
else
    echo "Current frontend path is missing: $FRONTEND_PATH" >&2
    false
fi

frontend_changed=1
activate_frontend "$release_dir/frontend"

if [[ "$DEPLOY_TEST_FAILPOINT" == "after_frontend" ]]; then
    echo "Intentional deployment-test failure after frontend activation." >&2
    false
fi

printf '%s\n' "$release_sha" > "$current_release_file"
chmod 0600 "$current_release_file"

rm -f "$MAINTENANCE_FLAG"
deployment_started=0
trap - ERR

echo "Deployment $release_sha completed successfully."
