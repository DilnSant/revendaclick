# FC031 — ActivateByAsaasSubID não limpava canceled_at

**ID:** FC031
**Área:** Billing / Backend
**Severidade:** ALTA
**Data:** 2026-05-31
**Status:** CORRIGIDO

---

## Sintoma

Após uma sequência `SUBSCRIPTION_DELETED` → `PAYMENT_CONFIRMED` (reativação), a subscription ficava com `status = 'active'` mas `canceled_at` ainda preenchido com a data do cancelamento anterior. Qualquer lógica que verifique `canceled_at IS NOT NULL` tratava o tenant como cancelado, apesar do status ativo.

Descoberto durante teste ao vivo do pipeline webhook em produção (sessão 27), onde foi necessário limpar manualmente:
```sql
UPDATE subscriptions SET canceled_at = NULL WHERE tenant_id = 'fd1172f6-11e7-4555-8fe3-082fd1849587';
```

---

## Causa Raiz

`ActivateByAsaasSubID` em `backend/internal/billing/repository.go` não incluía `canceled_at = NULL` no UPDATE:

```go
// ANTES (bug):
UPDATE subscriptions SET
    status                = 'active',
    current_period_start  = NOW(),
    current_period_end    = $2,
    trial_ends_at         = NULL,
    grace_until           = NULL
WHERE asaas_subscription_id = $1
```

A coluna `canceled_at` era definida por `CancelByAsaasSubID` mas nunca revertida na ativação.

---

## Correção Aplicada

**Arquivo:** `backend/internal/billing/repository.go` (linha ~105)

```go
// DEPOIS (correto):
UPDATE subscriptions SET
    status                = 'active',
    current_period_start  = NOW(),
    current_period_end    = $2,
    trial_ends_at         = NULL,
    grace_until           = NULL,
    canceled_at           = NULL
WHERE asaas_subscription_id = $1
```

**Commit:** ver histórico git — sessão 28

---

## Como Validar

1. Enviar `SUBSCRIPTION_DELETED` via `POST /api/admin/billing/simulate-event`
2. Verificar `canceled_at IS NOT NULL` no banco
3. Enviar `PAYMENT_CONFIRMED` via simulate-event
4. Verificar `canceled_at IS NULL` e `status = 'active'`

```sql
SELECT status, canceled_at, current_period_end
FROM subscriptions
WHERE asaas_subscription_id = 'dev_test_fd1172f6-11e7-4555-8fe3-082fd1849587';
```

---

## Prevenção

Ao implementar qualquer função `Activate*`, sempre incluir reset explícito de TODOS os campos de estado negativo (`trial_ends_at`, `grace_until`, `canceled_at`). Nunca assumir que um campo NULL anterior permanece NULL após um cancelamento no ciclo de vida da subscription.
