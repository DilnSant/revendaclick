#!/usr/bin/env bash
# =============================================================================
# RevendaClick — Configurar lifecycle S3 para backups
# Executar UMA VEZ após criar o bucket S3.
#
# Retenção configurada: 30 dias para objetos em revendaclick/
# (backups locais: 7 dias — configurado em backup.sh)
#
# Usa aws-cli do container rc_backup — não exige instalação local.
#
# Usage: ./scripts/configure-s3-lifecycle.sh
# =============================================================================
set -euo pipefail

ENV_FILE="/opt/revendaclick/.env"
RETENTION_DAYS=30

log() { echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] lifecycle: $*"; }

# ── Load environment ──────────────────────────────────────────────────────────
if [[ -f "$ENV_FILE" ]]; then
  set -a; source "$ENV_FILE"; set +a
fi

BUCKET="${BACKUP_S3_BUCKET:-}"
REGION="${AWS_REGION:-${AWS_DEFAULT_REGION:-sa-east-1}}"

if [[ -z "$BUCKET" ]]; then
  log "ERROR — BACKUP_S3_BUCKET não configurado em ${ENV_FILE}"
  exit 1
fi

# ── Verificar container ───────────────────────────────────────────────────────
if ! docker inspect rc_backup > /dev/null 2>&1; then
  log "ERROR — rc_backup container não está rodando"
  log "Iniciar com: docker compose -f /opt/revendaclick/docker-compose.production.yml up -d backup"
  exit 1
fi

log "configurando lifecycle para: s3://${BUCKET}/revendaclick/"
log "retenção: ${RETENTION_DAYS} dias"

# ── Aplicar lifecycle policy ──────────────────────────────────────────────────
docker exec rc_backup aws s3api put-bucket-lifecycle-configuration \
  --bucket "$BUCKET" \
  --region "$REGION" \
  --lifecycle-configuration "{
    \"Rules\": [{
      \"ID\": \"revendaclick-backup-${RETENTION_DAYS}d\",
      \"Filter\": {\"Prefix\": \"revendaclick/\"},
      \"Status\": \"Enabled\",
      \"Expiration\": {\"Days\": ${RETENTION_DAYS}}
    }]
  }"

log "lifecycle aplicado. Verificando..."

# ── Verificar ─────────────────────────────────────────────────────────────────
docker exec rc_backup aws s3api get-bucket-lifecycle-configuration \
  --bucket "$BUCKET" \
  --region "$REGION" \
  | grep -E '"ID"|"Days"|"Status"'

echo ""
log "OK — objetos em revendaclick/ serão deletados automaticamente após ${RETENTION_DAYS} dias."
log "Retenção local: 7 dias (configurado em backup.sh — RETAIN_DAYS=7)"
