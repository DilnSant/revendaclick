# FC034 — Asaas invalid_action em assinatura deletada

## Identificação

| Campo | Valor |
|---|---|
| ID | FC034 |
| Título | Asaas `invalid_action` em upgrade/downgrade — assinatura deletada não pode ser atualizada via PUT |
| Área | Billing / Asaas |
| Severidade | ALTA |
| Data | 02/06/2026 |
| Sessão | 36 |
| Commit fix | `aad9051` |

---

## Sintoma

Todas as operações de upgrade, downgrade e troca de ciclo do tenant retornavam:

```
HTTP 400 — invalid_action
"A assinatura [sub_gqu4uiro0sisshxt] não pode ser atualizada."
```

---

## Causa Raiz

**Origem:** `backend/internal/billing/service.go` → função `UpgradeSubscription`

**Arquivo responsável:** `backend/internal/billing/service.go`

**Função responsável:** `UpgradeSubscription`

**Tabela responsável:** `public.subscriptions` (campo `asaas_subscription_id`)

**Sequência de eventos:**
1. A assinatura `sub_gqu4uiro0sisshxt` foi criada em sessão 27 e cancelada posteriormente.
2. O Asaas marca assinaturas canceladas como `deleted: true`. Assinaturas deletadas **não podem ser atualizadas via `PUT /subscriptions/{id}`**.
3. O código chamava sempre `updateSubscription` (PUT) — não havia fallback para o caso de assinatura deletada.
4. Resultado: `400 invalid_action` em 100% das tentativas de upgrade/downgrade.

---

## Correção Aplicada

Adicionado bloco de fallback em `UpgradeSubscription` após `updateSubscription` falhar com `invalid_action`:

1. Detecta `invalid_action` no erro retornado pelo Asaas
2. Busca `asaas_customer_id` do tenant via `GetAsaasCustomerID`
3. Cria nova assinatura Asaas via `createSubscription` (POST)
4. Obtém link de pagamento via `getSubscriptionPayments`
5. Salva novo `asaas_subscription_id` + `billing_cycle` + `plan_id` via `UpdateSubscriptionAsaas` (status = trialing)
6. Em caso de erro ao salvar: cancela nova assinatura no Asaas (best-effort cleanup)

---

## Prevenção

- **Não assumir** que uma `asaas_subscription_id` armazenada no banco está ativa no Asaas — assinaturas podem ser deletadas externamente.
- Todo fluxo que chama `updateSubscription` deve ter fallback para `invalid_action`.
- Ao cancelar assinatura manualmente no Asaas, atualizar o campo no banco para refletir o novo estado (ou limpar).
- Ao diagnosticar erros de upgrade/downgrade: verificar primeiro o status real da assinatura via API Asaas diretamente (requer origem do VPS por restrição de IP).

---

## Como Validar (Regressão)

```bash
# 1. Verificar status da assinatura no banco
SELECT asaas_subscription_id, status, plan_id FROM subscriptions WHERE tenant_id = 'fd1172f6-11e7-4555-8fe3-082fd1849587';

# 2. Tentar upgrade via API (autenticado como santos-car)
PUT /api/billing/subscription
{"plan_id": "...", "billing_cycle": "MONTHLY"}

# Resultado esperado: 200 OK (PUT normal ou fallback com nova assinatura)
# Resultado inesperado: 400 invalid_action (fallback não ativou)
```

---

## Resultado Pós-Correção

| Cenário | Resultado |
|---|---|
| Upgrade Pro → Premium (assinatura deletada) | ✅ Fallback criou `sub_b3y3xwo9s18g50xc` |
| Downgrade Premium → Pro (assinatura ativa) | ✅ PUT normal |
| Mensal → Anual | ✅ |
| Anual → Mensal | ✅ |
| Upgrade Pro → Premium (assinatura ativa) | ✅ PUT normal |
| Downgrade Premium → Starter | ✅ |
