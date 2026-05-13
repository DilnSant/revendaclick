#!/usr/bin/env bash
# =============================================================================
# RevendaClick — VPS Production Setup
# Target : Ubuntu 22.04 LTS / Debian 12
# Run    : bash vps-setup.sh
# =============================================================================
set -euo pipefail

# ── Config ────────────────────────────────────────────────────────────────────
DOMAIN_API="api.revendaclick.com.br"
DOMAIN_EVO="evolution.revendaclick.com.br"
SSL_EMAIL="dilneysantos.developer@gmail.com"
APP_DIR="/opt/revendaclick"
DEPLOY_USER="revendaclick"
LOG_DIR="/var/log/revendaclick"
BACKEND_PORT="8080"
EVOLUTION_PORT="8081"

# ── Colors ────────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'

log()  { echo -e "${GREEN}[$(date '+%H:%M:%S')]${NC} $*"; }
info() { echo -e "${BLUE}[$(date '+%H:%M:%S')]${NC} $*"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $*"; }
die()  { echo -e "${RED}[ERROR]${NC} $*" >&2; exit 1; }
step() { echo -e "\n${BLUE}━━━ $* ━━━${NC}"; }

[[ $EUID -ne 0 ]] && die "Run as root:  sudo bash $0"

# ── Detect OS ─────────────────────────────────────────────────────────────────
. /etc/os-release
[[ "$ID" != "ubuntu" && "$ID" != "debian" ]] && warn "Tested on Ubuntu 22.04 — proceed with caution on $PRETTY_NAME"

# =============================================================================
# STEP 1 — System Update
# =============================================================================
step "1/14  System Update"
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get upgrade -y -o Dpkg::Options::="--force-confold"
apt-get install -y --no-install-recommends \
  curl wget git unzip gnupg lsb-release ca-certificates \
  apt-transport-https software-properties-common \
  ufw fail2ban htop logrotate cron jq

# =============================================================================
# STEP 2 — Docker Engine + Compose V2
# =============================================================================
step "2/14  Docker Engine + Compose V2"
if command -v docker &>/dev/null; then
  warn "Docker already installed: $(docker --version)"
else
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL "https://download.docker.com/linux/${ID}/gpg" \
    | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  chmod a+r /etc/apt/keyrings/docker.gpg
  echo \
    "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
     https://download.docker.com/linux/${ID} ${VERSION_CODENAME} stable" \
    > /etc/apt/sources.list.d/docker.list
  apt-get update -y
  apt-get install -y docker-ce docker-ce-cli containerd.io \
    docker-buildx-plugin docker-compose-plugin
  log "Docker $(docker --version) installed"
fi
systemctl enable --now docker

# Configure Docker log rotation and storage
cat > /etc/docker/daemon.json <<'JSON'
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "50m",
    "max-file": "5"
  },
  "storage-driver": "overlay2",
  "live-restore": true
}
JSON
systemctl reload docker

# Validate Compose V2
docker compose version | grep -q "v2\|2\." && log "Docker Compose V2: OK" || die "Docker Compose V2 not found"

# =============================================================================
# STEP 3 — Deploy User
# =============================================================================
step "3/14  Deploy User"
if ! id "$DEPLOY_USER" &>/dev/null; then
  useradd -m -s /bin/bash -G docker "$DEPLOY_USER"
  log "User '$DEPLOY_USER' created"
else
  usermod -aG docker "$DEPLOY_USER"
  warn "User '$DEPLOY_USER' already exists — ensured docker group"
fi

# SSH authorized_keys placeholder (paste your CI public key here)
SSH_DIR="/home/$DEPLOY_USER/.ssh"
mkdir -p "$SSH_DIR"
touch "$SSH_DIR/authorized_keys"
chmod 700 "$SSH_DIR"
chmod 600 "$SSH_DIR/authorized_keys"
chown -R "$DEPLOY_USER:$DEPLOY_USER" "$SSH_DIR"
info "Add your CI SSH public key to: $SSH_DIR/authorized_keys"

# =============================================================================
# STEP 4 — App Directory Structure
# =============================================================================
step "4/14  App Directory Structure"
mkdir -p \
  "$APP_DIR"/{backups,logs,nginx-snippets} \
  "$LOG_DIR"

# Copy docker-compose if provided alongside this script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [[ -f "$SCRIPT_DIR/../../docker-compose.prod.yml" ]]; then
  cp "$SCRIPT_DIR/../../docker-compose.prod.yml" "$APP_DIR/docker-compose.prod.yml"
  log "Copied docker-compose.prod.yml → $APP_DIR/"
fi
if [[ -f "$SCRIPT_DIR/backup.sh" ]]; then
  cp "$SCRIPT_DIR/backup.sh" "$APP_DIR/backup.sh"
  chmod +x "$APP_DIR/backup.sh"
  log "Copied backup.sh → $APP_DIR/"
fi

chown -R "$DEPLOY_USER:$DEPLOY_USER" "$APP_DIR"
chmod 750 "$APP_DIR"

# =============================================================================
# STEP 5 — Nginx
# =============================================================================
step "5/14  Nginx"
apt-get install -y nginx
systemctl enable nginx

# ── Main nginx.conf ───────────────────────────────────────────────────────────
cat > /etc/nginx/nginx.conf <<'MAIN'
user www-data;
worker_processes auto;
pid /run/nginx.pid;
include /etc/nginx/modules-enabled/*.conf;

events {
    worker_connections 2048;
    use epoll;
    multi_accept on;
}

http {
    sendfile            on;
    tcp_nopush          on;
    tcp_nodelay         on;
    keepalive_timeout   65;
    types_hash_max_size 4096;
    server_tokens       off;
    client_max_body_size 64m;

    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Logging
    log_format main '$remote_addr - $remote_user [$time_local] '
                    '"$request" $status $body_bytes_sent '
                    '"$http_referer" "$http_user_agent" '
                    'rt=$request_time uct=$upstream_connect_time urt=$upstream_response_time';
    access_log /var/log/nginx/access.log main;
    error_log  /var/log/nginx/error.log warn;

    # Gzip
    gzip              on;
    gzip_vary         on;
    gzip_proxied      any;
    gzip_comp_level   5;
    gzip_min_length   1024;
    gzip_types        text/plain text/css application/json
                      application/javascript text/xml application/xml
                      application/rss+xml text/javascript;

    # Rate limiting zones
    limit_req_zone  $binary_remote_addr zone=api_zone:20m    rate=30r/s;
    limit_req_zone  $binary_remote_addr zone=global_zone:20m rate=100r/s;
    limit_conn_zone $binary_remote_addr zone=conn_zone:10m;

    include /etc/nginx/conf.d/*.conf;
    include /etc/nginx/sites-enabled/*;
}
MAIN

# ── api.revendaclick.com.br (HTTP — certbot adds SSL) ─────────────────────────
cat > "/etc/nginx/sites-available/$DOMAIN_API" <<NGINX_API
# ── api.revendaclick.com.br ───────────────────────────────────────────────────
upstream backend {
    server 127.0.0.1:${BACKEND_PORT};
    keepalive 32;
}

server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN_API};

    # Allow certbot challenges
    location /.well-known/acme-challenge/ { root /var/www/html; }

    location / {
        return 301 https://\$host\$request_uri;
    }
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name ${DOMAIN_API};

    # SSL — managed by Certbot (do not edit manually)
    ssl_certificate     /etc/letsencrypt/live/${DOMAIN_API}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${DOMAIN_API}/privkey.pem;
    include             /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam         /etc/letsencrypt/ssl-dhparams.pem;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Frame-Options           "DENY"                                          always;
    add_header X-Content-Type-Options    "nosniff"                                       always;
    add_header X-XSS-Protection          "1; mode=block"                                 always;
    add_header Referrer-Policy           "strict-origin-when-cross-origin"               always;
    add_header Permissions-Policy        "camera=(), microphone=(), geolocation=()"      always;

    # Rate limiting
    limit_req       zone=api_zone burst=60 nodelay;
    limit_conn      conn_zone 50;
    limit_req_status 429;

    access_log /var/log/nginx/${DOMAIN_API}.access.log main;
    error_log  /var/log/nginx/${DOMAIN_API}.error.log warn;

    # Health probe — bypass rate limit, no logging
    location = /health {
        proxy_pass         http://backend/health;
        proxy_http_version 1.1;
        proxy_set_header   Connection "";
        access_log         off;
    }

    # CORS preflight fast path
    location / {
        if (\$request_method = OPTIONS) {
            add_header Access-Control-Allow-Origin  "\$http_origin" always;
            add_header Access-Control-Allow-Methods "GET,POST,PUT,PATCH,DELETE,OPTIONS" always;
            add_header Access-Control-Allow-Headers "Authorization,Content-Type,X-Request-ID" always;
            add_header Access-Control-Max-Age       300 always;
            return 204;
        }

        proxy_pass          http://backend;
        proxy_http_version  1.1;
        proxy_set_header    Connection         "";
        proxy_set_header    Host               \$host;
        proxy_set_header    X-Real-IP          \$remote_addr;
        proxy_set_header    X-Forwarded-For    \$proxy_add_x_forwarded_for;
        proxy_set_header    X-Forwarded-Proto  \$scheme;
        proxy_read_timeout  30s;
        proxy_connect_timeout 5s;
        proxy_send_timeout  30s;

        # Buffer tuning for JSON APIs
        proxy_buffering    on;
        proxy_buffer_size  16k;
        proxy_buffers      8 16k;
    }
}
NGINX_API

# ── evolution.revendaclick.com.br (HTTP — certbot adds SSL) ───────────────────
cat > "/etc/nginx/sites-available/$DOMAIN_EVO" <<NGINX_EVO
# ── evolution.revendaclick.com.br ─────────────────────────────────────────────
upstream evolution {
    server 127.0.0.1:${EVOLUTION_PORT};
    keepalive 16;
}

server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN_EVO};

    location /.well-known/acme-challenge/ { root /var/www/html; }

    location / {
        return 301 https://\$host\$request_uri;
    }
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name ${DOMAIN_EVO};

    ssl_certificate     /etc/letsencrypt/live/${DOMAIN_EVO}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${DOMAIN_EVO}/privkey.pem;
    include             /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam         /etc/letsencrypt/ssl-dhparams.pem;

    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options           "SAMEORIGIN"                           always;
    add_header X-Content-Type-Options    "nosniff"                              always;

    client_max_body_size 50m;

    access_log /var/log/nginx/${DOMAIN_EVO}.access.log main;
    error_log  /var/log/nginx/${DOMAIN_EVO}.error.log warn;

    # WebSocket support (Evolution API uses Socket.IO)
    location / {
        proxy_pass          http://evolution;
        proxy_http_version  1.1;
        proxy_set_header    Upgrade    \$http_upgrade;
        proxy_set_header    Connection "upgrade";
        proxy_set_header    Host               \$host;
        proxy_set_header    X-Real-IP          \$remote_addr;
        proxy_set_header    X-Forwarded-For    \$proxy_add_x_forwarded_for;
        proxy_set_header    X-Forwarded-Proto  \$scheme;
        proxy_read_timeout  86400s;
        proxy_send_timeout  86400s;
        proxy_connect_timeout 10s;
    }
}
NGINX_EVO

# Enable sites, disable default
ln -sf "/etc/nginx/sites-available/$DOMAIN_API" /etc/nginx/sites-enabled/
ln -sf "/etc/nginx/sites-available/$DOMAIN_EVO" /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test HTTP-only config first (SSL blocks will fail — skip for now)
nginx -t 2>&1 | grep -v "cannot load certificate\|No such file\|BIO_new_file\|SSL_CTX_use" \
  && log "Nginx config OK" || true

# =============================================================================
# STEP 6 — SSL Certificates (Let's Encrypt)
# =============================================================================
step "6/14  SSL — Let's Encrypt via Certbot"
apt-get install -y certbot python3-certbot-nginx

# Write temporary HTTP-only configs (no SSL blocks) so nginx starts
cat > "/etc/nginx/sites-available/$DOMAIN_API" <<NGINX_HTTP_API
upstream backend { server 127.0.0.1:${BACKEND_PORT}; }
server {
    listen 80; listen [::]:80;
    server_name ${DOMAIN_API};
    location /.well-known/acme-challenge/ { root /var/www/html; }
    location / { proxy_pass http://backend; proxy_set_header Host \$host; }
}
NGINX_HTTP_API

cat > "/etc/nginx/sites-available/$DOMAIN_EVO" <<NGINX_HTTP_EVO
upstream evolution { server 127.0.0.1:${EVOLUTION_PORT}; }
server {
    listen 80; listen [::]:80;
    server_name ${DOMAIN_EVO};
    location /.well-known/acme-challenge/ { root /var/www/html; }
    location / { proxy_pass http://evolution; proxy_set_header Host \$host; }
}
NGINX_HTTP_EVO

nginx -t && systemctl reload nginx || systemctl start nginx
log "Nginx started (HTTP-only)"

# Obtain certs
if [[ -f "/etc/letsencrypt/live/$DOMAIN_API/fullchain.pem" ]]; then
  warn "SSL cert for $DOMAIN_API already exists — skipping certbot"
else
  log "Obtaining SSL for $DOMAIN_API and $DOMAIN_EVO ..."
  certbot --nginx \
    -d "$DOMAIN_API" \
    -d "$DOMAIN_EVO" \
    --email "$SSL_EMAIL" \
    --agree-tos \
    --non-interactive \
    --redirect \
    && log "SSL certificates obtained" \
    || { warn "Certbot failed — DNS may not be propagated yet."; \
         warn "Run manually later: certbot --nginx -d $DOMAIN_API -d $DOMAIN_EVO --email $SSL_EMAIL --agree-tos"; }
fi

# Now write the final production nginx configs (with security headers)
cat > "/etc/nginx/sites-available/$DOMAIN_API" <<NGINX_FINAL_API
upstream backend {
    server 127.0.0.1:${BACKEND_PORT};
    keepalive 32;
}

server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN_API};
    location /.well-known/acme-challenge/ { root /var/www/html; }
    location / { return 301 https://\$host\$request_uri; }
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name ${DOMAIN_API};

    ssl_certificate     /etc/letsencrypt/live/${DOMAIN_API}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${DOMAIN_API}/privkey.pem;
    include             /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam         /etc/letsencrypt/ssl-dhparams.pem;

    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Frame-Options           "DENY"                                          always;
    add_header X-Content-Type-Options    "nosniff"                                       always;
    add_header X-XSS-Protection          "1; mode=block"                                 always;
    add_header Referrer-Policy           "strict-origin-when-cross-origin"               always;
    add_header Permissions-Policy        "camera=(), microphone=(), geolocation=()"      always;

    limit_req        zone=api_zone burst=60 nodelay;
    limit_conn       conn_zone 50;
    limit_req_status 429;

    access_log /var/log/nginx/${DOMAIN_API}.access.log main;
    error_log  /var/log/nginx/${DOMAIN_API}.error.log warn;

    location = /health {
        proxy_pass         http://backend/health;
        proxy_http_version 1.1;
        proxy_set_header   Connection "";
        access_log         off;
    }

    location / {
        if (\$request_method = OPTIONS) {
            add_header Access-Control-Allow-Origin  "\$http_origin" always;
            add_header Access-Control-Allow-Methods "GET,POST,PUT,PATCH,DELETE,OPTIONS" always;
            add_header Access-Control-Allow-Headers "Authorization,Content-Type,X-Request-ID" always;
            add_header Access-Control-Max-Age       300 always;
            return 204;
        }

        proxy_pass          http://backend;
        proxy_http_version  1.1;
        proxy_set_header    Connection        "";
        proxy_set_header    Host              \$host;
        proxy_set_header    X-Real-IP         \$remote_addr;
        proxy_set_header    X-Forwarded-For   \$proxy_add_x_forwarded_for;
        proxy_set_header    X-Forwarded-Proto \$scheme;
        proxy_read_timeout  30s;
        proxy_connect_timeout 5s;
        proxy_send_timeout  30s;
        proxy_buffering     on;
        proxy_buffer_size   16k;
        proxy_buffers       8 16k;
    }
}
NGINX_FINAL_API

cat > "/etc/nginx/sites-available/$DOMAIN_EVO" <<NGINX_FINAL_EVO
upstream evolution {
    server 127.0.0.1:${EVOLUTION_PORT};
    keepalive 16;
}

server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN_EVO};
    location /.well-known/acme-challenge/ { root /var/www/html; }
    location / { return 301 https://\$host\$request_uri; }
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name ${DOMAIN_EVO};

    ssl_certificate     /etc/letsencrypt/live/${DOMAIN_EVO}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${DOMAIN_EVO}/privkey.pem;
    include             /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam         /etc/letsencrypt/ssl-dhparams.pem;

    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options           "SAMEORIGIN"                           always;
    add_header X-Content-Type-Options    "nosniff"                              always;

    client_max_body_size 50m;

    access_log /var/log/nginx/${DOMAIN_EVO}.access.log main;
    error_log  /var/log/nginx/${DOMAIN_EVO}.error.log warn;

    location / {
        proxy_pass          http://evolution;
        proxy_http_version  1.1;
        proxy_set_header    Upgrade    \$http_upgrade;
        proxy_set_header    Connection "upgrade";
        proxy_set_header    Host               \$host;
        proxy_set_header    X-Real-IP          \$remote_addr;
        proxy_set_header    X-Forwarded-For    \$proxy_add_x_forwarded_for;
        proxy_set_header    X-Forwarded-Proto  \$scheme;
        proxy_read_timeout  86400s;
        proxy_send_timeout  86400s;
        proxy_connect_timeout 10s;
    }
}
NGINX_FINAL_EVO

nginx -t && systemctl reload nginx && log "Nginx reloaded with production config"

# Auto-renew cron
cat > /etc/cron.d/certbot-renew <<'CERTCRON'
0 2 * * * root certbot renew --quiet --post-hook "systemctl reload nginx"
CERTCRON

# =============================================================================
# STEP 7 — UFW Firewall
# =============================================================================
step "7/14  UFW Firewall"
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable
log "UFW rules:"
ufw status numbered

# =============================================================================
# STEP 8 — Fail2ban
# =============================================================================
step "8/14  Fail2ban"
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
F2B
systemctl enable --now fail2ban
log "Fail2ban enabled"

# =============================================================================
# STEP 9 — Logrotate
# =============================================================================
step "9/14  Logrotate"
cat > /etc/logrotate.d/revendaclick <<LOGROTATE
/var/log/revendaclick/*.log
/var/log/nginx/${DOMAIN_API}.access.log
/var/log/nginx/${DOMAIN_API}.error.log
/var/log/nginx/${DOMAIN_EVO}.access.log
/var/log/nginx/${DOMAIN_EVO}.error.log
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
logrotate --debug /etc/logrotate.d/revendaclick 2>&1 | head -5
log "Logrotate configured (14-day retention)"

# =============================================================================
# STEP 10 — Systemd Service for Docker Stack
# =============================================================================
step "10/14  Systemd Service"
cat > /etc/systemd/system/revendaclick.service <<SYSTEMD
[Unit]
Description=RevendaClick Production Stack (Docker Compose)
Documentation=https://github.com/dilnsant/revendaclick
Requires=docker.service
After=docker.service network-online.target
Wants=network-online.target

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=${APP_DIR}
EnvironmentFile=-${APP_DIR}/.env

ExecStartPre=/usr/bin/docker compose -f ${APP_DIR}/docker-compose.prod.yml pull --quiet
ExecStart=/usr/bin/docker compose -f ${APP_DIR}/docker-compose.prod.yml up -d --remove-orphans
ExecStop=/usr/bin/docker compose -f ${APP_DIR}/docker-compose.prod.yml down
ExecReload=/usr/bin/docker compose -f ${APP_DIR}/docker-compose.prod.yml pull --quiet && \
           /usr/bin/docker compose -f ${APP_DIR}/docker-compose.prod.yml up -d --remove-orphans

StandardOutput=journal
StandardError=journal
SyslogIdentifier=revendaclick
Restart=on-failure
RestartSec=10
TimeoutStartSec=180
TimeoutStopSec=30

[Install]
WantedBy=multi-user.target
SYSTEMD

systemctl daemon-reload
systemctl enable revendaclick.service
log "Systemd service 'revendaclick' enabled (starts on boot)"

# =============================================================================
# STEP 11 — Healthcheck Script
# =============================================================================
step "11/14  Healthcheck Script"
cat > /usr/local/bin/rc-health <<HEALTHSCRIPT
#!/usr/bin/env bash
# RevendaClick health check — run: rc-health
set -euo pipefail

OK='\033[0;32m✓\033[0m'; FAIL='\033[0;31m✗\033[0m'; WARN='\033[1;33m!\033[0m'

check_http() {
  local label="\$1" url="\$2"
  if curl -sf --max-time 5 "\$url" > /dev/null 2>&1; then
    echo -e "  \${OK} \${label}"
  else
    echo -e "  \${FAIL} \${label} — UNREACHABLE"
  fi
}

echo ""
echo "━━━ RevendaClick — Health Check ━━━"
echo ""
echo "Services:"
check_http "Backend Go     (localhost:${BACKEND_PORT}/health)" "http://127.0.0.1:${BACKEND_PORT}/health"
check_http "Evolution API  (localhost:${EVOLUTION_PORT}/)"     "http://127.0.0.1:${EVOLUTION_PORT}/"
check_http "api SSL        (https://${DOMAIN_API}/health)"     "https://${DOMAIN_API}/health"
check_http "evolution SSL  (https://${DOMAIN_EVO}/)"           "https://${DOMAIN_EVO}/"

echo ""
echo "Docker containers:"
docker compose -f ${APP_DIR}/docker-compose.prod.yml ps \
  --format "table {{.Name}}\t{{.Status}}\t{{.Health}}" 2>/dev/null \
  | awk 'NR==1{print "  "\$0} NR>1{print "  "\$0}' \
  || echo "  ! Stack not running"

echo ""
echo "Nginx:"
systemctl is-active nginx &>/dev/null \
  && echo -e "  \${OK} nginx active" \
  || echo -e "  \${FAIL} nginx inactive"

echo ""
echo "SSL Expiry:"
for domain in ${DOMAIN_API} ${DOMAIN_EVO}; do
  expiry=\$(echo | openssl s_client -connect "\${domain}:443" -servername "\${domain}" 2>/dev/null \
    | openssl x509 -noout -enddate 2>/dev/null | cut -d= -f2 || echo "unknown")
  echo "  \${domain}: \${expiry}"
done

echo ""
echo "Disk:"
df -h "$APP_DIR" | awk 'NR==2{print "  Used: "\$3" / "\$2" ("\$5")"}'
echo ""
HEALTHSCRIPT
chmod +x /usr/local/bin/rc-health
log "Healthcheck available: rc-health"

# =============================================================================
# STEP 12 — Deploy Script
# =============================================================================
step "12/14  Deploy Script"
cat > /usr/local/bin/rc-deploy <<DEPLOYSCRIPT
#!/usr/bin/env bash
# Pull and redeploy — called by CI/CD SSH step
# Usage: rc-deploy [IMAGE_TAG]
set -euo pipefail
IMAGE_TAG="\${1:-latest}"
cd "${APP_DIR}"
echo "[rc-deploy] Deploying tag: \$IMAGE_TAG"
BACKEND_IMAGE=\${BACKEND_IMAGE:-ghcr.io/dilnsant/revendaclick-backend} \
IMAGE_TAG="\$IMAGE_TAG" \
  docker compose -f docker-compose.prod.yml --env-file .env pull backend
BACKEND_IMAGE=\${BACKEND_IMAGE:-ghcr.io/dilnsant/revendaclick-backend} \
IMAGE_TAG="\$IMAGE_TAG" \
  docker compose -f docker-compose.prod.yml --env-file .env up -d --remove-orphans
docker image prune -f --filter "until=24h"
echo "[rc-deploy] Done — $(docker compose -f docker-compose.prod.yml ps --format '{{.Name}}: {{.Status}}')"
DEPLOYSCRIPT
chmod +x /usr/local/bin/rc-deploy
log "Deploy script available: rc-deploy [IMAGE_TAG]"

# =============================================================================
# STEP 13 — Backup Cron
# =============================================================================
step "13/14  Backup Cron"
# Daily backup at 03:00 UTC
cat > /etc/cron.d/revendaclick-backup <<'BACKCRON'
0 3 * * * root /opt/revendaclick/backup.sh >> /var/log/revendaclick/backup.log 2>&1
BACKCRON
mkdir -p "$LOG_DIR"
log "Backup cron: daily 03:00 UTC → $APP_DIR/backups/"

# =============================================================================
# STEP 14 — Final Validation
# =============================================================================
step "14/14  Final Validation"
log "Validating services..."

# Nginx
nginx -t && log "Nginx config: OK" || warn "Nginx config has errors — check manually"

# Docker
docker info &>/dev/null && log "Docker daemon: OK" || warn "Docker daemon not responding"
docker compose version &>/dev/null && log "Docker Compose V2: OK"

# UFW
ufw status | grep -q "Status: active" && log "UFW: active" || warn "UFW not active"

# Fail2ban
systemctl is-active fail2ban &>/dev/null && log "Fail2ban: active" || warn "Fail2ban not active"

# Systemd
systemctl is-enabled revendaclick.service &>/dev/null && log "Systemd service: enabled"

# =============================================================================
# SUMMARY
# =============================================================================
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  RevendaClick VPS Setup Complete!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "  Next steps:"
echo ""
echo "  1. Copy the .env file to the VPS:"
echo "       scp .env root@<VPS_IP>:${APP_DIR}/.env"
echo ""
echo "  2. Copy docker-compose.prod.yml (if not already):"
echo "       scp docker-compose.prod.yml root@<VPS_IP>:${APP_DIR}/"
echo ""
echo "  3. Add the CI public key to allow SSH deploy:"
echo "       nano /home/${DEPLOY_USER}/.ssh/authorized_keys"
echo ""
echo "  4. Login to GHCR and start the stack:"
echo "       echo \$GHCR_TOKEN | docker login ghcr.io -u dilnsant --password-stdin"
echo "       systemctl start revendaclick"
echo ""
echo "  5. Check health:"
echo "       rc-health"
echo ""
echo "  Logs:"
echo "       journalctl -u revendaclick -f"
echo "       docker compose -f ${APP_DIR}/docker-compose.prod.yml logs -f backend"
echo "       docker compose -f ${APP_DIR}/docker-compose.prod.yml logs -f evolution"
echo ""
echo "  Deploy (CI/CD or manual):"
echo "       rc-deploy <IMAGE_TAG>"
echo ""
echo "  Backup:"
echo "       /opt/revendaclick/backup.sh"
echo "       cat /var/log/revendaclick/backup.log"
echo ""
