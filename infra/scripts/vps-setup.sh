#!/usr/bin/env bash
# VPS initial setup for RevendaClick production stack
# Run once as root on a fresh Ubuntu 22.04 VPS
set -euo pipefail

DEPLOY_USER="revendaclick"
APP_DIR="/opt/revendaclick"

echo "==> Updating system packages"
apt-get update -y && apt-get upgrade -y

echo "==> Installing dependencies"
apt-get install -y curl git ufw fail2ban htop

echo "==> Installing Docker Engine"
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
  | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
  | tee /etc/apt/sources.list.d/docker.list > /dev/null
apt-get update -y
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

systemctl enable --now docker

echo "==> Creating deploy user"
if ! id "$DEPLOY_USER" &>/dev/null; then
  useradd -m -s /bin/bash "$DEPLOY_USER"
fi
usermod -aG docker "$DEPLOY_USER"

echo "==> Creating app directory"
mkdir -p "$APP_DIR"
chown "$DEPLOY_USER:$DEPLOY_USER" "$APP_DIR"

echo "==> Configuring UFW firewall"
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

echo "==> Enabling fail2ban"
systemctl enable --now fail2ban

echo ""
echo "VPS setup complete."
echo "Next steps:"
echo "  1. Copy docker-compose.prod.yml to $APP_DIR/"
echo "  2. Copy .env.prod to $APP_DIR/.env"
echo "  3. Add your SSH public key to ~/.ssh/authorized_keys"
echo "  4. Run: docker compose -f $APP_DIR/docker-compose.prod.yml up -d"
