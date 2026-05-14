#!/usr/bin/env bash
# =============================================================================
# RevendaClick — Production Validation Script
# Run as root on the VPS: bash /opt/revendaclick/scripts/validate-production.sh
# =============================================================================
set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
ok()   { echo -e "${GREEN}[OK]${NC}   $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
info() { echo -e "${BLUE}[INFO]${NC} $1"; }
err()  { echo -e "${RED}[ERR]${NC}  $1"; ERRORS=$((ERRORS+1)); }

ERRORS=0
APP_DIR="/opt/revendaclick"
COMPOSE_FILE="$APP_DIR/docker-compose.production.yml"
ENV_FILE="$APP_DIR/.env"

echo ""
echo "════════════════════════════════════════════════════════"
echo "  RevendaClick — Validação de Produção"
echo "  $(date '+%Y-%m-%d %H:%M:%S UTC')"
echo "════════════════════════════════════════════════════════"

# ── 1. Containers ─────────────────────────────────────────────────────────────
echo ""
echo "─── 1. CONTAINERS ───────────────────────────────────────"

if ! command -v docker &>/dev/null; then
  err "Docker não encontrado"; exit 1
fi

docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null

for CONTAINER in rc_backend rc_evolution rc_redis; do
  STATUS=$(docker inspect "$CONTAINER" --format='{{.State.Status}}' 2>/dev/null || echo "missing")
  HEALTH=$(docker inspect "$CONTAINER" --format='{{.State.Health.Status}}' 2>/dev/null || echo "no_healthcheck")

  if [ "$STATUS" = "running" ]; then
    if [ "$HEALTH" = "healthy" ] || [ "$HEALTH" = "no_healthcheck" ]; then
      ok "$CONTAINER — $STATUS / $HEALTH"
    else
      warn "$CONTAINER — $STATUS / $HEALTH (ainda iniciando?)"
    fi
  else
    err "$CONTAINER — $STATUS / $HEALTH"
    echo "     Logs recentes:"
    docker logs "$CONTAINER" --tail 20 2>&1 | sed 's/^/     /' || true
  fi
done

# ── 2. Backend API ────────────────────────────────────────────────────────────
echo ""
echo "─── 2. BACKEND API ──────────────────────────────────────"

HEALTH_RESP=$(curl -sf --max-time 5 http://127.0.0.1:8080/health 2>&1 || echo "FAILED")
if echo "$HEALTH_RESP" | grep -q '"status":"ok"'; then
  ok "/health interno — $HEALTH_RESP"
else
  err "/health interno falhou — $HEALTH_RESP"
fi

HTTPS_RESP=$(curl -sf --max-time 10 https://api.revendaclick.com.br/health 2>&1 || echo "FAILED")
if echo "$HTTPS_RESP" | grep -q '"status":"ok"'; then
  ok "/health HTTPS — $HTTPS_RESP"
else
  err "/health HTTPS falhou — $HTTPS_RESP"
fi

# Checar variáveis de ambiente carregadas no container
info "Verificando variáveis de ambiente no backend..."
for VAR in DATABASE_URL SUPABASE_URL SUPABASE_JWT_SECRET SUPABASE_SERVICE_ROLE_KEY ASAAS_API_KEY OPENROUTER_API_KEY EVOLUTION_API_KEY; do
  VAL=$(docker exec rc_backend env 2>/dev/null | grep "^${VAR}=" | cut -d= -f2 || true)
  if [ -n "$VAL" ]; then
    ok "$VAR — presente (${#VAL} chars)"
  else
    err "$VAR — AUSENTE no container"
  fi
done

# ── 3. Evolution API ──────────────────────────────────────────────────────────
echo ""
echo "─── 3. EVOLUTION API ────────────────────────────────────"

EVO_RESP=$(curl -sf --max-time 10 http://127.0.0.1:8081/ 2>&1 || echo "FAILED")
if echo "$EVO_RESP" | grep -qi "working\|evolution"; then
  ok "Evolution interno — OK"
else
  err "Evolution interno falhou — $EVO_RESP"
fi

EVO_HTTPS=$(curl -sf --max-time 10 https://evolution.revendaclick.com.br/ 2>&1 || echo "FAILED")
if echo "$EVO_HTTPS" | grep -qi "working\|evolution"; then
  ok "Evolution HTTPS — OK"
else
  err "Evolution HTTPS falhou — $EVO_HTTPS"
fi

# ── 4. Nginx ──────────────────────────────────────────────────────────────────
echo ""
echo "─── 4. NGINX ────────────────────────────────────────────"

if systemctl is-active --quiet nginx; then
  ok "Nginx ativo"
else
  err "Nginx INATIVO"
  systemctl status nginx --no-pager | tail -10 || true
fi

nginx -t 2>&1 && ok "nginx -t OK" || err "nginx config inválido"

# HTTP→HTTPS redirect
REDIRECT=$(curl -si --max-time 5 http://api.revendaclick.com.br/ 2>&1 | head -5 || echo "FAILED")
if echo "$REDIRECT" | grep -q "301\|302"; then
  ok "HTTP→HTTPS redirect ativo"
else
  warn "HTTP→HTTPS redirect — verifique manualmente"
fi

# Security headers
HEADERS=$(curl -si --max-time 5 https://api.revendaclick.com.br/health 2>&1 | head -30 || echo "")
for H in "Strict-Transport-Security" "X-Frame-Options" "X-Content-Type-Options" "X-XSS-Protection"; do
  COUNT=$(echo "$HEADERS" | grep -ic "$H" || true)
  if [ "$COUNT" -eq 1 ]; then
    ok "Header $H — presente (sem duplicata)"
  elif [ "$COUNT" -eq 0 ]; then
    warn "Header $H — ausente"
  else
    warn "Header $H — duplicado ($COUNT vezes) — atualizar nginx.conf"
  fi
done

# ── 5. SSL ────────────────────────────────────────────────────────────────────
echo ""
echo "─── 5. SSL ──────────────────────────────────────────────"

for DOMAIN in api.revendaclick.com.br evolution.revendaclick.com.br; do
  CERT_INFO=$(certbot certificates 2>/dev/null | grep -A5 "$DOMAIN" | grep "Expiry" || true)
  if [ -n "$CERT_INFO" ]; then
    ok "$DOMAIN — $CERT_INFO"
  else
    warn "$DOMAIN — certificado não encontrado via certbot"
  fi

  # Verifica expiração via openssl
  EXPIRY=$(echo | openssl s_client -servername "$DOMAIN" -connect "$DOMAIN:443" 2>/dev/null \
    | openssl x509 -noout -dates 2>/dev/null | grep notAfter || echo "não verificado")
  info "  $DOMAIN expiry: $EXPIRY"
done

# ── 6. Firewall ───────────────────────────────────────────────────────────────
echo ""
echo "─── 6. FIREWALL ─────────────────────────────────────────"

if command -v ufw &>/dev/null; then
  UFW_STATUS=$(ufw status 2>/dev/null | head -3)
  if echo "$UFW_STATUS" | grep -q "active"; then
    ok "UFW ativo"
    ufw status | grep -E "22|80|443" | while read -r LINE; do info "  $LINE"; done
  else
    warn "UFW inativo"
  fi
fi

# Portas expostas
PORTS=$(ss -tlnp 2>/dev/null | grep -E ':80|:443|:8080|:8081' || true)
info "Portas em uso:"
echo "$PORTS" | while read -r LINE; do info "  $LINE"; done

# Verificar que 8080/8081 só escutam em 127.0.0.1
if ss -tlnp 2>/dev/null | grep -E ':8080|:8081' | grep -v '127.0.0.1'; then
  err "ATENÇÃO: porta 8080/8081 exposta publicamente!"
else
  ok "Portas 8080/8081 isoladas em 127.0.0.1"
fi

# ── 7. Disco e Memória ────────────────────────────────────────────────────────
echo ""
echo "─── 7. RECURSOS ─────────────────────────────────────────"

df -h / | tail -1 | awk '{print "Disco /: "  $3 " usado de " $2 " (" $5 " usado)"}' | while read -r L; do info "$L"; done
free -h | grep Mem | awk '{print "RAM: " $3 " usada de " $2}' | while read -r L; do info "$L"; done
docker system df 2>/dev/null | while read -r L; do info "Docker: $L"; done

# ── 8. Persistência e Restart ─────────────────────────────────────────────────
echo ""
echo "─── 8. PERSISTÊNCIA ─────────────────────────────────────"

for CONTAINER in rc_backend rc_evolution rc_redis; do
  POLICY=$(docker inspect "$CONTAINER" --format='{{.HostConfig.RestartPolicy.Name}}' 2>/dev/null || echo "missing")
  if [ "$POLICY" = "unless-stopped" ]; then
    ok "$CONTAINER restart: unless-stopped"
  elif [ "$POLICY" = "missing" ]; then
    warn "$CONTAINER — container não encontrado"
  else
    warn "$CONTAINER restart: $POLICY (esperado: unless-stopped)"
  fi
done

info "Volumes Docker:"
docker volume ls --format "  {{.Name}}" 2>/dev/null | grep -i "revenda\|backend\|evolution" || true

# ── 9. Backup ─────────────────────────────────────────────────────────────────
echo ""
echo "─── 9. BACKUP ───────────────────────────────────────────"

if crontab -l 2>/dev/null | grep -q "backup\|certbot"; then
  ok "Cron jobs configurados"
  crontab -l 2>/dev/null | grep -v "^#" | grep -v "^$" | while read -r L; do info "  $L"; done
else
  warn "Nenhum cron job encontrado — verificar backup.sh e certbot renew"
fi

# ── 10. Resumo ────────────────────────────────────────────────────────────────
echo ""
echo "════════════════════════════════════════════════════════"
if [ "$ERRORS" -eq 0 ]; then
  echo -e "  ${GREEN}✓ PRODUÇÃO OK — $ERRORS erros encontrados${NC}"
else
  echo -e "  ${RED}✗ $ERRORS ERRO(S) ENCONTRADO(S) — verifique acima${NC}"
fi
echo ""
echo "  URLs:"
echo "    API:       https://api.revendaclick.com.br/health"
echo "    Evolution: https://evolution.revendaclick.com.br/"
echo "    Frontend:  https://app.revendaclick.com.br/"
echo ""
echo "  Comandos úteis:"
echo "    docker compose -f $COMPOSE_FILE --env-file $ENV_FILE ps"
echo "    docker compose -f $COMPOSE_FILE --env-file $ENV_FILE logs -f backend"
echo "    docker compose -f $COMPOSE_FILE --env-file $ENV_FILE restart backend"
echo "    journalctl -u nginx -f"
echo "════════════════════════════════════════════════════════"
