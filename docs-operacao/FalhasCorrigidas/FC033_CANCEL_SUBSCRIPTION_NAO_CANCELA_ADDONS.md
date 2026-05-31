---
id: FC033
título: Cancelamento da assinatura principal não cancela automaticamente subscription_addons
área: Billing / Add-ons
severidade: MÉDIA
prioridade: MÉDIA
bloqueante: NÃO
data: 2026-05-31
status: CORRIGIDO (sessão 30 — Opção A aprovada)
commit: 529efb2
---

# FC033 — CancelSubscription não cancela add-ons automaticamente

## Sintoma

Quando um tenant cancela a assinatura principal via `DELETE /api/billing/subscription`,
os add-ons ativos continuam com `status='active'` em `subscription_addons` e continuam
gerando cobranças recorrentes no Asaas.

## Causa Raiz

`CancelSubscription` chamava apenas `repo.CancelByTenantID` que executa:

```sql
UPDATE subscriptions SET status='canceled', canceled_at=NOW() WHERE tenant_id=$1
```

`subscription_addons` não era tocada.

## Decisão de Negócio

**Opção A aprovada:** sem plano ativo = sem add-ons ativos.

Ao cancelar a assinatura principal, todos os add-ons são cancelados automaticamente:
- Asaas subscription de cada add-on cancelada (best-effort)
- `subscription_addons.status = 'canceled'` + `canceled_at = NOW()`
- Reativação da assinatura principal **não** restaura add-ons

## Correção Implementada

### `billing/repository.go` — 2 novos métodos

```go
// ListActiveAddonIDs retorna todos os add-ons não-cancelados do tenant.
func (r *Repository) ListActiveAddonIDs(ctx, tenantID) ([]*AddonRecord, error)
  SELECT id, COALESCE(asaas_addon_id,'')
  FROM subscription_addons
  WHERE tenant_id=$1 AND status IN ('active','pending_payment','past_due')

// CancelAllAddonsByTenantID bulk-cancela no DB.
func (r *Repository) CancelAllAddonsByTenantID(ctx, tenantID) error
  UPDATE subscription_addons SET status='canceled', canceled_at=NOW()
  WHERE tenant_id=$1 AND status IN ('active','pending_payment','past_due')
```

### `billing/service.go` — helper + 2 call sites

```go
// cancelTenantAddons: cancela no Asaas (best-effort) + bulk-cancel no DB.
func (s *Service) cancelTenantAddons(ctx, tenantID)

// CancelSubscription: chama cancelTenantAddons antes de CancelByTenantID.
// dispatchWebhookEvent: agora recebe tenantID e chama cancelTenantAddons
//   nos eventos SUBSCRIPTION_CANCELED e SUBSCRIPTION_DELETED.
```

### `CancelButton.tsx` — aviso visual

Aviso estático antes do botão + mensagem no `confirm()`:
> "Ao cancelar sua assinatura, todos os recursos adicionais contratados também serão cancelados."

## Smoke Tests Executados — 7/7 ✓

| # | Cenário | Resultado |
|---|---|---|
| T1 | 3 add-ons (active + pending_payment + past_due) → SUBSCRIPTION_CANCELED | Todos `canceled` ✓ |
| T2 | Reativação após cancelamento | Add-ons permanecem `canceled` ✓ |
| T3 | Cancelamento sem add-ons ativos | Sem erro ✓ |
| T4 | Evento duplicado (idempotência) | Bloqueado por TryLockEvent ✓ |
| T5 | Add-on grandfathered (`asaas_addon_id IS NULL`) | Só DB, sem chamada Asaas ✓ |
| T6 | Evento SUBSCRIPTION_DELETED (alternativo) | Cascata funciona ✓ |
| T7 | `DELETE /api/billing/subscription` direto (owner JWT) | `{"canceled":true}`, add-ons `canceled` ✓ |

## Query de Regressão

```sql
-- Deve retornar zero linhas se FC033 estiver correto
SELECT sa.status, sa.asaas_addon_id
FROM subscription_addons sa
JOIN subscriptions s ON s.tenant_id = sa.tenant_id
WHERE s.status = 'canceled'
  AND sa.status IN ('active', 'pending_payment', 'past_due');
```
