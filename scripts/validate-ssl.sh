#!/usr/bin/env bash
# =============================================================================
# RevendaClick — Validação SSL e runtime pós-deploy
# Pode ser rodado a qualquer momento para verificar saúde do stack.
# =============================================================================
set -euo pipefail

APP_DOMAIN="app.revendaclick.com.br"
API_DOMAIN="api.revendaclick.com.br"
VPS_IP="2.24.67.84"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
ok()   { echo -e "${GREEN}✓${NC}  $*"; }
warn() { echo -e "${YELLOW}⚠${NC}  $*"; }
fail() { echo -e "${RED}✗${NC}  $*"; FAILED=$((FAILED+1)); }

FAILED=0

check_http() {
  local label=$1 url=$2 expected=${3:-200}
  local code
  code=$(curl -sL -o /dev/null -w "%{http_code}" --max-time 15 "$url" 2>/dev/null || echo "000")
  if [[ "$code" == "$expected" ]]; then
    ok "$label [HTTP $code]"
  else
    fail "$label [HTTP $code, expected $expected] — $url"
  fi
}

check_redirect() {
  local label=$1 url=$2
  local code location
  code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$url" 2>/dev/null || echo "000")
  location=$(curl -s -o /dev/null -w "%{redirect_url}" --max-time 10 "$url" 2>/dev/null || echo "")
  if [[ "$code" == "301" || "$code" == "302" ]] && echo "$location" | grep -q "https://"; then
    ok "$label [→ HTTPS redirect]"
  else
    fail "$label [code=$code, location=$location]"
  fi
}

check_ssl_cert() {
  local domain=$1
  local expiry days_left
  expiry=$(echo | openssl s_client -servername "$domain" -connect "${domain}:443" 2>/dev/null \
    | openssl x509 -noout -enddate 2>/dev/null | cut -d= -f2 || echo "")
  if [[ -z "$expiry" ]]; then
    fail "SSL cert for $domain: NOT ISSUED"
    return
  fi
  days_left=$(( ( $(date -d "$expiry" +%s 2>/dev/null || gdate -d "$expiry" +%s 2>/dev/null || echo 0) - $(date +%s) ) / 86400 ))
  if [[ $days_left -gt 10 ]]; then
    ok "SSL cert $domain — valid until $expiry (${days_left}d remaining)"
  else
    warn "SSL cert $domain — expires SOON: $expiry (${days_left}d)"
  fi
}

check_header() {
  local label=$1 url=$2 header=$3
  if curl -sI --max-time 10 "$url" 2>/dev/null | grep -qi "$header"; then
    ok "$label — header present"
  else
    warn "$label — header '$header' missing"
  fi
}

check_docker_health() {
  local service=$1
  local status
  for prefix in revendaclick opt_revendaclick; do
    local name="${prefix}-${service}-1"
    if docker inspect "$name" >/dev/null 2>&1; then
      status=$(docker inspect --format='{{.State.Health.Status}}' "$name" 2>/dev/null || echo "unknown")
      if [[ "$status" == "healthy" ]]; then
        ok "Docker $service: $status"
      else
        warn "Docker $service: $status"
      fi
      return
    fi
  done
  warn "Docker $service: container not found"
}

echo ""
echo -e "${CYAN}══════════════════════════════════════════${NC}"
echo -e "${CYAN}  RevendaClick — SSL & Runtime Validation${NC}"
echo -e "${CYAN}══════════════════════════════════════════${NC}"
echo ""

echo -e "${CYAN}── Docker container health ──${NC}"
check_docker_health backend
check_docker_health frontend
check_docker_health nginx
check_docker_health evolution
echo ""

echo -e "${CYAN}── Direct port access (debug) ──${NC}"
check_http "Backend :8085/health"    "http://$VPS_IP:8085/health"
check_http "Frontend :3000/health"   "http://$VPS_IP:3000/api/health"
check_http "Nginx :8090/health"      "http://$VPS_IP:8090/health"
echo ""

echo -e "${CYAN}── HTTPS endpoints ──${NC}"
check_http "app.revendaclick.com.br HTTPS"        "https://$APP_DOMAIN"
check_http "api.revendaclick.com.br /health"      "https://$API_DOMAIN/health"
check_http "api.revendaclick.com.br /api/v1/health" "https://$API_DOMAIN/api/v1/health"
check_http "api.revendaclick.com.br /api/plans"   "https://$API_DOMAIN/api/plans"
echo ""

echo -e "${CYAN}── HTTP → HTTPS redirects ──${NC}"
check_redirect "app domain HTTP redirect"  "http://$APP_DOMAIN"
check_redirect "api domain HTTP redirect"  "http://$API_DOMAIN"
echo ""

echo -e "${CYAN}── SSL certificates ──${NC}"
check_ssl_cert "$APP_DOMAIN"
check_ssl_cert "$API_DOMAIN"
echo ""

echo -e "${CYAN}── Security headers ──${NC}"
check_header "app — X-Content-Type-Options" "https://$APP_DOMAIN" "X-Content-Type-Options"
check_header "app — X-Frame-Options"        "https://$APP_DOMAIN" "X-Frame-Options"
check_header "app — Referrer-Policy"        "https://$APP_DOMAIN" "Referrer-Policy"
echo ""

echo -e "${CYAN}── Webhook endpoint ──${NC}"
check_http "Asaas webhook (GET) 405/401" "https://$API_DOMAIN/api/webhooks/asaas" "405"
echo ""

echo -e "${CYAN}── SSL renewal simulation ──${NC}"
echo "  Traefik renews certificates automatically (Let's Encrypt ACME)."
echo "  Renewal happens when cert has <30 days remaining."
TRAEFIK=$(docker ps --format '{{.Names}}' 2>/dev/null | grep -i traefik | head -1 || echo "")
if [[ -n "$TRAEFIK" ]]; then
  ok "Traefik container active: $TRAEFIK (renewal managed automatically)"
else
  warn "Traefik container not found — verify Coolify is running"
fi
echo ""

# Summary
echo -e "${CYAN}══════════════════════════════════════════${NC}"
if [[ $FAILED -eq 0 ]]; then
  echo -e "${GREEN}  All checks passed.${NC}"
else
  echo -e "${RED}  $FAILED check(s) failed.${NC}"
fi
echo ""
echo "  Frontend:  https://$APP_DOMAIN"
echo "  API:       https://$API_DOMAIN"
echo "  Webhook:   https://$API_DOMAIN/api/webhooks/asaas"
echo -e "${CYAN}══════════════════════════════════════════${NC}"
echo ""

exit $FAILED
