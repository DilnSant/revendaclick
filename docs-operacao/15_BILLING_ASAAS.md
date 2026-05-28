# 15 — BILLING (ASAAS)

> Baseado em: `backend/internal/billing/`, `database/migrations/004_billing.sql`, `database/schema.sql`.

---

## O Que é o Asaas

Asaas é o gateway de pagamentos brasileiro usado pelo RevendaClick.

Suporta:
- **BOLETO** — padrão (default)
- **PIX**
- **CREDIT_CARD**

Ciclos: `MONTHLY` | `YEARLY`

---

## Planos Disponíveis

| Plano | Acesso |
|---|---|
| `starter` | Funcionalidades básicas |
| `pro` | + analytics (`PlanGate("analytics")`) |
| `premium` | Pro + mais limites |
| `enterprise` | Sem limites |

Preços e limites estão na tabela `plans` no banco. Ver `05_SUPABASE.md`.

---

## Status de Assinatura

| Status | Significado | Acesso ao sistema |
|---|---|---|
| `trialing` | Período de trial | Liberado |
| `active` | Assinatura paga ativa | Liberado |
| `past_due` | Pagamento atrasado | Liberado se dentro do `grace_until` (3 dias) |
| `past_due` | Pagamento atrasado | **Bloqueado** se passou `grace_until` |
| `canceled` | Cancelada | **Bloqueado** |
| `paused` | Pausada | **Bloqueado** |

**Grace period:** Trigger `set_subscription_grace` seta `grace_until = NOW() + 3 days` quando status muda para `past_due`.

Header `X-Subscription-Warning` é injetado quando dentro do grace period.

---

## Fluxo de Assinatura

```
1. Usuário acessa /billing → POST /api/billing/subscribe
2. Backend verifica se tenant tem asaas_customer_id
   ├── Não tem → cria customer no Asaas API
   └── Tem → usa o existente
3. Cria subscription no Asaas (retorna ID + payment link)
4. Salva asaas_subscription_id + asaas_payment_link na tabela subscriptions
5. Usuário paga via link ou boleto gerado
6. Asaas envia webhook PAYMENT_CONFIRMED
7. Backend ativa a subscription no banco
```

---

## Rotas de Billing

| Método | Rota | Roles | Descrição |
|---|---|---|---|
| GET | `/api/billing/subscription` | qualquer | Retorna assinatura atual com flags computadas |
| POST | `/api/billing/subscribe` | owner, admin | Cria assinatura (trialing ou sem asaas_subscription_id) |
| PUT | `/api/billing/subscription` | owner, admin | Troca plano de assinatura ativa — requer `status=active` + `asaas_subscription_id` |
| DELETE | `/api/billing/subscription` | owner, admin | Cancela assinatura |
| POST | `/api/billing/reactivate` | owner, admin | Reativa assinatura cancelada |
| GET | `/api/billing/invoices` | qualquer | Histórico de faturas (últimas 30) |
| POST | `/api/webhooks/asaas` | público | Recebe eventos do Asaas |

---

## Body: PUT /api/billing/subscription (upgrade de plano)

```json
{
  "plan_name": "pro",
  "billing_cycle": "monthly"
}
```

- `plan_name`: novo plano (`starter` | `pro` | `premium` | `enterprise`)
- `billing_cycle`: opcional — usa o ciclo atual se omitido
- Requer `status=active` e `asaas_subscription_id` preenchido
- Chama Asaas `PUT /subscriptions/{id}` — novo valor/ciclo efetivo no próximo ciclo
- Status local não é alterado — usuário mantém acesso imediatamente
- No-op se mesmo plano + mesmo ciclo

---

## Body: POST /api/billing/subscribe

```json
{
  "plan_name": "pro",
  "billing_cycle": "monthly",
  "billing_type": "BOLETO",
  "cpf_or_cnpj": "000.000.000-00"
}
```

- `plan_name`: `starter` | `pro` | `premium` | `enterprise`
- `billing_cycle`: `monthly` (padrão) | `yearly`
- `billing_type`: `BOLETO` (padrão) | `PIX` | `CREDIT_CARD`
- `cpf_or_cnpj`: opcional, necessário para criar customer no Asaas

---

## Resposta: GET /api/billing/subscription

```json
{
  "id": "uuid",
  "tenant_id": "uuid",
  "plan_name": "pro",
  "status": "active",
  "billing_cycle": "monthly",
  "current_period_end": "2025-12-01T00:00:00Z",
  "grace_until": null,
  "asaas_payment_link": "https://www.asaas.com/...",
  "price_monthly": 97.00,
  "price_yearly": 970.00,
  "is_trialing": false,
  "is_active": true,
  "is_past_due": false,
  "is_canceled": false,
  "is_blocked": false,
  "trial_days_left": 0
}
```

---

## Webhook Asaas

**Rota:** `POST /api/webhooks/asaas` (pública)
**Autenticação:** Header `asaas-access-token: <ASAAS_WEBHOOK_TOKEN>`
**Limite de payload:** 64KB

### Eventos tratados

| Evento | Ação no banco |
|---|---|
| `PAYMENT_RECEIVED` | Ativa subscription, calcula próximo período |
| `PAYMENT_CONFIRMED` | Idem acima |
| `PAYMENT_OVERDUE` | Status → `past_due` (trigger seta grace_until) |
| `PAYMENT_REFUNDED` | Status → `past_due` |
| `SUBSCRIPTION_CANCELED` | Status → `canceled` |
| `SUBSCRIPTION_DELETED` | Status → `canceled` |
| `SUBSCRIPTION_CREATED` | Informacional — apenas registrado em billing_events |
| `SUBSCRIPTION_UPDATED` | Informacional — apenas registrado em billing_events |
| `PAYMENT_DELETED` | Informacional — apenas registrado em billing_events |

### Idempotência

Antes de processar, insere `event_key = "<EVENTO>:<asaas_id>"` em `billing_events`.
Se já existe → ignora (não processa duplicado).

---

## Tabelas de Banco (Billing)

| Tabela | Dados |
|---|---|
| `subscriptions` | Status, datas, IDs Asaas, grace_until |
| `billing_customers` | Mapeamento tenant_id → asaas_customer_id |
| `billing_events` | Log de webhooks com idempotency key |
| `billing_invoices` | Faturas individuais (upsert por asaas_payment_id) |

Coluna em `tenants`: `asaas_customer_id TEXT`

---

## Ambientes Asaas

| Variável | Desenvolvimento | Produção |
|---|---|---|
| `ASAAS_ENV` | `sandbox` | `production` |
| `ASAAS_API_KEY` | chave de sandbox | chave de produção |

**URL Sandbox:** `https://sandbox.asaas.com/api/v3`
**URL Produção:** `https://www.asaas.com/api/v3`

---

## Flags Computadas (ComputeFlags)

```go
IsTrialing = status == "trialing"
IsActive   = status == "active"
IsPastDue  = status == "past_due"
IsCanceled = status == "canceled" || status == "paused"
IsBlocked  = IsCanceled || (IsPastDue && time.Now() > grace_until)
```

`IsBlocked = true` → frontend redireciona para `/billing?reason=blocked`.

---

## Configurar Webhook no Asaas

1. Asaas Dashboard → Integrações → Webhooks
2. URL: `https://api.revendaclick.com.br/api/webhooks/asaas`
3. Token: valor de `ASAAS_WEBHOOK_TOKEN` no `.env`
4. Eventos: marcar todos (`PAYMENT_*`, `SUBSCRIPTION_*`)

---

## Riscos

| Ação | Risco |
|---|---|
| Alterar `ASAAS_WEBHOOK_TOKEN` sem atualizar no Asaas | Todos os webhooks passam a retornar 401 — assinaturas não são atualizadas |
| Trocar `ASAAS_ENV` para `production` em desenvolvimento | Cobranças reais são criadas |
| Remover billing_events | Perde proteção de idempotência — eventos podem ser processados em duplicata |
| Alterar grace period no trigger sem migração | Tenants passam a ser bloqueados/liberados em tempo diferente do esperado |
