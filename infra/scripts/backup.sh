#!/usr/bin/env bash
# Daily backup — PostgreSQL dump + Docker volumes
# Usage: ./backup.sh
# Recommended: add to cron — 0 3 * * * /opt/revendaclick/backup.sh >> /var/log/revendaclick-backup.log 2>&1
set -euo pipefail

BACKUP_DIR="/opt/revendaclick/backups"
RETENTION_DAYS=7
DATE=$(date +%Y-%m-%d_%H-%M-%S)
ENV_FILE="/opt/revendaclick/.env"

# Load environment
if [[ -f "$ENV_FILE" ]]; then
  set -a; source "$ENV_FILE"; set +a
fi

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "ERROR: DATABASE_URL not set" >&2
  exit 1
fi

mkdir -p "$BACKUP_DIR"

echo "[$(date)] Starting backup..."

# ── PostgreSQL dump ───────────────────────────────────────────────────────────
DB_DUMP="$BACKUP_DIR/db_${DATE}.sql.gz"
echo "[$(date)] Dumping database → $DB_DUMP"
pg_dump "$DATABASE_URL" | gzip > "$DB_DUMP"
echo "[$(date)] DB dump: $(du -sh "$DB_DUMP" | cut -f1)"

# ── Docker volume backup (Evolution instances + store) ────────────────────────
for VOLUME in evolution_instances evolution_store; do
  ARCHIVE="$BACKUP_DIR/${VOLUME}_${DATE}.tar.gz"
  echo "[$(date)] Backing up volume $VOLUME → $ARCHIVE"
  docker run --rm \
    -v "revendaclick_${VOLUME}:/data:ro" \
    -v "$BACKUP_DIR:/backup" \
    alpine:3.20 \
    tar czf "/backup/${VOLUME}_${DATE}.tar.gz" -C /data . 2>/dev/null || \
    echo "[$(date)] WARNING: volume $VOLUME not found, skipping"
done

# ── Prune old backups ─────────────────────────────────────────────────────────
echo "[$(date)] Pruning backups older than ${RETENTION_DAYS} days"
find "$BACKUP_DIR" -name "*.gz" -mtime "+${RETENTION_DAYS}" -delete

# ── Optional: upload to S3-compatible storage ─────────────────────────────────
if [[ -n "${BACKUP_S3_BUCKET:-}" && -n "${AWS_ACCESS_KEY_ID:-}" ]]; then
  echo "[$(date)] Uploading to s3://${BACKUP_S3_BUCKET}/revendaclick/${DATE}/"
  aws s3 cp "$DB_DUMP" "s3://${BACKUP_S3_BUCKET}/revendaclick/${DATE}/" --quiet
fi

echo "[$(date)] Backup complete."
ls -lh "$BACKUP_DIR" | tail -10
