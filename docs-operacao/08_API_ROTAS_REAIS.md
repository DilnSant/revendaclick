# 08 — API ROTAS REAIS

> Extraído diretamente de `backend/internal/server/server.go`.
> Nenhuma rota inferida.

---

## Convenções

- **Base URL produção:** `https://api.revendaclick.com.br`
- **Auth:** `Authorization: Bearer <supabase_access_token>`
- **Formato:** JSON (`Content-Type: application/json`)
- **Resposta sucesso:** `{ "data": {...} }` ou array direto
- **Resposta erro:** `{ "error": { "code": "...", "message": "..." } }`

---

## Sem Autenticação

| Método | Rota | Descrição |
|---|---|---|
| GET | `/health` | Health check com ping ao banco |
| GET | `/api/v1/health` | Health check simples |
| GET | `/metrics` | Prometheus (requer Bearer METRICS_TOKEN; bloqueado por nginx para IPs externos) |
| GET | `/api/plans` | Lista todos os planos (pricing page) |
| GET | `/api/public/:slug/` | Dados públicos da loja pelo slug (inclui `public_contact`) |
| GET | `/api/public/:slug/vehicles` | Veículos disponíveis da loja |
| GET | `/api/public/:slug/vehicles/:vehicleSlug` | Veículo específico pelo slug |
| POST | `/api/public/:slug/leads` | Cria lead (formulário público) |
| POST | `/api/webhooks/evolution` | Webhook Evolution API (WhatsApp) |
| POST | `/api/webhooks/asaas` | Webhook Asaas (billing) |

---

## Onboarding (JWT, sem tenant)

| Método | Rota | Roles | Limite |
|---|---|---|---|
| POST | `/api/onboarding/setup` | qualquer autenticado | StrictRateLimit |

---

## Billing e Tenant (JWT + tenant, sem subscription gate)

| Método | Rota | Roles |
|---|---|---|
| GET | `/api/tenants/me` | qualquer |
| PUT | `/api/tenants/me` | owner, admin |
| GET | `/api/usage` | qualquer |
| GET | `/api/onboarding` | qualquer |
| PUT | `/api/onboarding` | qualquer |
| GET | `/api/billing/subscription` | qualquer |
| POST | `/api/billing/subscribe` | owner, admin |
| PUT | `/api/billing/subscription` | owner, admin |
| DELETE | `/api/billing/subscription` | owner, admin |
| POST | `/api/billing/reactivate` | owner, admin |
| GET | `/api/billing/invoices` | qualquer |
| GET | `/api/store-contact` | qualquer |
| PUT | `/api/store-contact` | owner, admin |

---

## Veículos (JWT + tenant + subscription ativa)

| Método | Rota | Roles |
|---|---|---|
| GET | `/api/vehicles` | qualquer |
| POST | `/api/vehicles` | qualquer |
| GET | `/api/vehicles/:id` | qualquer |
| PUT | `/api/vehicles/:id` | qualquer |
| DELETE | `/api/vehicles/:id` | owner, admin |

---

## Leads (JWT + tenant + subscription ativa)

| Método | Rota | Roles |
|---|---|---|
| GET | `/api/leads` | qualquer |
| GET | `/api/leads/follow-ups` | qualquer |
| POST | `/api/leads` | qualquer |
| GET | `/api/leads/:id` | qualquer |
| PUT | `/api/leads/:id` | qualquer |
| DELETE | `/api/leads/:id` | owner, admin |
| GET | `/api/leads/:id/activities` | qualquer |
| POST | `/api/leads/:id/activities` | qualquer |

---

## Usuários (JWT + tenant + subscription ativa)

| Método | Rota | Roles |
|---|---|---|
| GET | `/api/users/sellers` | qualquer |
| GET | `/api/users` | owner, admin |
| POST | `/api/users` | owner, admin |
| GET | `/api/users/:id` | qualquer |
| PUT | `/api/users/:id` | qualquer |
| DELETE | `/api/users/:id` | owner, admin |

---

## Clientes (JWT + tenant + subscription ativa)

| Método | Rota | Roles |
|---|---|---|
| GET | `/api/customers` | qualquer |
| POST | `/api/customers` | qualquer |
| GET | `/api/customers/:id` | qualquer |
| PUT | `/api/customers/:id` | qualquer |
| DELETE | `/api/customers/:id` | owner, admin |

---

## Financeiro (JWT + tenant + subscription ativa)

| Método | Rota | Roles |
|---|---|---|
| GET | `/api/financial/entries` | qualquer |
| POST | `/api/financial/entries` | qualquer |
| GET | `/api/financial/cash-flow` | qualquer |
| GET | `/api/sales` | qualquer |
| POST | `/api/sales` | qualquer |
| GET | `/api/sales/:id` | qualquer |
| POST | `/api/sales/:id/complete` | owner, admin |
| POST | `/api/sales/:id/cancel` | owner, admin |
| GET | `/api/commissions` | qualquer |
| PATCH | `/api/commissions/:id/pay` | owner, admin |

---

## Analytics (JWT + tenant + subscription ativa + plano Pro+)

| Método | Rota | Gate extra |
|---|---|---|
| GET | `/api/analytics/summary` | PlanGate("analytics") |

---

## Auditoria (JWT + tenant + subscription ativa)

| Método | Rota | Roles |
|---|---|---|
| GET | `/api/audit` | owner, admin |

---

## Inteligência Artificial (JWT + tenant + subscription ativa)

| Método | Rota | Roles |
|---|---|---|
| POST | `/api/ai/suggest-reply` | qualquer |
| POST | `/api/ai/classify-lead` | qualquer |

Body de `/api/ai/classify-lead`:
```json
{ "lead_message": "Olá, tenho interesse no carro" }
```

Body de `/api/ai/suggest-reply`:
```json
{ "context": "lead interessado em carro", "message": "..." }
```

---

## WhatsApp / Evolution (JWT + tenant + subscription ativa)

| Método | Rota | Roles |
|---|---|---|
| GET | `/api/evolution/health` | qualquer |
| GET | `/api/evolution/status` | qualquer |
| GET | `/api/evolution/qr` | qualquer |
| POST | `/api/evolution/connect` | owner, admin |
| DELETE | `/api/evolution/disconnect` | owner, admin |
| POST | `/api/evolution/send` | qualquer |

---

## Códigos de Resposta

| HTTP | Significado |
|---|---|
| 200 | Sucesso |
| 201 | Criado (onboarding/setup) |
| 400 | Bad Request (validação) |
| 401 | Unauthorized (sem token ou token inválido) |
| 402 | Payment Required (subscription inativa/vencida) |
| 403 | Forbidden (role insuficiente ou feature não no plano) |
| 404 | Not Found |
| 429 | Too Many Requests (rate limit) |
| 500 | Internal Server Error |
| 503 | Service Unavailable (banco indisponível — /health) |

---

## Headers Injetados pelo Nginx

| Header | Valor |
|---|---|
| `X-Request-ID` | UUID único por request |
| `X-Cache-Status` | HIT/MISS/BYPASS (apenas /api/public/*) |
| `Strict-Transport-Security` | max-age=31536000; includeSubDomains; preload |
| `X-Frame-Options` | DENY |
| `X-Content-Type-Options` | nosniff |

---

## Teste Rápido de Produção

```bash
# Health check
curl https://api.revendaclick.com.br/health

# Plans (público)
curl https://api.revendaclick.com.br/api/plans

# Auth enforcement (deve retornar 401)
curl https://api.revendaclick.com.br/api/leads

# Com token
curl -H "Authorization: Bearer <token>" \
     https://api.revendaclick.com.br/api/tenants/me
```
