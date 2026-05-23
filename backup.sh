#!/usr/bin/env bash
# =============================================================================
# RevendaClick — Database Backup
# Runs inside the backup container (alpine:3.20 with postgresql-client)
# Schedule: daily at 03:00 UTC via docker-compose.production.yml backup service
# Retention: 7 days local at /opt/revendaclick/backups/
# =============================================================================
set -euo pipefail

BACKUP_DIR="/opt/revendaclick/backups"
TIMESTAMP=$(date +%Y-%m-%d_%H-%M-%S)
FILENAME="backup-${TIMESTAMP}.sql.gz"
FILEPATH="${BACKUP_DIR}/${FILENAME}"
RETAIN_DAYS=7

mkdir -p "$BACKUP_DIR"

echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] backup: starting — ${FILENAME}"

pg_dump "$DATABASE_URL" | gzip > "$FILEPATH"

SIZE=$(du -sh "$FILEPATH" | cut -f1)
echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] backup: dump ok — ${SIZE}"

find "$BACKUP_DIR" -name "backup-*.sql.gz" -mtime "+${RETAIN_DAYS}" -delete
echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] backup: retention cleaned (>${RETAIN_DAYS}d)"

echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] backup: done"
