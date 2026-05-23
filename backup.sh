#!/usr/bin/env bash
# =============================================================================
# RevendaClick — Database Backup
# Runs inside the backup container (alpine:3.20 with postgresql-client + aws-cli)
# Schedule: daily at 03:00 UTC via docker-compose.production.yml backup service
# =============================================================================
set -euo pipefail

BACKUP_DIR="/opt/revendaclick/backups"
TIMESTAMP=$(date +%Y-%m-%d_%H-%M-%S)
FILENAME="backup-${TIMESTAMP}.sql.gz"
FILEPATH="${BACKUP_DIR}/${FILENAME}"
RETAIN_DAYS=7

mkdir -p "$BACKUP_DIR"

echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] backup: starting — ${FILENAME}"

# Dump and compress in one pass
pg_dump "$DATABASE_URL" | gzip > "$FILEPATH"

SIZE=$(du -sh "$FILEPATH" | cut -f1)
echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] backup: dump ok — ${SIZE}"

# Upload to S3 (optional)
if [ -n "${BACKUP_S3_BUCKET:-}" ]; then
  S3_PATH="s3://${BACKUP_S3_BUCKET}/revendaclick/${FILENAME}"
  aws s3 cp "$FILEPATH" "$S3_PATH" --no-progress
  echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] backup: uploaded → ${S3_PATH}"
fi

# Prune local files older than RETAIN_DAYS
find "$BACKUP_DIR" -name "backup-*.sql.gz" -mtime "+${RETAIN_DAYS}" -delete
echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] backup: local retention cleaned (>${RETAIN_DAYS}d)"

echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] backup: done"
