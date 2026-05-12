#!/usr/bin/env bash
# Production deploy script — pulls latest images and restarts services
# Usage: ./deploy.sh [IMAGE_TAG]
# If IMAGE_TAG is omitted, defaults to "latest"
set -euo pipefail

APP_DIR="/opt/revendaclick"
COMPOSE_FILE="$APP_DIR/docker-compose.prod.yml"
ENV_FILE="$APP_DIR/.env"
IMAGE_TAG="${1:-latest}"

if [[ ! -f "$COMPOSE_FILE" ]]; then
  echo "ERROR: $COMPOSE_FILE not found. Run vps-setup.sh first." >&2
  exit 1
fi

if [[ ! -f "$ENV_FILE" ]]; then
  echo "ERROR: $ENV_FILE not found. Create it from .env.prod.example." >&2
  exit 1
fi

echo "==> Deploying RevendaClick (tag: $IMAGE_TAG)"

echo "==> Logging in to GHCR"
echo "$GHCR_TOKEN" | docker login ghcr.io -u "$GHCR_USER" --password-stdin

echo "==> Pulling images"
IMAGE_TAG="$IMAGE_TAG" docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" pull

echo "==> Restarting services (zero-downtime)"
IMAGE_TAG="$IMAGE_TAG" docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d \
  --remove-orphans \
  --force-recreate

echo "==> Waiting for healthchecks"
sleep 10
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" ps

echo "==> Pruning old images"
docker image prune -f --filter "until=24h"

echo ""
echo "Deploy complete. Services:"
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" ps --format "table {{.Name}}\t{{.Status}}"
