# ROTAS REAIS — RevendaClick

> Extraído diretamente de `backend/internal/server/server.go` e dos arquivos `app/**/route.ts` e `app/**/page.tsx`.
> Nenhuma rota inferida — apenas o que está no código.

---

## Backend — Go API (porta 8080)

### Sem Autenticação (Públicas)

| Método | Rota | Handler | Arquivo |
|---|---|---|---|
| GET | `/health` | health check DB ping | `server/server.go` |
| GET | `/api/v1/health` | health check simples | `server/server.go` |
| GET | `/metrics` | Prometheus text format (requer `METRICS_TOKEN`) | `observability/handler.go` |
| GET | `/api/plans` | Lista todos os planos | `plans/handler.go` |
| GET | `/api/public/:slug/` | Dados públicos da loja | `tenant/handler.go` |
| GET | `/api/public/:slug/vehicles` | Veículos disponíveis da loja | `vehicles/handler.go` |
| GET | `/api/public/:slug/vehicles/:vehicleSlug` | Veículo específico | `vehicles/handler.go` |
| POST | `/api/public/:slug/leads` | Cria lead (form público) | `leads/handler.go` |

### Webhooks (token validation, sem JWT)

| Método | Rota | Validação | Arquivo |
|---|---|---|---|
| POST | `/api/webhooks/evolution` | Header `EVOLUTION_API_KEY` | `evolution/handler.go` |
| POST | `/api/webhooks/asaas` | Header `asaas-access-token` == `ASAAS_WEBHOOK_TOKEN` | `billing/handler.go` |

### Onboarding (JWT, sem tenant)

| Método | Rota | Middlewares | Arquivo |
|---|---|---|---|
| POST | `/api/onboarding/setup` | `jwtAuth + StrictRateLimit` | `onboarding/onboarding.go` |

### Rotas Livres (JWT + tenant, sem gate de subscription)

| Método | Rota | Roles | Arquivo |
|---|---|---|---|
| GET | `/api/tenants/me` | qualquer | `tenant/handler.go` |
| PUT | `/api/tenants/me` | owner, admin | `tenant/handler.go` |
| GET | `/api/usage` | qualquer | `plans/handler.go` |
| GET | `/api/onboarding` | qualquer | `onboarding/onboarding.go` |
| PUT | `/api/onboarding` | qualquer | `onboarding/onboarding.go` |
| GET | `/api/billing/subscription` | qualquer | `billing/handler.go` |
| POST | `/api/billing/subscribe` | owner, admin + StrictRateLimit | `billing/handler.go` |
| DELETE | `/api/billing/subscription` | owner, admin | `billing/handler.go` |
| POST | `/api/billing/reactivate` | owner, admin + StrictRateLimit | `billing/handler.go` |
| GET | `/api/billing/invoices` | qualquer | `billing/handler.go` |

### Rotas Gated (JWT + tenant + SubscriptionGate)

> Bloqueadas quando `status = canceled | paused | past_due` além da grace period.

#### Veículos

| Método | Rota | Roles |
|---|---|---|
| GET | `/api/vehicles` | qualquer |
| POST | `/api/vehicles` | qualquer |
| GET | `/api/vehicles/:id` | qualquer |
| PUT | `/api/vehicles/:id` | qualquer |
| DELETE | `/api/vehicles/:id` | owner, admin |

#### Leads

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

#### Usuários

| Método | Rota | Roles |
|---|---|---|
| GET | `/api/users/sellers` | qualquer |
| GET | `/api/users` | owner, admin |
| POST | `/api/users` | owner, admin |
| GET | `/api/users/:id` | qualquer |
| PUT | `/api/users/:id` | qualquer |
| DELETE | `/api/users/:id` | owner, admin |

#### Clientes

| Método | Rota | Roles |
|---|---|---|
| GET | `/api/customers` | qualquer |
| POST | `/api/customers` | qualquer |
| GET | `/api/customers/:id` | qualquer |
| PUT | `/api/customers/:id` | qualquer |
| DELETE | `/api/customers/:id` | owner, admin |

#### Financeiro

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

#### Analytics

| Método | Rota | Gate adicional |
|---|---|---|
| GET | `/api/analytics/summary` | `PlanGate("analytics")` — Pro+/Premium/Enterprise |

#### Outros

| Método | Rota | Roles |
|---|---|---|
| GET | `/api/audit` | owner, admin |
| POST | `/api/ai/suggest-reply` | qualquer |
| POST | `/api/ai/classify-lead` | qualquer |
| GET | `/api/evolution/health` | qualquer |
| GET | `/api/evolution/status` | qualquer |
| GET | `/api/evolution/qr` | qualquer |
| POST | `/api/evolution/connect` | owner, admin |
| DELETE | `/api/evolution/disconnect` | owner, admin |
| POST | `/api/evolution/send` | qualquer |

---

## Frontend — Next.js App Router

### Rotas Públicas (sem autenticação)

| Rota | Arquivo | Função |
|---|---|---|
| `/` | `app/page.tsx` | Home / landing |
| `/login` | `app/login/page.tsx` | Login Supabase |
| `/register` | `app/register/page.tsx` | Registro de conta |
| `/forgot-password` | `app/forgot-password/page.tsx` | Recuperação de senha |
| `/reset-password` | `app/reset-password/page.tsx` | Reset via token |
| `/privacy` | `app/privacy/page.tsx` | Política de privacidade |
| `/terms` | `app/terms/page.tsx` | Termos de uso |
| `/auth/callback` | `app/auth/callback/route.ts` | Troca code PKCE → session |
| `/:slug` | `app/(public)/[slug]/page.tsx` | Vitrine pública da revenda |
| `/:slug/:vehicleSlug` | `app/(public)/[slug]/[vehicleSlug]/page.tsx` | Página do veículo (SEO) |

### Rotas Protegidas (dashboard — requer autenticação)

| Rota | Arquivo | Função |
|---|---|---|
| `/dashboard` | `(dashboard)/dashboard/page.tsx` | Dashboard principal |
| `/leads` | `(dashboard)/leads/page.tsx` | Lista de leads |
| `/crm` | `(dashboard)/crm/page.tsx` | CRM / Kanban |
| `/vehicles` | `(dashboard)/vehicles/page.tsx` | Gestão de veículos |
| `/customers` | `(dashboard)/customers/page.tsx` | Gestão de clientes |
| `/financial` | `(dashboard)/financial/page.tsx` | Financeiro |
| `/financial/commissions` | `.../commissions/page.tsx` | Comissões |
| `/sales` | `(dashboard)/sales/page.tsx` | Vendas |
| `/analytics` | `(dashboard)/analytics/page.tsx` | Analytics (plano Pro+) |
| `/billing` | `(dashboard)/billing/page.tsx` | Assinatura atual |
| `/billing/history` | `.../history/page.tsx` | Histórico de faturas |
| `/billing/plans` | `.../plans/page.tsx` | Upgrade de plano |
| `/settings` | `(dashboard)/settings/page.tsx` | Configurações da loja |
| `/vendors` | `(dashboard)/vendors/page.tsx` | Gestão de equipe |
| `/whatsapp` | `(dashboard)/whatsapp/page.tsx` | Integração WhatsApp |
| `/onboarding` | `app/onboarding/page.tsx` | Setup inicial da loja |

### API Routes (Next.js Route Handlers)

| Método | Rota | Arquivo | Função |
|---|---|---|---|
| POST | `/api/billing/cancel-action` | `billing/cancel-action/route.ts` | Server Action: cancelar subscription |
| POST | `/api/billing/subscribe-action` | `billing/subscribe-action/route.ts` | Server Action: assinar plano |
| GET | `/api/evolution/connect` | `evolution/connect/route.ts` | Proxy → backend /evolution/connect |
| GET | `/api/evolution/disconnect` | `evolution/disconnect/route.ts` | Proxy → backend |
| GET | `/api/evolution/health` | `evolution/health/route.ts` | Proxy → backend |
| GET | `/api/evolution/qr` | `evolution/qr/route.ts` | Proxy → backend |
| POST | `/api/evolution/send` | `evolution/send/route.ts` | Proxy → backend |
| GET | `/api/evolution/status` | `evolution/status/route.ts` | Proxy → backend |
| PATCH | `/api/financial/commissions/[id]/pay` | `.../pay/route.ts` | Paga comissão |
| GET | `/api/fipe/brands` | `fipe/brands/route.ts` | Marcas FIPE |
| GET | `/api/fipe/models` | `fipe/models/route.ts` | Modelos FIPE |
| GET | `/api/fipe/versions` | `fipe/versions/route.ts` | Versões FIPE |
| GET | `/api/health` | `health/route.ts` | Health check frontend |
| POST | `/api/log/error` | `log/error/route.ts` | Recebe erros client-side |
| POST | `/api/upload/vehicle-photo` | `upload/vehicle-photo/route.ts` | Upload para Supabase Storage |
| GET | `/auth/callback` | `auth/callback/route.ts` | Callback PKCE Supabase |

---

## Nginx — Domínios e Proxy

| Domínio | Upstream | Porta |
|---|---|---|
| `api.revendaclick.com.br` | `rc_backend (127.0.0.1:8080)` | 443 HTTPS |
| `evolution.revendaclick.com.br` | `rc_evolution (127.0.0.1:8081)` | 443 HTTPS |

### Rate Limits Nginx

| Zone | Limite | Uso |
|---|---|---|
| `api_limit` | 30 r/s, burst=60 | Todas as rotas API |
| `evo_limit` | 60 r/s, burst=120 | Evolution API |
| `webhook_limit` | 5 r/s, burst=10 | `/api/v1/webhooks/*` |
| `conn_limit` | 100 conn/IP (api) / 200 (evo) | Conexões simultâneas |

### Cache Nginx

- `/api/public/*` → cache 60s para respostas 200, 10s para 404
- Chave: `$uri$is_args$args` (query string diferencia cache)
- Header `X-Cache-Status` exposto para debug
