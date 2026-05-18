#!/bin/bash
# Resume VPS setup from step 7 (SSL) onwards
# Run as root on the VPS: bash /tmp/resume-step7.sh
set -e

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
log()  { echo -e "${GREEN}[OK]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
info() { echo -e "${BLUE}[INFO]${NC} $1"; }
err()  { echo -e "${RED}[ERR]${NC} $1"; }

# ─── STEP 7: Fix nginx port conflict + SSL ────────────────────────────────────
echo ""
echo "════════════════════════════════════════"
echo " STEP 7 — Nginx + SSL"
echo "════════════════════════════════════════"

info "Identificando processo na porta 80..."
PIDS=$(ss -tlnp | grep ':80' | grep -oP 'pid=\K[0-9]+' || true)
if [ -n "$PIDS" ]; then
  for PID in $PIDS; do
    CMD=$(cat /proc/$PID/cmdline 2>/dev/null | tr '\0' ' ' || echo "unknown")
    warn "PID $PID em uso: $CMD"
    kill -9 $PID 2>/dev/null && log "PID $PID encerrado" || warn "Não foi possível matar PID $PID"
  done
else
  info "Porta 80 livre"
fi

# Fallback usando fuser
if command -v fuser &>/dev/null; then
  fuser -k 80/tcp 2>/dev/null || true
fi

sleep 2

info "Iniciando nginx..."
systemctl start nginx || {
  err "Nginx falhou. Verificando config..."
  nginx -t
  exit 1
}
log "Nginx UP"

info "Aguardando nginx estabilizar..."
sleep 3

# Criar dir para webroot challenge
mkdir -p /var/www/html/.well-known/acme-challenge

EMAIL="dilneysantos.developer@gmail.com"
DOMAINS=("api.revendaclick.com.br" "evolution.revendaclick.com.br")

info "Executando certbot para ${DOMAINS[*]}..."
certbot certonly \
  --webroot \
  -w /var/www/html \
  -d "${DOMAINS[0]}" \
  -d "${DOMAINS[1]}" \
  --non-interactive \
  --agree-tos \
  --email "$EMAIL" \
  --keep-until-expiring && log "Certificados SSL obtidos" || {
  warn "Webroot falhou. Tentando standalone..."
  systemctl stop nginx
  certbot certonly \
    --standalone \
    -d "${DOMAINS[0]}" \
    -d "${DOMAINS[1]}" \
    --non-interactive \
    --agree-tos \
    --email "$EMAIL" \
    --keep-until-expiring || {
    err "Certbot falhou. Verifique se os domínios apontam para este IP: $(curl -s ifconfig.me)"
    exit 1
  }
  systemctl start nginx
}

info "Instalando nginx.conf de produção..."
if [ -f /opt/revendaclick/nginx.conf ]; then
  cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.bak.$(date +%s)
  cp /opt/revendaclick/nginx.conf /etc/nginx/nginx.conf
  nginx -t && systemctl reload nginx && log "Nginx recarregado com config produção"
else
  warn "nginx.conf não encontrado em /opt/revendaclick/. Usando config atual."
fi

# Auto-renew
(crontab -l 2>/dev/null | grep -v certbot; echo "0 2 * * * certbot renew --quiet --post-hook 'systemctl reload nginx'") | crontab -
log "Auto-renew certbot configurado (02:00 UTC diário)"

# ─── STEP 8: UFW ──────────────────────────────────────────────────────────────
echo ""
echo "════════════════════════════════════════"
echo " STEP 8 — UFW Firewall"
echo "════════════════════════════════════════"

ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp   comment 'SSH'
ufw allow 80/tcp   comment 'HTTP'
ufw allow 443/tcp  comment 'HTTPS'
ufw --force enable
log "UFW configurado (22, 80, 443)"
ufw status

# ─── STEP 9: Fail2ban ─────────────────────────────────────────────────────────
echo ""
echo "════════════════════════════════════════"
echo " STEP 9 — Fail2ban"
echo "════════════════════════════════════════"

apt-get install -y -q fail2ban

cat > /etc/fail2ban/jail.local << 'F2B'
[DEFAULT]
bantime  = 86400
findtime = 600
maxretry = 5

[sshd]
enabled  = true
port     = ssh
maxretry = 3

[nginx-limit-req]
enabled  = true
port     = http,https
filter   = nginx-limit-req
logpath  = /var/log/nginx/*.error.log

[nginx-botsearch]
enabled  = true
port     = http,https
filter   = nginx-botsearch
logpath  = /var/log/nginx/*.error.log
F2B

systemctl enable --now fail2ban
log "Fail2ban ativo"

# ─── STEP 10: Logrotate ───────────────────────────────────────────────────────
echo ""
echo "════════════════════════════════════════"
echo " STEP 10 — Logrotate"
echo "════════════════════════════════════════"

cat > /etc/logrotate.d/revendaclick << 'LR'
/var/log/nginx/*.log {
    daily
    rotate 14
    compress
    delaycompress
    missingok
    notifempty
    sharedscripts
    postrotate
        systemctl reload nginx
    endscript
}
LR

log "Logrotate configurado (14 dias)"

# ─── STEP 11: Docker stack ────────────────────────────────────────────────────
echo ""
echo "════════════════════════════════════════"
echo " STEP 11 — Docker stack"
echo "════════════════════════════════════════"

cd /opt/revendaclick

if [ ! -f .env ]; then
  err ".env não encontrado em /opt/revendaclick/. Crie o arquivo e re-execute."
  exit 1
fi

BACKEND_IMAGE=$(grep BACKEND_IMAGE .env | cut -d= -f2)
if [ -n "$BACKEND_IMAGE" ]; then
  info "Login GHCR..."
  GHCR_TOKEN=$(grep GHCR_TOKEN .env | cut -d= -f2 || true)
  if [ -n "$GHCR_TOKEN" ]; then
    echo "$GHCR_TOKEN" | docker login ghcr.io -u dilnsant --password-stdin && log "GHCR login OK"
  fi
fi

COMPOSE_FILE="docker-compose.production.yml"
[ ! -f "$COMPOSE_FILE" ] && COMPOSE_FILE="docker-compose.prod.yml"

info "Pulling imagens ($COMPOSE_FILE)..."
docker compose -f "$COMPOSE_FILE" --env-file .env pull

info "Subindo containers..."
docker compose -f "$COMPOSE_FILE" --env-file .env up -d --remove-orphans

info "Aguardando healthchecks (60s)..."
sleep 30

# Aguardar backend
MAX=12; N=0
while [ $N -lt $MAX ]; do
  STATUS=$(docker inspect rc_backend --format='{{.State.Health.Status}}' 2>/dev/null || echo "missing")
  if [ "$STATUS" = "healthy" ]; then log "rc_backend healthy"; break; fi
  warn "rc_backend: $STATUS (${N}/${MAX})..."
  N=$((N+1)); sleep 5
done
[ $N -eq $MAX ] && err "rc_backend não ficou healthy"

# Aguardar evolution
N=0
while [ $N -lt $MAX ]; do
  STATUS=$(docker inspect rc_evolution --format='{{.State.Health.Status}}' 2>/dev/null || echo "missing")
  if [ "$STATUS" = "healthy" ]; then log "rc_evolution healthy"; break; fi
  warn "rc_evolution: $STATUS (${N}/${MAX})..."
  N=$((N+1)); sleep 5
done
[ $N -eq $MAX ] && warn "rc_evolution ainda não healthy (pode demorar mais)"

# ─── STEP 12: Validação final ──────────────────────────────────────────────────
echo ""
echo "════════════════════════════════════════"
echo " STEP 12 — Validação Final"
echo "════════════════════════════════════════"

echo ""
info "Containers:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
info "Portas abertas:"
ss -tlnp | grep -E ':80|:443|:8080|:8081'

echo ""
info "Testes HTTP internos:"
curl -sf http://127.0.0.1:8080/health && echo " ✓ Backend interno OK" || echo " ✗ Backend interno FALHOU"
curl -sf http://127.0.0.1:8081/       && echo " ✓ Evolution interno OK" || echo " ✗ Evolution interno FALHOU"

echo ""
info "Testes HTTPS externos:"
curl -sf https://api.revendaclick.com.br/health && echo " ✓ API HTTPS OK" || echo " ✗ API HTTPS FALHOU"
curl -sf --max-time 5 https://evolution.revendaclick.com.br/ && echo " ✓ Evolution HTTPS OK" || echo " ✗ Evolution HTTPS FALHOU"

echo ""
info "Certificados SSL:"
certbot certificates 2>/dev/null | grep -E "Domains|Expiry|Certificate"

echo ""
info "UFW:"
ufw status verbose

echo ""
info "Disco:"
df -h /

echo ""
echo "════════════════════════════════════════"
echo -e " ${GREEN}DEPLOY COMPLETO${NC}"
echo "════════════════════════════════════════"
echo "  API:       https://api.revendaclick.com.br/health"
echo "  Evolution: https://evolution.revendaclick.com.br"
echo ""
echo "  Comandos úteis:"
echo "  rc-health   — status geral"
echo "  rc-deploy   — atualizar containers"
echo "  rc-logs     — logs em tempo real"
echo "════════════════════════════════════════"
