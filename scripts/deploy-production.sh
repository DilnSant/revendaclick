#!/usr/bin/env bash
# =============================================================================
# RevendaClick — Deploy de Produção Manual
# Run as root on the VPS: bash /opt/revendaclick/scripts/deploy-production.sh
# =============================================================================
set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
ok()   { echo -e "${GREEN}[OK]${NC}   $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
info() { echo -e "${BLUE}[INFO]${NC} $1"; }

APP_DIR="/opt/revendaclick"
COMPOSE_FILE="$APP_DIR/docker-compose.production.yml"
ENV_FILE="$APP_DIR/.env"
IMAGE_TAG="${1:-latest}"

cd "$APP_DIR"

echo ""
echo "════════════════════════════════════════════════════════"
echo "  RevendaClick — Deploy de Produção"
echo "  Tag: $IMAGE_TAG"
echo "════════════════════════════════════════════════════════"

# 1. Git pull
info "Atualizando repositório..."
git pull origin main && ok "git pull OK"

# 2. Atualizar nginx.conf
info "Atualizando nginx..."
if [ -f "$APP_DIR/nginx.conf" ]; then
  cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.bak.$(date +%s)
  cp "$APP_DIR/nginx.conf" /etc/nginx/nginx.conf
  nginx -t && systemctl reload nginx && ok "Nginx recarregado"
else
  warn "nginx.conf não encontrado em $APP_DIR"
fi

# 3. GHCR login
if [ -n "${GHCR_TOKEN:-}" ]; then
  info "Login GHCR..."
  echo "$GHCR_TOKEN" | docker login ghcr.io -u dilnsant --password-stdin && ok "GHCR login OK"
fi

# 4. Pull imagem backend
info "Pulling imagem backend (tag: $IMAGE_TAG)..."
BACKEND_IMAGE=$(grep BACKEND_IMAGE "$ENV_FILE" | cut -d= -f2 || echo "ghcr.io/dilnsant/revendaclick-backend")
IMAGE_TAG="$IMAGE_TAG" BACKEND_IMAGE="$BACKEND_IMAGE" \
  docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" pull backend
ok "Imagem backend atualizada"

# 5. Reiniciar stack
info "Reiniciando containers..."
IMAGE_TAG="$IMAGE_TAG" BACKEND_IMAGE="$BACKEND_IMAGE" \
  docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d \
  --remove-orphans \
  --force-recreate backend

ok "Backend reiniciado"

# 6. Aguardar healthcheck
info "Aguardando backend ficar healthy..."
MAX=24; N=0
while [ $N -lt $MAX ]; do
  STATUS=$(docker inspect rc_backend --format='{{.State.Health.Status}}' 2>/dev/null || echo "missing")
  if [ "$STATUS" = "healthy" ]; then
    ok "rc_backend healthy"
    break
  fi
  echo -n "  aguardando ($STATUS)... "
  sleep 5
  N=$((N+1))
done
if [ $N -eq $MAX ]; then
  warn "rc_backend não ficou healthy em tempo hábil"
  docker logs rc_backend --tail 30 2>&1
fi

# 7. Validar health endpoint
HEALTH=$(curl -sf --max-time 10 https://api.revendaclick.com.br/health 2>&1 || echo "FAILED")
if echo "$HEALTH" | grep -q '"status":"ok"'; then
  ok "API health OK — $HEALTH"
else
  echo -e "${RED}[ERR]${NC}  API health falhou — $HEALTH"
fi

# 8. Prune imagens antigas
docker image prune -f --filter "until=24h" && ok "Imagens antigas removidas"

# 9. Status final
echo ""
echo "─── Status final ────────────────────────────────────────"
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" ps \
  --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null

echo ""
echo "════════════════════════════════════════════════════════"
ok "Deploy concluído"
echo "  API: https://api.revendaclick.com.br/health"
echo "  Frontend: https://app.revendaclick.com.br/"
echo "════════════════════════════════════════════════════════"
