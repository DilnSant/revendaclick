#!/usr/bin/env bash
# Creates a staging admin user via Supabase Admin API + backend onboarding.
#
# Usage:
#   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... API_URL=... bash scripts/create-staging-admin.sh
#
# Or source your .env files first:
#   set -a && source backend/.env && source frontend/.env.local && set +a
#   bash scripts/create-staging-admin.sh

set -euo pipefail

SUPABASE_URL="${SUPABASE_URL:-${NEXT_PUBLIC_SUPABASE_URL:-}}"
SERVICE_KEY="${SUPABASE_SERVICE_ROLE_KEY:-}"
API_URL="${NEXT_PUBLIC_API_URL:-http://localhost:8080}"

ADMIN_EMAIL="${STAGING_ADMIN_EMAIL:-admin@revendaclick.staging}"
ADMIN_PASSWORD="${STAGING_ADMIN_PASSWORD:-Staging@2025!}"
ADMIN_NAME="Admin Staging"
TENANT_SLUG="staging-demo"
TENANT_NAME="Loja Staging Demo"
TENANT_EMAIL="$ADMIN_EMAIL"
PHONE_WHATSAPP="11999999999"

if [[ -z "$SUPABASE_URL" || -z "$SERVICE_KEY" ]]; then
  echo "ERROR: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set." >&2
  exit 1
fi

echo "==> Creating Supabase auth user: $ADMIN_EMAIL"

AUTH_RESP=$(curl -s -X POST \
  "${SUPABASE_URL}/auth/v1/admin/users" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"${ADMIN_EMAIL}\",
    \"password\": \"${ADMIN_PASSWORD}\",
    \"email_confirm\": true,
    \"user_metadata\": {\"full_name\": \"${ADMIN_NAME}\"}
  }")

USER_ID=$(echo "$AUTH_RESP" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [[ -z "$USER_ID" ]]; then
  echo "ERROR: Failed to create user. Response:" >&2
  echo "$AUTH_RESP" >&2

  # Try to extract existing user if already created
  echo "==> Attempting to sign in as existing user to get token..."
fi

echo "==> Signing in to get access token..."

SESSION_RESP=$(curl -s -X POST \
  "${SUPABASE_URL}/auth/v1/token?grant_type=password" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"${ADMIN_EMAIL}\", \"password\": \"${ADMIN_PASSWORD}\"}")

ACCESS_TOKEN=$(echo "$SESSION_RESP" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)

if [[ -z "$ACCESS_TOKEN" ]]; then
  echo "ERROR: Failed to get access token. Response:" >&2
  echo "$SESSION_RESP" >&2
  exit 1
fi

echo "==> Running onboarding setup..."

SETUP_RESP=$(curl -s -X POST \
  "${API_URL}/api/onboarding/setup" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{
    \"tenant_slug\": \"${TENANT_SLUG}\",
    \"tenant_name\": \"${TENANT_NAME}\",
    \"tenant_email\": \"${TENANT_EMAIL}\",
    \"phone_whatsapp\": \"${PHONE_WHATSAPP}\",
    \"user_name\": \"${ADMIN_NAME}\"
  }")

TENANT_ID=$(echo "$SETUP_RESP" | grep -o '"tenant_id":"[^"]*"' | cut -d'"' -f4)

if [[ -z "$TENANT_ID" ]]; then
  # May already exist — check for the error
  if echo "$SETUP_RESP" | grep -q "já possui uma loja"; then
    echo "==> Tenant already exists for this user. Skipping setup."
  else
    echo "ERROR: Onboarding setup failed. Response:" >&2
    echo "$SETUP_RESP" >&2
    exit 1
  fi
else
  echo "==> Tenant created: $TENANT_ID"
fi

echo ""
echo "============================================"
echo " STAGING ADMIN CREDENTIALS"
echo "============================================"
echo " URL:      ${API_URL%:8080}:3000 (or your staging URL)"
echo " Email:    ${ADMIN_EMAIL}"
echo " Password: ${ADMIN_PASSWORD}"
echo " Tenant:   ${TENANT_SLUG}"
echo "============================================"
