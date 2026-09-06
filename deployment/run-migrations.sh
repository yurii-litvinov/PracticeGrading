#!/usr/bin/env bash

set -Eeuo pipefail

POSTGRES_CONTAINER="${POSTGRES_CONTAINER:?POSTGRES_CONTAINER is required}"
POSTGRES_USER="${POSTGRES_USER:-postgres}"
POSTGRES_DB="${POSTGRES_DB:-practice_grading}"
MIGRATIONS_DIR="${MIGRATIONS_DIR:?MIGRATIONS_DIR is required}"

if [[ ! -d "$MIGRATIONS_DIR" ]]; then
    echo "Migrations directory does not exist: $MIGRATIONS_DIR" >&2
    exit 1
fi

run_psql() {
    docker exec -i "$POSTGRES_CONTAINER" \
        psql \
            -v ON_ERROR_STOP=1 \
            -U "$POSTGRES_USER" \
            -d "$POSTGRES_DB" \
            "$@"
}

echo "Preparing migration history table..."

run_psql <<'SQL'
CREATE TABLE IF NOT EXISTS "__SchemaMigrations" (
    "Version" text NOT NULL,
    "Name" text NOT NULL,
    "Checksum" character varying(64) NOT NULL,
    "AppliedAt" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PK___SchemaMigrations"
        PRIMARY KEY ("Version")
);
SQL

shopt -s nullglob

migration_files=("$MIGRATIONS_DIR"/[0-9][0-9][0-9]_*.sql)

if (( ${#migration_files[@]} == 0 )); then
    echo "No migration files found."
    exit 0
fi

IFS=$'\n' migration_files=($(printf '%s\n' "${migration_files[@]}" | LC_ALL=C sort))
unset IFS

declare -A encountered_versions=()

for migration_file in "${migration_files[@]}"; do
    filename="$(basename "$migration_file")"

    if [[ ! "$filename" =~ ^([0-9]{3})_([a-z0-9_]+)\.sql$ ]]; then
        echo "Invalid migration filename: $filename" >&2
        exit 1
    fi

    version="${BASH_REMATCH[1]}"
    name="${BASH_REMATCH[2]}"
    checksum="$(sha256sum "$migration_file" | awk '{print $1}')"

    if [[ -n "${encountered_versions[$version]:-}" ]]; then
        echo "Duplicate migration version: $version" >&2
        exit 1
    fi

    encountered_versions["$version"]=1

    applied_checksum="$(
        run_psql \
            -v migration_version="$version" \
            -At <<'SQL'
SELECT "Checksum"
FROM "__SchemaMigrations"
WHERE "Version" = :'migration_version';
SQL
    )"

    if [[ -n "$applied_checksum" ]]; then
        if [[ "$applied_checksum" != "$checksum" ]]; then
            echo "Checksum mismatch for already applied migration: $filename" >&2
            exit 1
        fi

        echo "Already applied: $filename"
        continue
    fi

    echo "Applying: $filename"

    {
        printf 'BEGIN;\n'
        sed -n '1,$p' "$migration_file"
        printf '\n'
        printf '%s\n' \
            'INSERT INTO "__SchemaMigrations"' \
            '    ("Version", "Name", "Checksum")' \
            "VALUES (:'migration_version', :'migration_name', :'migration_checksum');"
        printf 'COMMIT;\n'
    } |
        run_psql \
            -v migration_version="$version" \
            -v migration_name="$name" \
            -v migration_checksum="$checksum"

    echo "Applied: $filename"
done

echo "All migrations are up to date."
