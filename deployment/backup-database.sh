#!/usr/bin/env bash

set -Eeuo pipefail

POSTGRES_CONTAINER="${POSTGRES_CONTAINER:?POSTGRES_CONTAINER is required}"
POSTGRES_USER="${POSTGRES_USER:-postgres}"
POSTGRES_DB="${POSTGRES_DB:-practice_grading}"
BACKUP_DIR="${BACKUP_DIR:?BACKUP_DIR is required}"

timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
backup_path="$BACKUP_DIR/${POSTGRES_DB}_${timestamp}.dump"
temporary_path="${backup_path}.tmp"

umask 077
mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR"

if [[ -e "$backup_path" || -e "$temporary_path" ]]; then
    echo "Backup file already exists: $backup_path" >&2
    exit 1
fi

cleanup() {
    rm -f "$temporary_path"
}

trap cleanup EXIT

echo "Creating database backup..."

docker exec "$POSTGRES_CONTAINER" \
    pg_dump \
        -U "$POSTGRES_USER" \
        -d "$POSTGRES_DB" \
        --format=custom \
        --no-owner \
        --no-acl \
    > "$temporary_path"

if [[ ! -s "$temporary_path" ]]; then
    echo "Database backup is empty." >&2
    exit 1
fi

mv "$temporary_path" "$backup_path"
trap - EXIT

echo "Backup created: $backup_path"