#!/usr/bin/env bash
# =============================================================================
# RevendaClick — Database Backup
# Runs inside the backup container (alpine:3.20 with postgresql-client)
# Schedule: daily at 03:00 UTC via docker-compose.production.yml backup service
# Retention: 7 days local at /opt/revendaclick/backups/
# Optional S3: set BACKUP_S3_BUCKET + AWS_* vars
# =============================================================================
set -euo pipefail

BACKUP_DIR="/opt/revendaclick/backups"
TIMESTAMP=$(date -u +%Y-%m-%d_%H-%M-%S)
FILENAME="backup-${TIMESTAMP}.sql.gz"
FILEPATH="${BACKUP_DIR}/${FILENAME}"
RETAIN_DAYS=7

mkdir -p "$BACKUP_DIR"

echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] backup: starting — ${FILENAME}"

pg_dump "$DATABASE_URL" | gzip > "$FILEPATH"

SIZE=$(du -sh "$FILEPATH" | cut -f1)
echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] backup: dump ok — ${SIZE}"

# ── Optional S3 upload ────────────────────────────────────────────────────────
if [ -n "${BACKUP_S3_BUCKET:-}" ]; then
  if ! command -v aws &>/dev/null; then
    apk add --no-cache aws-cli > /dev/null 2>&1 || true
  fi
  if command -v aws &>/dev/null; then
    S3_KEY="backups/${FILENAME}"
    aws s3 cp "$FILEPATH" "s3://${BACKUP_S3_BUCKET}/${S3_KEY}" \
      --region "${AWS_DEFAULT_REGION:-sa-east-1}" \
      --no-progress \
      && echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] backup: uploaded to s3://${BACKUP_S3_BUCKET}/${S3_KEY}" \
      || echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] backup: WARN — S3 upload failed (local copy kept)"
  else
    echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] backup: WARN — aws-cli not available, skipping S3 upload"
  fi
fi

find "$BACKUP_DIR" -name "backup-*.sql.gz" -mtime "+${RETAIN_DAYS}" -delete
echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] backup: retention cleaned (>${RETAIN_DAYS}d)"

echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] backup: done"
