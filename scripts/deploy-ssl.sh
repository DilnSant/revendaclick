#!/usr/bin/env bash
# =============================================================================
# RevendaClick — Deploy com SSL (Traefik/Coolify + Let's Encrypt)
#
# Pré-requisitos na VPS:
#   - Coolify instalado e rodando (Traefik em 80/443)
#   - DNS: app.revendaclick.com.br → 2.24.67.84
#   - DNS: api.revendaclick.com.br → 2.24.67.84
#   - .env.staging copiado para o PROJECT_DIR
#
# Uso:
#   bash scripts/deploy-ssl.sh
# =============================================================================
set -euo pipefail

APP_DOMAIN="app.revendaclick.com.br"
API_DOMAIN="api.revendaclick.com.br"
VPS_IP="2.24.67.84"
PROJECT_DIR="${PROJECT_DIR:-/opt/revendaclick}"
COMPOSE_FILE="docker-compose.staging.yml"
ENV_FILE=".env.staging"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
log()  { echo -e "${CYAN}[ssl-deploy]${NC} $*"; }
ok()   { echo -e "${GREEN}[ok]${NC}   $*"; }
warn() { echo -e "${YELLOW}[warn]${NC} $*"; }
fail() { echo -e "${RED}[fail]${NC} $*"; exit 1; }

# ─── 1. Pre-flight checks ─────────────────────────────────────────────────────
log "Pre-flight checks..."

command -v docker  >/dev/null || fail "docker not installed"
docker compose version >/dev/null 2>&1 || fail "docker compose V2 required"

[[ -f "$ENV_FILE" ]] || [[ -f ".env" ]] || fail "No env file found (${ENV_FILE} or .env)"

# Check Coolify network exists
if ! docker network inspect coolify >/dev/null 2>&1; then
  fail "Docker network 'coolify' not found. Is Coolify installed and running?"
fi
ok "Docker network 'coolify' exists"

# Check Traefik is running
if ! docker ps --format '{{.Names}}' | grep -qi traefik; then
  warn "No Traefik container found — ensure Coolify is managing it"
else
  TRAEFIK=$(docker ps --format '{{.Names}}' | grep -i traefik | head -1)
  ok "Traefik running: $TRAEFIK"
fi

# ─── 2. DNS validation ────────────────────────────────────────────────────────
log "Validating DNS..."

check_dns() {
  local domain=$1
  local expected=$2
  local resolved
  resolved=$(dig +short "$domain" @8.8.8.8 2>/dev/null | tail -1)
  if [[ "$resolved" == "$expected" ]]; then
    ok "$domain → $resolved"
  else
    warn "$domain → $resolved (expected $expected) — SSL may fail if DNS is wrong"
  fi
}

check_dns "$APP_DOMAIN" "$VPS_IP"
check_dns "$API_DOMAIN" "$VPS_IP"

# ─── 3. Apply database migration 005 ─────────────────────────────────────────
log "Applying migration 005 (billing extended)..."
warn "Run migration 005 in Supabase Dashboard SQL Editor before continuing."
warn "File: database/migrations/005_billing_extended.sql"
echo ""
read -rp "  Migration 005 already applied? (y/N): " MIGRATED
[[ "${MIGRATED,,}" == "y" ]] || { warn "Apply migration 005 first, then re-run this script."; exit 0; }
ok "Migration 005 confirmed"

# ─── 4. Build and deploy ──────────────────────────────────────────────────────
log "Building Docker images..."
docker compose -f "$COMPOSE_FILE" --env-file "${ENV_FILE:-/.env}" build \
  --build-arg BUILDKIT_INLINE_CACHE=1 \
  2>&1 | tail -20

log "Stopping existing stack..."
docker compose -f "$COMPOSE_FILE" down --remove-orphans 2>/dev/null || true

log "Starting stack..."
docker compose -f "$COMPOSE_FILE" --env-file "${ENV_FILE:-.env}" up -d

# ─── 5. Wait for health ───────────────────────────────────────────────────────
log "Waiting for containers to become healthy..."

wait_healthy() {
  local name=$1
  local max=120
  local i=0
  while [[ $i -lt $max ]]; do
    status=$(docker inspect --format='{{.State.Health.Status}}' "$name" 2>/dev/null || echo "missing")
    case "$status" in
      healthy)  ok "$name healthy"; return 0 ;;
      starting) sleep 5; ((i+=5)) ;;
      *)        sleep 5; ((i+=5)) ;;
    esac
  done
  warn "$name health timeout — check: docker inspect $name"
  return 0
}

# Try several container name patterns
for svc in backend frontend; do
  for prefix in revendaclick opt_revendaclick revendaclick-opt; do
    name="${prefix}-${svc}-1"
    if docker inspect "$name" >/dev/null 2>&1; then
      wait_healthy "$name"
      break
    fi
  done
done

# ─── 6. Stack status ─────────────────────────────────────────────────────────
log "Stack status:"
docker compose -f "$COMPOSE_FILE" ps
echo ""

# ─── 7. SSL validation (with retry — cert issuance takes 10-30s) ─────────────
log "Waiting 30s for Traefik to issue Let's Encrypt certificates..."
sleep 30

check_url() {
  local label=$1
  local url=$2
  local expected=${3:-200}
  local code
  code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 15 \
    -H "Accept: application/json" "$url" 2>/dev/null || echo "000")
  if [[ "$code" == "$expected" ]]; then
    ok "$label — HTTP $code"
  else
    warn "$label — HTTP $code (expected $expected) — $url"
  fi
}

check_ssl() {
  local domain=$1
  local expiry
  expiry=$(echo | openssl s_client -servername "$domain" -connect "${domain}:443" 2>/dev/null \
    | openssl x509 -noout -enddate 2>/dev/null | cut -d= -f2 || echo "NOT YET ISSUED")
  if [[ "$expiry" == "NOT YET ISSUED" ]]; then
    warn "SSL cert for $domain not yet issued (Traefik may still be getting it)"
  else
    ok "SSL cert for $domain valid until: $expiry"
  fi
}

log "Checking HTTPS endpoints..."
check_url "app.revendaclick.com.br — HTTPS frontend" "https://$APP_DOMAIN"
check_url "api.revendaclick.com.br — HTTPS health"   "https://$API_DOMAIN/health"
check_url "api.revendaclick.com.br — HTTPS v1"       "https://$API_DOMAIN/api/v1/health"

log "Checking HTTP → HTTPS redirect..."
check_url "app — HTTP redirect" "http://$APP_DOMAIN" "301"
check_url "api — HTTP redirect" "http://$API_DOMAIN/health" "301"

log "Checking SSL certificates..."
check_ssl "$APP_DOMAIN"
check_ssl "$API_DOMAIN"

# Direct-port sanity checks
check_url "Direct backend:8085 health" "http://localhost:8085/health"
check_url "Direct frontend:3000 health" "http://localhost:3000/api/health"

# ─── 8. Proxy headers validation ─────────────────────────────────────────────
log "Validating proxy headers..."
HEADERS=$(curl -sI --max-time 10 "https://$APP_DOMAIN" 2>/dev/null || echo "")
if echo "$HEADERS" | grep -qi "X-Content-Type-Options"; then
  ok "Security headers present"
else
  warn "Security headers missing (check nginx conf)"
fi

# ─── 9. Summary ───────────────────────────────────────────────────────────────
echo ""
log "═══════════════════════════════════════════════"
ok "DEPLOY SSL CONCLUÍDO"
echo ""
echo -e "  Frontend:   ${GREEN}https://${APP_DOMAIN}${NC}"
echo -e "  API:        ${GREEN}https://${API_DOMAIN}${NC}"
echo -e "  API Health: ${GREEN}https://${API_DOMAIN}/health${NC}"
echo -e "  Evolution:  ${GREEN}https://evolution.revendaclick.com.br${NC}"
echo ""
echo -e "  Webhook Asaas:"
echo -e "  ${YELLOW}https://${API_DOMAIN}/api/webhooks/asaas${NC}"
echo -e "  Header: asaas-access-token: \$ASAAS_API_KEY"
echo ""
echo -e "  Debug (direct):"
echo -e "  Backend:  http://${VPS_IP}:8085/health"
echo -e "  Frontend: http://${VPS_IP}:3000/api/health"
echo -e "  Nginx:    http://${VPS_IP}:8090"
log "═══════════════════════════════════════════════"
