# FC012 — Billing SQL args duplicado / $2 nunca referenciado

## Data

2026-05-26

## Severidade

ALTA

## Sintoma

`POST /api/billing/subscribe` retornava erro 500 com mensagem:
```
update subscription: unused argument: 1
```

O `subscribe` criava o customer e a subscription na Asaas com sucesso, mas falhava ao tentar salvar no banco.

## Contexto

Após a subscription ser criada na Asaas, o backend chama `UpdateSubscriptionAsaas` para gravar os dados da subscription no banco (`asaas_subscription_id`, `asaas_customer_id`, etc.). Essa etapa falhava com o erro de pgx sobre argumento não utilizado.

## Causa Raiz

A query SQL em `UpdateSubscriptionAsaas` (arquivo `backend/internal/billing/repository.go`) usava os placeholders `$1, $3, $4, $5, $6` — **pulando `$2`**. Os argumentos eram passados com `tenantID` duplicado:

```go
// ERRADO:
query := `UPDATE subscriptions SET
    plan_name = $3,
    asaas_subscription_id = $4,
    asaas_payment_link = $5,
    billing_cycle = $6
  WHERE tenant_id = $1 AND id = $1`  // $1 usado duas vezes, $2 nunca usado

args := []any{tenantID, tenantID, planID, asaasSubID, paymentLink, cycle}
//            $1=tenantID  $2=tenantID(DUPLICADO — não referenciado)  $3...
```

O pgx (PostgreSQL driver para Go) é estrito: se um argumento é passado mas não referenciado na query, retorna `unused argument: <índice>`. O índice 1 (base 0) = segundo argumento = `tenantID` duplicado que nunca era usado.

## Arquivos Afetados

- `backend/internal/billing/repository.go` — função `UpdateSubscriptionAsaas`

## Banco/Migrations

Nenhuma migration. A tabela `subscriptions` está correta — o bug era no código Go.

## Correção Aplicada

```go
// ANTES (placeholders pulando $2, tenantID duplicado):
func (r *Repository) UpdateSubscriptionAsaas(ctx context.Context,
    tenantID, planID, asaasSubID, paymentLink, cycle string) error {
    _, err := r.pool.Exec(ctx, `
        UPDATE subscriptions SET
            plan_name = $3,
            asaas_subscription_id = $4,
            asaas_payment_link = $5,
            billing_cycle = $6
        WHERE tenant_id = $1`,
        tenantID, tenantID, planID, asaasSubID, paymentLink, cycle)
    return err
}

// DEPOIS (placeholders sequenciais, sem duplicação):
func (r *Repository) UpdateSubscriptionAsaas(ctx context.Context,
    tenantID, planID, asaasSubID, paymentLink, cycle string) error {
    _, err := r.pool.Exec(ctx, `
        UPDATE subscriptions SET
            plan_name = $2,
            asaas_subscription_id = $3,
            asaas_payment_link = $4,
            billing_cycle = $5
        WHERE tenant_id = $1`,
        tenantID, planID, asaasSubID, paymentLink, cycle)
    return err
}
```

## Commit(s)

- `71d6ba63c486e1a999dc05c9a091c44332828cd9` — fix: billing subscribe — remove duplicate tenantID arg in UpdateSubscriptionAsaas

## Como Validar

```bash
# 1. Fazer subscribe via API
TOKEN=$(...)
curl -s -X POST https://api.revendaclick.com.br/api/billing/subscribe \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"plan":"starter","cycle":"monthly"}'
# deve retornar 200 com subscription data (sem erro 500)

# 2. Verificar que subscription foi salva no banco
# Supabase SQL Editor:
SELECT asaas_subscription_id, plan_name, billing_cycle
FROM subscriptions
WHERE tenant_id = '<tenant_id>';
# deve ter valores corretos (não null)
```

## Resultado Final

`UpdateSubscriptionAsaas` executa sem erro. Subscribe end-to-end funciona: subscription criada na Asaas → salva no banco.

## Risco de Regressão

**BAIXO.** Fix simples de renumeração de placeholders. Risco: ao modificar a query (adicionar/remover campos), verificar que todos os `$N` são sequenciais e correspondem aos args na ordem correta.

## Prevenção Futura

1. Sempre verificar que placeholders `$1, $2, $3...` são sequenciais e correspondem 1:1 com os argumentos na slice.
2. pgx retorna `unused argument: N` quando um arg não é referenciado — esse erro nunca deve ser ignorado.
3. Escrever um teste que execute `UpdateSubscriptionAsaas` contra banco real para detectar esse tipo de bug antes do deploy.
4. Ao copiar queries SQL como template, verificar especialmente a contagem de `$N` vs o número de args.
