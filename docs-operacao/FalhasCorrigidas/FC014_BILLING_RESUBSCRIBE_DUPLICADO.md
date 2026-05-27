# FC014 — Billing re-subscribe duplicado sem guard

## Data

2026-05-27

## Severidade

ALTA

## Sintoma

Chamadas repetidas a `POST /api/billing/subscribe` criavam múltiplas subscriptions na Asaas para o mesmo tenant. Cada chamada resetava o status do banco para `trialing` e criava uma nova `asaas_subscription_id`, anulando a subscription anterior ativa.

## Contexto

Descoberto durante teste no browser da sessão 9. O usuário fez login e acessou a página de billing duas vezes rapidamente. O frontend enviou `subscribe` duas vezes. Na segunda chamada, um novo customer e subscription foram criados, substituindo o primeiro que já havia recebido `PAYMENT_CONFIRMED`.

## Causa Raiz

`billing/service.go:Subscribe` não verificava se o tenant já tinha uma subscription ativa ou em trial antes de criar uma nova. Não havia idempotência.

```go
// ANTES: sem guard — qualquer chamada criava nova subscription
func (s *Service) Subscribe(ctx context.Context, tenantID, plan, cycle string) (*SubscriptionData, error) {
    customerID, err := s.GetAsaasCustomerID(ctx, tenantID)
    // ... criar customer se necessário
    subID, paymentLink, err := s.CreateAsaasSubscription(ctx, customerID, plan, cycle)
    // ... salvar no banco
}
```

## Arquivos Afetados

- `backend/internal/billing/service.go` — função `Subscribe`

## Banco/Migrations

Nenhuma migration. Patch SQL para corrigir a subscription duplicada que foi criada durante o teste:

```sql
-- Durante o teste, a segunda subscription resetou o banco para trialing
-- Fix manual: confirmar payment para reativar
-- (feito via webhook simulado PAYMENT_CONFIRMED na sessão 9)
```

## Correção Aplicada

Guard inserido em `Subscribe` antes de chamar a Asaas:

```go
func (s *Service) Subscribe(ctx context.Context, tenantID, plan, cycle string) (*SubscriptionData, error) {
    // GUARD: verificar se já existe subscription ativa ou em trial
    existing, err := s.repo.GetSubscription(ctx, tenantID)
    if err == nil && existing != nil {
        if (existing.Status == "active" || existing.Status == "trialing") &&
            existing.AsaasSubscriptionID != "" {
            // Retornar subscription existente sem criar nova
            s.logger.Info("subscribe guard: tenant already has active subscription",
                zap.String("tenantID", tenantID),
                zap.String("status", existing.Status))
            return existing, nil
        }
    }

    // Continuar com criação normal apenas se não houver subscription ativa
    customerID, err := s.GetAsaasCustomerID(ctx, tenantID)
    // ...
}
```

## Commit(s)

- `4cd5dee6d28c5fe5d057b542f3c7f31cf78c8855` — fix: guard against duplicate Asaas subscription on repeated POST /subscribe

## Como Validar

```bash
# 1. Fazer subscribe uma vez (deve criar subscription)
TOKEN=$(...)
curl -s -X POST https://api.revendaclick.com.br/api/billing/subscribe \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"plan":"starter","cycle":"monthly"}'
# → 200, subscription criada

# 2. Fazer subscribe novamente (deve retornar a mesma subscription sem criar nova)
curl -s -X POST https://api.revendaclick.com.br/api/billing/subscribe \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"plan":"starter","cycle":"monthly"}'
# → 200, mesma subscription (mesmo asaas_subscription_id)

# 3. Verificar no banco que há apenas uma subscription
# Supabase SQL Editor:
SELECT id, asaas_subscription_id, status, created_at
FROM subscriptions
WHERE tenant_id = '<tenant_id>'
ORDER BY created_at DESC;
# deve ter apenas 1 linha
```

## Resultado Final

Chamadas repetidas a `subscribe` para tenant com subscription ativa/trialing retornam a subscription existente sem criar nova na Asaas. Idempotente.

## Risco de Regressão

**BAIXO.** Guard está no código. Risco: se alguém adicionar uma lógica de upgrade sem passar por esse guard, pode criar subscription duplicada. Ver pendência em `20_PENDENCIAS.md`: endpoint `/upgrade` necessário para trocar de plano.

## Prevenção Futura

1. Toda operação de criação de subscription deve ter guard de idempotência verificando o estado atual.
2. Ao implementar upgrade de plano: criar endpoint `/api/billing/upgrade` dedicado (não reutilizar `/subscribe`) para evitar bypass do guard.
3. O guard atual bloqueia tanto `active` quanto `trialing` — se precisar cancelar e re-assinar, usar endpoint de cancelamento primeiro.
