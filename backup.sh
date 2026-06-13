#!/usr/bin/env bash
# =============================================================================
# RevendaClick — Database Backup
# Runs inside rc_backup container (postgres:17-alpine — aws-cli installed at startup)
# Schedule: daily at 03:00 UTC via docker-compose.production.yml backup service
# Local retention:  7 days at /opt/revendaclick/backups/
# S3 retention:    30 days via bucket lifecycle (scripts/configure-s3-lifecycle.sh)
# S3 prefix:       revendaclick/YYYY/MM/backup-TIMESTAMP.sql.gz
# =============================================================================
set -uo pipefail

BACKUP_DIR="/opt/revendaclick/backups"
TIMESTAMP=$(date -u +%Y-%m-%dT%H-%M-%SZ)
YEAR=$(date -u +%Y)
MONTH=$(date -u +%m)
FILENAME="backup-${TIMESTAMP}.sql.gz"
FILEPATH="${BACKUP_DIR}/${FILENAME}"
RETAIN_DAYS=7
S3_CONFIGURED=false
S3_OK=false

log() { echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] backup: $*"; }

mkdir -p "$BACKUP_DIR"
log "starting — ${FILENAME}"

# ── pg_dump ───────────────────────────────────────────────────────────────────
if ! pg_dump "$DATABASE_URL" | gzip > "$FILEPATH"; then
  log "ERROR — pg_dump failed"
  rm -f "$FILEPATH"
  exit 1
fi
SIZE=$(du -sh "$FILEPATH" | cut -f1)
log "dump ok — ${SIZE}"

# ── S3 upload ─────────────────────────────────────────────────────────────────
if [ -n "${BACKUP_S3_BUCKET:-}" ] && [ -n "${AWS_ACCESS_KEY_ID:-}" ] && [ -n "${AWS_SECRET_ACCESS_KEY:-}" ]; then
  S3_CONFIGURED=true
  REGION="${AWS_REGION:-${AWS_DEFAULT_REGION:-sa-east-1}}"
  S3_KEY="revendaclick/${YEAR}/${MONTH}/${FILENAME}"
  S3_URI="s3://${BACKUP_S3_BUCKET}/${S3_KEY}"

  log "S3 uploading — ${S3_URI}"

  if aws s3 cp "$FILEPATH" "$S3_URI" --region "$REGION" --no-progress 2>&1; then
    if aws s3 ls "$S3_URI" --region "$REGION" > /dev/null 2>&1; then
      log "S3 ok — verified (region: ${REGION})"
      S3_OK=true
    else
      log "ERROR — S3 verify failed — object not found after upload"
    fi
  else
    log "ERROR — S3 upload failed (local copy preserved at ${FILEPATH})"
  fi
elif [ -n "${BACKUP_S3_BUCKET:-}" ]; then
  log "WARN — BACKUP_S3_BUCKET set but AWS credentials incomplete — S3 skipped"
else
  log "S3 not configured — local only"
fi

# ── Local retention ───────────────────────────────────────────────────────────
DELETED=$(find "$BACKUP_DIR" -name "backup-*.sql.gz" -mtime "+${RETAIN_DAYS}" -print -delete 2>/dev/null | wc -l | tr -d ' ')
log "retention: ${DELETED} local file(s) removed (>${RETAIN_DAYS}d)"

# ── Result ────────────────────────────────────────────────────────────────────
if $S3_CONFIGURED && ! $S3_OK; then
  log "done — S3 ERROR (local backup preserved)"
  exit 1
fi
log "done — OK"
