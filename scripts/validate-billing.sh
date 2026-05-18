#!/usr/bin/env bash
# =============================================================================
# RevendaClick — Asaas Billing Flow Validation Script
# Simula eventos de webhook do Asaas para validar o fluxo completo.
#
# Uso:
#   export API=https://api.revendaclick.com.br
#   export ASAAS_TOKEN=<ASAAS_WEBHOOK_TOKEN do .env>
#   export ASAAS_SUB_ID=<sub_xxx — ID da assinatura no Asaas>
#   export ASAAS_PAYMENT_ID=<pay_xxx — ID de um pagamento>
#   ./scripts/validate-billing.sh
# =============================================================================
set -euo pipefail

API="${API:-https://api.revendaclick.com.br}"
TOKEN="${ASAAS_TOKEN:-}"
SUB_ID="${ASAAS_SUB_ID:-sub_test_001}"
PAY_ID="${ASAAS_PAYMENT_ID:-pay_test_001}"
NOW="$(date +%Y-%m-%d)"

WEBHOOK_URL="${API}/api/webhooks/asaas"
HEADERS=(-H "Content-Type: application/json")
if [ -n "$TOKEN" ]; then
  HEADERS+=(-H "asaas-access-token: ${TOKEN}")
fi

pass() { echo "  ✓ $1"; }
fail() { echo "  ✗ $1"; exit 1; }
section() { echo; echo "── $1 ──────────────────────────────────────────"; }

# ── 1. Health check ──────────────────────────────────────────────────────────
section "1. Health check"
STATUS=$(curl -sf -o /dev/null -w "%{http_code}" "${API}/health" || echo "000")
[ "$STATUS" = "200" ] && pass "GET /health → 200" || fail "GET /health → ${STATUS} (backend offline)"

# ── 2. Webhook: PAYMENT_CONFIRMED (ativa subscription) ───────────────────────
section "2. PAYMENT_CONFIRMED → status=active"
PAYLOAD_CONFIRMED=$(cat <<JSON
{
  "event": "PAYMENT_CONFIRMED",
  "payment": {
    "id": "${PAY_ID}_confirmed",
    "customer": "cus_test",
    "subscription": "${SUB_ID}",
    "value": 99.90,
    "status": "CONFIRMED",
    "dueDate": "${NOW}",
    "billingType": "BOLETO"
  }
}
JSON
)
STATUS=$(curl -sf -o /dev/null -w "%{http_code}" -X POST "${WEBHOOK_URL}" \
  "${HEADERS[@]}" -d "$PAYLOAD_CONFIRMED" || echo "000")
[ "$STATUS" = "200" ] && pass "PAYMENT_CONFIRMED → 200" || fail "PAYMENT_CONFIRMED → ${STATUS}"

# Idempotency: mesma payload de novo deve retornar 200 (evento ignorado)
STATUS=$(curl -sf -o /dev/null -w "%{http_code}" -X POST "${WEBHOOK_URL}" \
  "${HEADERS[@]}" -d "$PAYLOAD_CONFIRMED" || echo "000")
[ "$STATUS" = "200" ] && pass "Idempotency (replay) → 200 (already processed)" || fail "Idempotency → ${STATUS}"

# ── 3. Webhook: PAYMENT_RECEIVED (alternativo ao CONFIRMED) ──────────────────
section "3. PAYMENT_RECEIVED → status=active"
PAYLOAD_RECEIVED=$(cat <<JSON
{
  "event": "PAYMENT_RECEIVED",
  "payment": {
    "id": "${PAY_ID}_received",
    "customer": "cus_test",
    "subscription": "${SUB_ID}",
    "value": 99.90,
    "status": "RECEIVED",
    "dueDate": "${NOW}",
    "billingType": "PIX"
  }
}
JSON
)
STATUS=$(curl -sf -o /dev/null -w "%{http_code}" -X POST "${WEBHOOK_URL}" \
  "${HEADERS[@]}" -d "$PAYLOAD_RECEIVED" || echo "000")
[ "$STATUS" = "200" ] && pass "PAYMENT_RECEIVED → 200" || fail "PAYMENT_RECEIVED → ${STATUS}"

# ── 4. Webhook: PAYMENT_OVERDUE (past_due + grace period) ────────────────────
section "4. PAYMENT_OVERDUE → status=past_due (grace 3 days)"
PAYLOAD_OVERDUE=$(cat <<JSON
{
  "event": "PAYMENT_OVERDUE",
  "payment": {
    "id": "${PAY_ID}_overdue",
    "customer": "cus_test",
    "subscription": "${SUB_ID}",
    "value": 99.90,
    "status": "OVERDUE",
    "dueDate": "${NOW}",
    "billingType": "BOLETO"
  }
}
JSON
)
STATUS=$(curl -sf -o /dev/null -w "%{http_code}" -X POST "${WEBHOOK_URL}" \
  "${HEADERS[@]}" -d "$PAYLOAD_OVERDUE" || echo "000")
[ "$STATUS" = "200" ] && pass "PAYMENT_OVERDUE → 200" || fail "PAYMENT_OVERDUE → ${STATUS}"

# ── 5. Webhook: SUBSCRIPTION_CANCELED ────────────────────────────────────────
section "5. SUBSCRIPTION_CANCELED → status=canceled"
PAYLOAD_CANCELED=$(cat <<JSON
{
  "event": "SUBSCRIPTION_CANCELED",
  "subscription": {
    "id": "${SUB_ID}",
    "status": "INACTIVE",
    "cycle": "MONTHLY"
  }
}
JSON
)
STATUS=$(curl -sf -o /dev/null -w "%{http_code}" -X POST "${WEBHOOK_URL}" \
  "${HEADERS[@]}" -d "$PAYLOAD_CANCELED" || echo "000")
[ "$STATUS" = "200" ] && pass "SUBSCRIPTION_CANCELED → 200" || fail "SUBSCRIPTION_CANCELED → ${STATUS}"

# ── 6. Webhook sem token (deve retornar 401 quando token configurado) ──────────
section "6. Webhook sem token → 401"
if [ -n "$TOKEN" ]; then
  STATUS=$(curl -sf -o /dev/null -w "%{http_code}" -X POST "${WEBHOOK_URL}" \
    -H "Content-Type: application/json" -d '{"event":"PAYMENT_CONFIRMED"}' || echo "000")
  [ "$STATUS" = "401" ] && pass "Sem token → 401 (validação OK)" || fail "Sem token → ${STATUS} (esperado 401)"
else
  pass "Token não configurado — validação de auth pulada"
fi

# ── 7. Payload inválido ────────────────────────────────────────────────────────
section "7. Payload inválido → 400"
STATUS=$(curl -sf -o /dev/null -w "%{http_code}" -X POST "${WEBHOOK_URL}" \
  "${HEADERS[@]}" -d 'not-json' || echo "000")
[ "$STATUS" = "400" ] && pass "Payload inválido → 400" || fail "Payload inválido → ${STATUS}"

echo
echo "═══════════════════════════════════════════════════"
echo "  Todos os testes passaram. Fluxo Asaas OK."
echo "═══════════════════════════════════════════════════"
echo
echo "Próximo: verificar no Supabase se subscription foi atualizada:"
echo "  SELECT status, grace_until, current_period_end FROM subscriptions"
echo "  WHERE asaas_subscription_id = '${SUB_ID}';"
