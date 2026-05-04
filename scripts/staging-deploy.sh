#!/usr/bin/env bash
# =============================================================================
# RevendaClick — Staging Deploy Script
# Run this ON the VPS after cloning the repo.
# Usage: bash scripts/staging-deploy.sh
# =============================================================================
set -euo pipefail

VPS_IP="2.24.67.84"
PROJECT_DIR="/opt/revendaclick"
COMPOSE_FILE="docker-compose.staging.yml"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

log()  { echo -e "${CYAN}[deploy]${NC} $*"; }
ok()   { echo -e "${GREEN}[ok]${NC} $*"; }
warn() { echo -e "${YELLOW}[warn]${NC} $*"; }
fail() { echo -e "${RED}[fail]${NC} $*"; exit 1; }

# ─── 1. Pre-flight checks ──────────────────────────────────────────────────────
log "Checking prerequisites..."

command -v docker  >/dev/null || fail "docker not found"
docker compose version >/dev/null 2>&1 || fail "docker compose V2 not found"

[[ -f ".env.staging" ]] || fail ".env.staging not found — copy it to $PROJECT_DIR first"
[[ -f "backend/.env"  ]] || fail "backend/.env not found — copy it to $PROJECT_DIR/backend first"

ok "Prerequisites OK"

# ─── 2. Load staging env ──────────────────────────────────────────────────────
log "Loading .env.staging..."
set -a; source .env.staging; set +a
ok "Env loaded: VPS_IP=$VPS_IP"

# ─── 3. Validate compose config ───────────────────────────────────────────────
log "Validating docker compose config..."
docker compose -f "$COMPOSE_FILE" config --quiet
ok "Compose config valid"

# ─── 4. Pull Evolution image ──────────────────────────────────────────────────
log "Pulling Evolution API image..."
docker pull atendai/evolution-api:latest
ok "Evolution image ready"

# ─── 5. Build backend ─────────────────────────────────────────────────────────
log "Building backend image..."
docker compose -f "$COMPOSE_FILE" build --no-cache backend
ok "Backend built"

# ─── 6. Build frontend ────────────────────────────────────────────────────────
log "Building frontend image (this takes ~2-3 minutes)..."
docker compose -f "$COMPOSE_FILE" build --no-cache frontend
ok "Frontend built"

# ─── 7. Start stack ───────────────────────────────────────────────────────────
log "Starting staging stack..."
docker compose -f "$COMPOSE_FILE" up -d

# ─── 8. Wait for health ───────────────────────────────────────────────────────
log "Waiting for containers to become healthy..."

wait_healthy() {
  local name=$1
  local max=60
  local i=0
  while [[ $i -lt $max ]]; do
    status=$(docker inspect --format='{{.State.Health.Status}}' "$name" 2>/dev/null || echo "missing")
    case "$status" in
      healthy)  ok "$name is healthy"; return 0 ;;
      starting) sleep 3; ((i+=3)) ;;
      *)        warn "$name status: $status"; sleep 3; ((i+=3)) ;;
    esac
  done
  fail "$name did not become healthy within ${max}s"
}

# Get container names (project prefix is the directory name)
PROJECT=$(basename "$PROJECT_DIR" | tr '[:upper:]' '[:lower:]' | tr -d '-_')

wait_healthy "revendaclick-backend-1"  2>/dev/null || \
  wait_healthy "${PROJECT}-backend-1"  2>/dev/null || \
  wait_healthy "$(docker compose -f $COMPOSE_FILE ps -q backend)" 2>/dev/null || \
  { warn "Could not resolve backend container name — checking manually"; docker compose -f $COMPOSE_FILE ps; }

wait_healthy "revendaclick-frontend-1" 2>/dev/null || \
  wait_healthy "${PROJECT}-frontend-1" 2>/dev/null || true

# ─── 9. Status summary ────────────────────────────────────────────────────────
echo ""
log "══════════════ STAGING STATUS ══════════════"
docker compose -f "$COMPOSE_FILE" ps
echo ""

# ─── 10. Endpoint validation ──────────────────────────────────────────────────
log "Validating endpoints..."

check_url() {
  local label=$1
  local url=$2
  local expected=${3:-200}
  local code
  code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$url" || echo "000")
  if [[ "$code" == "$expected" ]]; then
    ok "$label — HTTP $code"
  else
    warn "$label — HTTP $code (expected $expected) — URL: $url"
  fi
}

check_url "Backend health"    "http://localhost:8080/health"
check_url "Frontend health"   "http://localhost:3000/api/health"
check_url "Nginx frontend"    "http://localhost:80"
check_url "Nginx API proxy"   "http://localhost:80/health"
check_url "Evolution health"  "http://localhost:8081/" "200"

echo ""
log "══════════════ STAGING LOGS (last 20 lines each) ══════════════"
echo ""
log "--- backend ---"
docker compose -f "$COMPOSE_FILE" logs --tail=20 backend

echo ""
log "--- frontend ---"
docker compose -f "$COMPOSE_FILE" logs --tail=20 frontend

echo ""
log "--- nginx ---"
docker compose -f "$COMPOSE_FILE" logs --tail=10 nginx

echo ""
log "══════════════ STAGING READY ══════════════"
ok "Frontend:  http://$VPS_IP"
ok "Backend:   http://$VPS_IP:8080/health"
ok "Evolution: http://$VPS_IP:8081"
ok "API proxy: http://$VPS_IP/api/v1/health"
echo ""
warn "Staging is running on HTTP only — SSL via Coolify comes in the next phase."
