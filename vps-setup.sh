#!/usr/bin/env bash
# =============================================================================
# RevendaClick — VPS Production Setup
# Versão : 2.0
# Target : Ubuntu 22.04 LTS
# Uso    : bash /opt/revendaclick/vps-setup.sh
# =============================================================================
set -euo pipefail

# ── Configurações ─────────────────────────────────────────────────────────────
readonly DOMAIN_API="api.revendaclick.com.br"
readonly DOMAIN_EVO="evolution.revendaclick.com.br"
readonly SSL_EMAIL="dilneysantos.developer@gmail.com"
readonly APP_DIR="/opt/revendaclick"
readonly DEPLOY_USER="revendaclick"
readonly BACKEND_PORT="8080"
readonly EVO_PORT="8081"
readonly COMPOSE_FILE="${APP_DIR}/docker-compose.production.yml"
readonly NGINX_CONF="/etc/nginx/nginx.conf"
readonly LOG_DIR="/var/log/revendaclick"
readonly BACKUP_DIR="${APP_DIR}/backups"

# ── Cores ─────────────────────────────────────────────────────────────────────
R='\033[0;31m' G='\033[0;32m' Y='\033[1;33m' B='\033[0;34m' NC='\033[0m'

log()  { echo -e "${G}[$(date '+%H:%M:%S')] ✓${NC} $*"; }
info() { echo -e "${B}[$(date '+%H:%M:%S')]  ${NC} $*"; }
warn() { echo -e "${Y}[WARN]${NC} $*"; }
die()  { echo -e "${R}[ERRO]${NC} $*" >&2; exit 1; }
banner() {
  echo -e "\n${B}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${B}  $*${NC}"
  echo -e "${B}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
}

# ── Pré-verificações ──────────────────────────────────────────────────────────
[[ $EUID -ne 0 ]]            && die "Execute como root: sudo bash $0"
[[ ! -f "${APP_DIR}/.env" ]] && die "Arquivo .env não encontrado em ${APP_DIR}/.env\nCopie o .env antes de executar: scp .env root@<IP>:${APP_DIR}/"

source <(grep -v '^#' "${APP_DIR}/.env" | grep '=')

[[ -z "${DATABASE_URL:-}"            ]] && die "DATABASE_URL não definida no .env"
[[ -z "${SUPABASE_URL:-}"            ]] && die "SUPABASE_URL não definida no .env"
[[ -z "${SUPABASE_SERVICE_ROLE_KEY:-}" ]] && die "SUPABASE_SERVICE_ROLE_KEY não definida no .env"
[[ -z "${EVOLUTION_API_KEY:-}"       ]] && die "EVOLUTION_API_KEY não definida no .env"
[[ -z "${BACKEND_IMAGE:-}"           ]] && die "BACKEND_IMAGE não definida no .env"

log "Pré-verificações OK — .env válido"

# =============================================================================
# 1 — Atualização do sistema
# =============================================================================
banner "1/12  Atualização do Sistema"
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get upgrade -y -o Dpkg::Options::="--force-confold"
apt-get install -y --no-install-recommends \
  curl wget git unzip gnupg lsb-release ca-certificates \
  apt-transport-https software-properties-common \
  ufw fail2ban htop logrotate cron jq openssl
log "Sistema atualizado"

# =============================================================================
# 2 — Docker Engine + Compose V2
# =============================================================================
banner "2/12  Docker Engine + Compose V2"
if ! command -v docker &>/dev/null; then
  . /etc/os-release
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL "https://download.docker.com/linux/${ID}/gpg" \
    | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  chmod a+r /etc/apt/keyrings/docker.gpg
  echo \
    "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
     https://download.docker.com/linux/${ID} ${VERSION_CODENAME} stable" \
    > /etc/apt/sources.list.d/docker.list
  apt-get update -y
  apt-get install -y \
    docker-ce docker-ce-cli containerd.io \
    docker-buildx-plugin docker-compose-plugin
  systemctl enable --now docker
  log "Docker $(docker --version | awk '{print $3}' | tr -d ',') instalado"
else
  warn "Docker já instalado: $(docker --version | awk '{print $3}' | tr -d ',')"
fi

# Daemon: log rotation + overlay2
if [[ ! -f /etc/docker/daemon.json ]]; then
  cat > /etc/docker/daemon.json <<'JSON'
{
  "log-driver": "json-file",
  "log-opts": { "max-size": "50m", "max-file": "5" },
  "storage-driver": "overlay2",
  "live-restore": true
}
JSON
  systemctl reload docker
  log "Docker daemon configurado (log rotation + overlay2)"
fi

# Valida Compose V2
docker compose version &>/dev/null || die "Docker Compose V2 não encontrado"
log "Docker Compose V2: $(docker compose version --short)"

# =============================================================================
# 3 — Nginx + Certbot
# =============================================================================
banner "3/12  Nginx + Certbot"
if ! command -v nginx &>/dev/null; then
  apt-get install -y nginx
  systemctl enable nginx
  log "Nginx $(nginx -v 2>&1 | awk -F/ '{print $2}') instalado"
else
  warn "Nginx já instalado: $(nginx -v 2>&1)"
fi

if ! command -v certbot &>/dev/null; then
  apt-get install -y certbot python3-certbot-nginx
  log "Certbot instalado"
else
  warn "Certbot já instalado"
fi

# =============================================================================
# 4 — Usuário de deploy
# =============================================================================
banner "4/12  Usuário de Deploy"
if ! id "$DEPLOY_USER" &>/dev/null; then
  useradd -m -s /bin/bash -G docker "$DEPLOY_USER"
  log "Usuário '$DEPLOY_USER' criado"
else
  usermod -aG docker "$DEPLOY_USER"
  warn "Usuário '$DEPLOY_USER' já existe — adicionado ao grupo docker"
fi

SSH_DIR="/home/${DEPLOY_USER}/.ssh"
mkdir -p "$SSH_DIR"
touch "${SSH_DIR}/authorized_keys"
chmod 700 "$SSH_DIR"
chmod 600 "${SSH_DIR}/authorized_keys"
chown -R "${DEPLOY_USER}:${DEPLOY_USER}" "$SSH_DIR"
info "Adicione a chave pública SSH do CI em: ${SSH_DIR}/authorized_keys"

# =============================================================================
# 5 — Estrutura de diretórios
# =============================================================================
banner "5/12  Estrutura de Diretórios"
mkdir -p \
  "${APP_DIR}" \
  "${BACKUP_DIR}" \
  "${LOG_DIR}" \
  /var/cache/nginx \
  /var/www/html/.well-known/acme-challenge

chown -R "${DEPLOY_USER}:${DEPLOY_USER}" "${APP_DIR}"
chmod 750 "${APP_DIR}"
chmod 700 "${BACKUP_DIR}"

log "Estrutura criada:"
info "  ${APP_DIR}/"
info "  ${APP_DIR}/backups/"
info "  ${LOG_DIR}/"

# =============================================================================
# 6 — Rede Docker
# =============================================================================
banner "6/12  Rede Docker"
if ! docker network inspect revendaclick &>/dev/null; then
  docker network create \
    --driver bridge \
    --subnet 172.28.0.0/24 \
    --opt com.docker.network.bridge.name=br-revendaclick \
    revendaclick
  log "Rede Docker 'revendaclick' criada (172.28.0.0/24)"
else
  warn "Rede Docker 'revendaclick' já existe"
fi

# =============================================================================
# 7 — SSL — Let's Encrypt
# =============================================================================
banner "7/12  SSL — Let's Encrypt"

# Instala nginx.conf de produção (substitui o padrão)
cp "${APP_DIR}/nginx.conf" "${NGINX_CONF}"

# Primeiro: config HTTP-only para o certbot funcionar
cat > /etc/nginx/sites-available/revendaclick-http <<HTTPCONF
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN_API} ${DOMAIN_EVO};
    root /var/www/html;
    location /.well-known/acme-challenge/ { try_files \$uri =404; }
    location / { return 301 https://\$host\$request_uri; }
}
HTTPCONF

# Remove configuração padrão e habilita a nossa
rm -f /etc/nginx/sites-enabled/default
ln -sf /etc/nginx/sites-available/revendaclick-http /etc/nginx/sites-enabled/revendaclick-http

# Testa e inicia nginx (sem os blocos SSL ainda)
# Substitui temporariamente o nginx.conf por um sem blocos SSL
cat > "${NGINX_CONF}" <<'TEMPNGINX'
user www-data;
worker_processes auto;
pid /run/nginx.pid;
include /etc/nginx/modules-enabled/*.conf;
events { worker_connections 1024; }
http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;
    include /etc/nginx/sites-enabled/*;
}
TEMPNGINX

nginx -t && systemctl restart nginx
log "Nginx iniciado (config temporária HTTP)"

# Obtém certificados SSL
if [[ ! -f "/etc/letsencrypt/live/${DOMAIN_API}/fullchain.pem" ]]; then
  log "Obtendo SSL para ${DOMAIN_API} e ${DOMAIN_EVO}..."
  certbot certonly \
    --webroot \
    --webroot-path /var/www/html \
    -d "${DOMAIN_API}" \
    -d "${DOMAIN_EVO}" \
    --email "${SSL_EMAIL}" \
    --agree-tos \
    --non-interactive \
    && log "Certificados SSL emitidos com sucesso" \
    || { warn "Certbot falhou — DNS pode não estar propagado ainda."; \
         warn "Execute manualmente: certbot certonly --webroot -w /var/www/html -d ${DOMAIN_API} -d ${DOMAIN_EVO} --email ${SSL_EMAIL} --agree-tos --non-interactive"; }
else
  warn "Certificados SSL já existem — pulando certbot"
fi

# Agora instala o nginx.conf de produção completo (com SSL)
cp "${APP_DIR}/nginx.conf" "${NGINX_CONF}"
rm -f /etc/nginx/sites-enabled/revendaclick-http

nginx -t && systemctl reload nginx && log "Nginx recarregado com config de produção (SSL)"

# Auto-renovação via cron
if [[ ! -f /etc/cron.d/certbot-renew ]]; then
  cat > /etc/cron.d/certbot-renew <<'CERTCRON'
0 2 * * * root certbot renew --quiet --webroot -w /var/www/html --post-hook "systemctl reload nginx"
CERTCRON
  log "Cron de renovação SSL configurado (02:00 UTC diário)"
fi

# =============================================================================
# 8 — Firewall UFW
# =============================================================================
banner "8/12  Firewall UFW"
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow OpenSSH
ufw allow 80/tcp   comment "HTTP (ACME challenge + redirect)"
ufw allow 443/tcp  comment "HTTPS"
ufw --force enable
log "UFW configurado:"
ufw status numbered

# =============================================================================
# 9 — Fail2ban
# =============================================================================
banner "9/12  Fail2ban"
cat > /etc/fail2ban/jail.local <<'F2B'
[DEFAULT]
bantime    = 3600
findtime   = 600
maxretry   = 5
backend    = systemd
ignoreip   = 127.0.0.1/8 ::1

[sshd]
enabled  = true
port     = ssh
maxretry = 3
bantime  = 86400

[nginx-http-auth]
enabled  = true
port     = http,https
logpath  = /var/log/nginx/error.log

[nginx-limit-req]
enabled  = true
port     = http,https
filter   = nginx-limit-req
logpath  = /var/log/nginx/*.error.log
maxretry = 10
bantime  = 1800

[nginx-botsearch]
enabled  = true
port     = http,https
filter   = nginx-botsearch
logpath  = /var/log/nginx/*.access.log
maxretry = 2
bantime  = 86400
F2B
systemctl enable --now fail2ban
log "Fail2ban ativado (SSH + Nginx)"

# =============================================================================
# 10 — Logrotate + Docker log rotation
# =============================================================================
banner "10/12  Logrotate"
cat > /etc/logrotate.d/revendaclick <<LOGROTATE
${LOG_DIR}/*.log
/var/log/nginx/api.revendaclick.com.br.access.log
/var/log/nginx/api.revendaclick.com.br.error.log
/var/log/nginx/evolution.revendaclick.com.br.access.log
/var/log/nginx/evolution.revendaclick.com.br.error.log
{
    daily
    rotate 14
    compress
    delaycompress
    missingok
    notifempty
    sharedscripts
    postrotate
        [ -f /var/run/nginx.pid ] && kill -USR1 \$(cat /var/run/nginx.pid) 2>/dev/null || true
    endscript
}
LOGROTATE
log "Logrotate configurado (14 dias de retenção)"

# =============================================================================
# 11 — Subida do stack Docker
# =============================================================================
banner "11/12  Stack Docker"

if [[ ! -f "${COMPOSE_FILE}" ]]; then
  die "${COMPOSE_FILE} não encontrado.\nCopie docker-compose.production.yml para ${APP_DIR}/"
fi

# Login no GHCR
if [[ -n "${GHCR_TOKEN:-}" ]]; then
  echo "${GHCR_TOKEN}" | docker login ghcr.io -u "${GHCR_USER:-dilnsant}" --password-stdin
  log "Login GHCR OK"
else
  warn "GHCR_TOKEN não definido — assumindo imagem local ou já autenticado"
fi

# Pull das imagens
docker compose -f "${COMPOSE_FILE}" --env-file "${APP_DIR}/.env" pull
log "Imagens atualizadas"

# Sobe os containers
docker compose -f "${COMPOSE_FILE}" --env-file "${APP_DIR}/.env" \
  up -d --remove-orphans --force-recreate
log "Containers iniciados"

# Aguarda healthchecks
info "Aguardando healthchecks (60s)..."
sleep 15

RETRIES=9
for i in $(seq 1 $RETRIES); do
  STATUS=$(docker inspect --format='{{.State.Health.Status}}' rc_backend 2>/dev/null || echo "starting")
  if [[ "$STATUS" == "healthy" ]]; then
    log "Backend Go: healthy"
    break
  fi
  [[ $i -eq $RETRIES ]] && warn "Backend não ficou healthy no tempo esperado — verifique: docker logs rc_backend"
  sleep 5
done

for i in $(seq 1 $RETRIES); do
  STATUS=$(docker inspect --format='{{.State.Health.Status}}' rc_evolution 2>/dev/null || echo "starting")
  if [[ "$STATUS" == "healthy" ]]; then
    log "Evolution API: healthy"
    break
  fi
  [[ $i -eq $RETRIES ]] && warn "Evolution não ficou healthy — pode precisar de mais tempo para inicializar"
  sleep 5
done

# =============================================================================
# 12 — Validação final + relatório
# =============================================================================
banner "12/12  Validação Final"

ERRORS=0

# Portas
for PORT in ${BACKEND_PORT} ${EVO_PORT}; do
  if ss -tlnp | grep -q ":${PORT}"; then
    log "Porta ${PORT}: aberta"
  else
    warn "Porta ${PORT}: fechada (container pode não ter iniciado)"
    ((ERRORS++)) || true
  fi
done

# HTTP health
for URL in \
  "http://127.0.0.1:${BACKEND_PORT}/health" \
  "http://127.0.0.1:${EVO_PORT}/"; do
  HTTP=$(curl -so /dev/null -w "%{http_code}" --max-time 5 "${URL}" 2>/dev/null || echo "000")
  if [[ "$HTTP" =~ ^[23] ]]; then
    log "HTTP ${URL} → ${HTTP}"
  else
    warn "HTTP ${URL} → ${HTTP}"
    ((ERRORS++)) || true
  fi
done

# Nginx
nginx -t 2>&1 | grep -q "successful" && log "Nginx config: OK" || { warn "Nginx config com erro"; ((ERRORS++)) || true; }
systemctl is-active nginx &>/dev/null && log "Nginx: ativo" || { warn "Nginx: inativo"; ((ERRORS++)) || true; }

# SSL
if [[ -f "/etc/letsencrypt/live/${DOMAIN_API}/fullchain.pem" ]]; then
  EXPIRY=$(openssl x509 -enddate -noout -in "/etc/letsencrypt/live/${DOMAIN_API}/fullchain.pem" | cut -d= -f2)
  log "SSL ${DOMAIN_API}: válido até ${EXPIRY}"
else
  warn "Certificado SSL ainda não emitido — execute certbot manualmente"
fi

# Docker containers
log "Containers:"
docker compose -f "${COMPOSE_FILE}" --env-file "${APP_DIR}/.env" \
  ps --format "table {{.Name}}\t{{.Status}}\t{{.Health}}" \
  | awk 'NR==1{print "  "$0} NR>1{print "  "$0}'

# UFW
ufw status | grep -q "Status: active" && log "UFW: ativo" || warn "UFW: inativo"

# Fail2ban
systemctl is-active fail2ban &>/dev/null && log "Fail2ban: ativo" || warn "Fail2ban: inativo"

# Disco
DISK_USED=$(df -h "${APP_DIR}" | awk 'NR==2{print $3"/"$2" ("$5")"}')
log "Disco ${APP_DIR}: ${DISK_USED}"

# =============================================================================
# Instala ferramentas de manutenção
# =============================================================================

# rc-health
cat > /usr/local/bin/rc-health <<HEALTH
#!/usr/bin/env bash
OK='\033[0;32m✓\033[0m'; FAIL='\033[0;31m✗\033[0m'
check() {
  local label="\$1" url="\$2"
  HTTP=\$(curl -so /dev/null -w "%{http_code}" --max-time 5 "\$url" 2>/dev/null || echo "000")
  [[ "\$HTTP" =~ ^[23] ]] \
    && echo -e "  \${OK} \${label} [\${HTTP}]" \
    || echo -e "  \${FAIL} \${label} [\${HTTP}]"
}
echo ""
echo "━━━ RevendaClick — Health ━━━"
echo ""
echo "Serviços internos:"
check "Backend Go  (${BACKEND_PORT})" "http://127.0.0.1:${BACKEND_PORT}/health"
check "Evolution   (${EVO_PORT})"     "http://127.0.0.1:${EVO_PORT}/"
echo ""
echo "Endpoints públicos:"
check "api.revendaclick.com.br"       "https://${DOMAIN_API}/health"
check "evolution.revendaclick.com.br" "https://${DOMAIN_EVO}/"
echo ""
echo "Containers:"
docker compose -f ${COMPOSE_FILE} --env-file ${APP_DIR}/.env \
  ps --format "  {{.Name}}: {{.Status}} ({{.Health}})" 2>/dev/null
echo ""
echo "Nginx: \$(systemctl is-active nginx)"
echo "Fail2ban: \$(systemctl is-active fail2ban)"
echo ""
echo "Disco:"
df -h ${APP_DIR} | awk 'NR==2{print "  Usado: "\$3" / "\$2" ("\$5")"}'
echo ""
HEALTH
chmod +x /usr/local/bin/rc-health

# rc-deploy
cat > /usr/local/bin/rc-deploy <<DEPLOY
#!/usr/bin/env bash
set -euo pipefail
IMAGE_TAG="\${1:-latest}"
echo "[rc-deploy] tag=\${IMAGE_TAG}"
cd "${APP_DIR}"
BACKEND_IMAGE=\${BACKEND_IMAGE:-ghcr.io/dilnsant/revendaclick-backend} \
IMAGE_TAG="\${IMAGE_TAG}" \
  docker compose -f "${COMPOSE_FILE}" --env-file .env pull backend
BACKEND_IMAGE=\${BACKEND_IMAGE:-ghcr.io/dilnsant/revendaclick-backend} \
IMAGE_TAG="\${IMAGE_TAG}" \
  docker compose -f "${COMPOSE_FILE}" --env-file .env up -d --no-deps backend
docker image prune -f --filter "until=24h"
echo "[rc-deploy] done"
docker compose -f "${COMPOSE_FILE}" --env-file .env ps rc_backend
DEPLOY
chmod +x /usr/local/bin/rc-deploy

# rc-logs
cat > /usr/local/bin/rc-logs <<LOGS
#!/usr/bin/env bash
SERVICE="\${1:-backend}"
docker compose -f "${COMPOSE_FILE}" --env-file "${APP_DIR}/.env" logs -f --tail=100 "\$SERVICE"
LOGS
chmod +x /usr/local/bin/rc-logs

# =============================================================================
# Resumo final
# =============================================================================
echo ""
echo -e "${G}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
if [[ $ERRORS -eq 0 ]]; then
  echo -e "${G}  Setup concluído com sucesso!${NC}"
else
  echo -e "${Y}  Setup concluído com ${ERRORS} aviso(s) — verifique acima${NC}"
fi
echo -e "${G}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "  Ferramentas disponíveis:"
echo "    rc-health          → status completo dos serviços"
echo "    rc-deploy [tag]    → atualiza backend sem downtime"
echo "    rc-logs [serviço]  → logs em tempo real"
echo ""
echo "  Logs:"
echo "    journalctl -u nginx -f"
echo "    rc-logs backend"
echo "    rc-logs evolution"
echo ""
echo "  Estrutura:"
echo "    ${APP_DIR}/"
echo "    ├── docker-compose.production.yml"
echo "    ├── nginx.conf"
echo "    ├── .env"
echo "    ├── backups/    ← pg_dump diário 03:00 UTC"
echo "    └── logs/"
echo ""
if [[ $ERRORS -gt 0 ]]; then
  echo -e "  ${Y}SSL pendente? Execute:${NC}"
  echo "    certbot certonly --webroot -w /var/www/html \\"
  echo "      -d ${DOMAIN_API} -d ${DOMAIN_EVO} \\"
  echo "      --email ${SSL_EMAIL} --agree-tos --non-interactive"
  echo "    nginx -t && systemctl reload nginx"
  echo ""
fi
