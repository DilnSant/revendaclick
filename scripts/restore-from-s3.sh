#!/usr/bin/env bash
# =============================================================================
# RevendaClick — Restore Validation from S3
# Runs on VPS host. Uses rc_backup container for aws-cli (no host install needed).
#
# Usage:
#   ./scripts/restore-from-s3.sh                        # valida backup mais recente
#   ./scripts/restore-from-s3.sh backup-2026-07-01.sql.gz  # valida arquivo específico
#
# O script valida integridade do arquivo (gzip + header SQL).
# NÃO executa restore automático — exibe o comando para restore manual.
# =============================================================================
set -uo pipefail

ENV_FILE="/opt/revendaclick/.env"
BACKUPS_DIR="/opt/revendaclick/backups"
VALIDATE_FILE="${BACKUPS_DIR}/.restore-validate-$$.sql.gz"
EXIT_CODE=0

log()  { echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] restore: $*"; }
fail() { log "ERROR — $*"; EXIT_CODE=1; }

# ── Load environment ──────────────────────────────────────────────────────────
if [[ -f "$ENV_FILE" ]]; then
  set -a; source "$ENV_FILE"; set +a
fi

BUCKET="${BACKUP_S3_BUCKET:-}"
REGION="${AWS_REGION:-${AWS_DEFAULT_REGION:-sa-east-1}}"

if [[ -z "$BUCKET" ]]; then
  fail "BACKUP_S3_BUCKET não configurado em ${ENV_FILE}"
  exit 1
fi

# ── Verificar container ───────────────────────────────────────────────────────
if ! docker inspect rc_backup > /dev/null 2>&1; then
  fail "rc_backup container não está rodando"
  log "Iniciar com: docker compose -f /opt/revendaclick/docker-compose.production.yml up -d backup"
  exit 1
fi

# Cleanup automático ao sair
trap 'rm -f "${VALIDATE_FILE}" 2>/dev/null || true' EXIT

# Wrapper: executa aws-cli dentro do container rc_backup
aws_rc() { docker exec rc_backup aws "$@"; }

mkdir -p "$BACKUPS_DIR"

# ── Localizar arquivo no S3 ───────────────────────────────────────────────────
if [[ -n "${1:-}" ]]; then
  TARGET_FILE="$1"
  log "buscando no S3: ${TARGET_FILE}"
  S3_KEY=$(aws_rc s3 ls "s3://${BUCKET}/revendaclick/" --recursive --region "$REGION" \
    | awk '{print $4}' | grep "${TARGET_FILE}" | tail -1 || true)
  if [[ -z "$S3_KEY" ]]; then
    fail "${TARGET_FILE} não encontrado em s3://${BUCKET}/revendaclick/"
    exit 1
  fi
else
  log "sem argumento — localizando backup mais recente no S3..."
  S3_KEY=$(aws_rc s3 ls "s3://${BUCKET}/revendaclick/" --recursive --region "$REGION" \
    | sort | tail -1 | awk '{print $4}' || true)
  if [[ -z "$S3_KEY" ]]; then
    fail "nenhum backup encontrado em s3://${BUCKET}/revendaclick/"
    exit 1
  fi
  TARGET_FILE=$(basename "$S3_KEY")
fi

log "alvo: s3://${BUCKET}/${S3_KEY}"

# ── Download ──────────────────────────────────────────────────────────────────
log "baixando para validação..."
if ! aws_rc s3 cp "s3://${BUCKET}/${S3_KEY}" "$VALIDATE_FILE" \
    --region "$REGION" --no-progress 2>&1; then
  fail "download S3 falhou"
  exit 1
fi

SIZE=$(du -sh "$VALIDATE_FILE" | cut -f1)
log "download ok — ${SIZE}"

# ── Integridade gzip ──────────────────────────────────────────────────────────
log "verificando integridade gzip..."
if gzip -t "$VALIDATE_FILE" 2>&1; then
  log "gzip: OK"
else
  fail "integridade gzip FALHOU — arquivo pode estar corrompido"
fi

# ── Header SQL ────────────────────────────────────────────────────────────────
log "verificando header do dump SQL..."
if zcat "$VALIDATE_FILE" 2>/dev/null | head -5 | grep -q "PostgreSQL database dump"; then
  log "SQL header: OK — dump PostgreSQL válido"
else
  log "WARN — header PostgreSQL não encontrado nas primeiras 5 linhas:"
  zcat "$VALIDATE_FILE" 2>/dev/null | head -5 || true
fi

# ── Sumário ───────────────────────────────────────────────────────────────────
echo ""
log "=== RESULTADO DA VALIDAÇÃO ==="
log "arquivo:  ${TARGET_FILE}"
log "tamanho:  ${SIZE}"
log "origem:   s3://${BUCKET}/${S3_KEY}"
if [[ $EXIT_CODE -eq 0 ]]; then
  log "status:   APROVADO — backup íntegro"
else
  log "status:   REPROVADO — ver erros acima"
fi

echo ""
log "Para restaurar em produção (DESTRUTIVO — sobrescreve todos os dados):"
log "  zcat '${VALIDATE_FILE}' | psql \"\${DATABASE_URL}\""
echo ""
log "Para restaurar em banco de teste:"
log "  psql postgresql://user:senha@host/testdb < <(zcat '${VALIDATE_FILE}')"
echo ""
log "Arquivo temporário removido ao sair (trap EXIT)."

exit $EXIT_CODE
