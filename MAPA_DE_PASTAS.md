# MAPA DE PASTAS — RevendaClick

> Gerado por auditoria real dos arquivos em 2026-05-22.
> Fonte de verdade: `find` + leitura direta dos arquivos.

---

## Raiz `/`

| Arquivo | Função |
|---|---|
| `docker-compose.yml` | Compose de desenvolvimento (backend + evolution, portas expostas) |
| `docker-compose.prod.yml` | Compose de produção com limites de memória + serviço backup |
| `docker-compose.production.yml` | Variante de produção usada pelo CI/CD (ci.yml referencia este) |
| `docker-compose.staging.yml` | Compose de staging |
| `nginx.conf` | Config nginx: proxy reverso para api + evolution, rate limit, gzip, SSL |
| `Makefile` | Atalhos de build/run |
| `vps-setup.sh` | Script de provisionamento inicial do VPS Hostinger |
| `.env.example` | Variáveis de ambiente raiz (Docker Compose) |
| `.env` | Valores reais (não commitado, gitignored) |
| `.env.staging` | Vars de staging (não commitado) |
| `CLAUDE.md` | Instruções de projeto para Claude Code |
| `package.json` | Root package (scripts utilitários) |

---

## `.github/`

```
.github/
└── workflows/
    └── ci.yml          # Pipeline CI/CD completo (test → build → push → deploy)
```

---

## `backend/`

```
backend/
├── cmd/api/main.go                  # Entrypoint: carrega config, db, logger, http.Server
├── Dockerfile                       # Multi-stage build Go → alpine
├── go.mod                           # Go 1.25 | gin, pgx/v5, zap, jwt/v5, godotenv
├── go.sum
├── Makefile
├── .env.example                     # Vars do backend
├── .env                             # Valores reais (gitignored)
└── internal/
    ├── ai/
    │   ├── handler.go               # POST /ai/suggest-reply, /ai/classify-lead
    │   └── service.go               # Chama OpenRouter API
    ├── analytics/
    │   ├── cache.go                 # Cache in-memory TTL para analytics
    │   ├── handler.go               # GET /analytics/summary
    │   ├── model.go
    │   ├── repository.go
    │   └── service.go
    ├── audit/
    │   ├── handler.go               # GET /audit (owner/admin only)
    │   ├── model.go
    │   └── repository.go
    ├── betterstack/
    │   └── syncer.go                # Zapcore writer que envia logs para BetterStack HTTP
    ├── billing/
    │   ├── asaas.go                 # Cliente HTTP Asaas (subscribe, cancel, invoices)
    │   ├── billing_test.go
    │   ├── handler.go               # GET/POST/DELETE /billing/*, POST /webhooks/asaas
    │   ├── model.go
    │   ├── repository.go
    │   └── service.go
    ├── config/
    │   └── config.go                # Carrega env vars; busca JWKS EC key no Supabase
    ├── customers/
    │   ├── handler.go               # CRUD /customers
    │   ├── model.go
    │   ├── repository.go
    │   └── service.go
    ├── db/
    │   └── db.go                    # pgxpool: SimpleProtocol (PgBouncer), max=10, timeout=10s
    ├── evolution/
    │   ├── handler.go               # GET/POST /evolution/*, POST /webhooks/evolution
    │   ├── model.go
    │   └── service.go               # Proxy para Evolution API + sync leads via WhatsApp
    ├── financial/
    │   ├── handler.go               # CRUD /financial/entries, /sales, /commissions
    │   ├── model.go
    │   ├── repository.go
    │   └── service.go
    ├── leads/
    │   ├── handler.go               # CRUD /leads + atividades
    │   ├── model.go
    │   ├── model_test.go
    │   ├── repository.go
    │   └── service.go
    ├── middleware/
    │   ├── auth.go                  # JWTAuth (HS256 + ES256), RequireRole
    │   ├── logger.go                # ZapLogger middleware
    │   ├── plan_gate.go             # PlanGate: verifica feature no plan.features JSONB
    │   ├── ratelimit.go             # Token-bucket rate limiting por IP
    │   ├── request_id.go            # Injeta X-Request-ID em cada request
    │   ├── security.go              # Security headers + MaxBodySize
    │   ├── subscription.go          # SubscriptionGate: bloqueia past_due/canceled
    │   └── tenant.go                # TenantResolver + SlugTenantResolver
    ├── observability/
    │   ├── collector.go             # Goroutine: coleta tenant/subscription count a cada 60s
    │   ├── handler.go               # GET /metrics (Prometheus text format)
    │   ├── metrics.go               # Counters/Gauges/Histograms registrados
    │   ├── metrics_test.go
    │   ├── middleware.go            # HTTP middleware: registra latência/status
    │   └── vars.go                  # Variáveis globais de métricas
    ├── onboarding/
    │   ├── onboarding.go            # POST /onboarding/setup + GET/PUT /onboarding
    │   └── validate_test.go
    ├── plans/
    │   ├── handler.go               # GET /api/plans, GET /api/usage
    │   ├── model.go
    │   ├── repository.go
    │   └── service.go
    ├── response/
    │   └── response.go              # Helpers: JSON, BadRequest, NotFound, InternalError
    ├── server/
    │   └── server.go                # Registra todos os módulos e rotas (Gin router)
    ├── tenant/
    │   ├── handler.go               # GET /tenants/me, PUT /tenants/me, GET /api/public/:slug
    │   ├── model.go
    │   ├── repository.go
    │   └── service.go
    ├── users/
    │   ├── handler.go               # CRUD /users + GET /users/sellers
    │   ├── model.go
    │   ├── repository.go
    │   └── service.go
    └── vehicles/
        ├── handler.go               # CRUD /vehicles + public list/get
        ├── model.go
        ├── repository.go
        └── service.go
```

---

## `frontend/`

```
frontend/
├── app/
│   ├── layout.tsx                   # Root layout (html, body, globals.css)
│   ├── page.tsx                     # Página home "/"
│   ├── error.tsx                    # Error boundary global
│   ├── not-found.tsx
│   ├── globals.css
│   ├── robots.ts                    # robots.txt dinâmico
│   ├── sitemap.ts                   # sitemap.xml dinâmico
│   │
│   ├── (dashboard)/                 # Grupo de rotas protegidas
│   │   ├── layout.tsx               # Auth gate + tenant resolution + sub check
│   │   ├── error.tsx
│   │   ├── loading.tsx
│   │   ├── dashboard/page.tsx
│   │   ├── leads/page.tsx + actions.ts + loading.tsx
│   │   ├── crm/page.tsx
│   │   ├── vehicles/page.tsx + actions.ts + loading.tsx
│   │   ├── customers/page.tsx + actions.ts + loading.tsx
│   │   ├── financial/page.tsx + actions.ts + loading.tsx
│   │   │   └── commissions/page.tsx + _components/CommissionsClient.tsx
│   │   ├── sales/page.tsx + actions.ts + loading.tsx
│   │   ├── analytics/page.tsx + loading.tsx
│   │   ├── billing/page.tsx + loading.tsx + history/page.tsx
│   │   │   ├── _components/CancelButton.tsx
│   │   │   └── plans/page.tsx + _components/PlanCard.tsx
│   │   ├── settings/page.tsx + actions.ts + loading.tsx
│   │   │   └── _components/SettingsTabs.tsx
│   │   ├── vendors/page.tsx + actions.ts
│   │   │   └── _components/VendorsClient.tsx
│   │   └── whatsapp/page.tsx
│   │
│   ├── (public)/                    # Páginas públicas SEO (sem auth)
│   │   └── [slug]/
│   │       ├── layout.tsx           # Resolve tenant por slug
│   │       ├── page.tsx             # Vitrine da revenda
│   │       └── [vehicleSlug]/page.tsx  # Página do veículo (schema.org + OG)
│   │
│   ├── api/                         # Route handlers Next.js
│   │   ├── billing/
│   │   │   ├── cancel-action/route.ts
│   │   │   └── subscribe-action/route.ts
│   │   ├── evolution/
│   │   │   ├── _proxy.ts            # Proxy helper para Evolution API
│   │   │   ├── connect/route.ts
│   │   │   ├── disconnect/route.ts
│   │   │   ├── health/route.ts
│   │   │   ├── qr/route.ts
│   │   │   ├── send/route.ts
│   │   │   └── status/route.ts
│   │   ├── financial/commissions/[id]/pay/route.ts
│   │   ├── fipe/
│   │   │   ├── brands/route.ts
│   │   │   ├── models/route.ts
│   │   │   └── versions/route.ts
│   │   ├── health/route.ts          # Frontend health check
│   │   ├── log/error/route.ts       # Client-side error logging
│   │   └── upload/vehicle-photo/route.ts  # Upload foto via Supabase Storage
│   │
│   ├── auth/callback/route.ts       # Troca code → session (email confirm / recovery)
│   ├── login/page.tsx
│   ├── register/page.tsx
│   ├── onboarding/page.tsx + actions.ts
│   ├── forgot-password/page.tsx
│   ├── reset-password/page.tsx
│   ├── privacy/page.tsx
│   └── terms/page.tsx
│
├── components/
│   ├── Analytics.tsx                # GA4 script wrapper
│   ├── crm/
│   │   ├── ActivityTimeline.tsx
│   │   ├── LeadCard.tsx
│   │   ├── LeadDetail.tsx
│   │   ├── LeadKanban.tsx
│   │   ├── LeadList.tsx
│   │   ├── LeadModal.tsx
│   │   └── StatusBadge.tsx
│   ├── customers/
│   │   ├── CustomerModal.tsx
│   │   └── CustomersView.tsx
│   ├── financial/
│   │   ├── ExportCSVButton.tsx
│   │   └── NewEntryModal.tsx
│   ├── layout/
│   │   └── DashboardShell.tsx       # Sidebar + nav principal
│   ├── sales/
│   │   └── SalesView.tsx
│   ├── ui/
│   │   ├── FeatureGate.tsx          # Bloqueia UI por feature flag
│   │   ├── PlanAlertBanner.tsx      # Aviso de limite de uso (80%/100%)
│   │   ├── SubscriptionBanner.tsx   # Aviso past_due / trialing
│   │   ├── Toast.tsx
│   │   └── UsageBar.tsx
│   ├── vehicles/
│   │   ├── FipeSelects.tsx
│   │   ├── ShareButton.tsx
│   │   ├── VehicleForm.tsx
│   │   └── VehicleGrid.tsx
│   └── whatsapp/
│       └── WhatsAppManager.tsx
│
├── lib/
│   ├── billing.ts                   # getSubscription(), formatStatus()
│   ├── billing-utils.ts             # Helpers de formatação de planos
│   ├── crm.ts                       # Funções CRM / lead
│   ├── customers.ts                 # Funções de clientes
│   ├── database.types.ts            # Tipos gerados do Supabase
│   ├── error-tracking.ts            # Envio de erros para /api/log/error
│   ├── logger.ts                    # Logger client-side
│   ├── proxy.ts                     # apiCall() + publicFetch() → backend Go
│   ├── supabaseClient.ts            # createClient() singleton browser
│   ├── supabaseServer.ts            # createClient() + createServiceClient() server
│   ├── tenant.ts                    # getTenantForUser(), getUsageFromAPI(), PlanUsage types
│   ├── users.ts                     # Funções de usuários/vendors
│   └── vehicles.ts                  # Funções de veículos
│
├── middleware.ts                    # Next.js middleware: auth guard + header injection
├── instrumentation.ts               # OpenTelemetry / BetterStack init
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── next.config.js (implícito)
```

---

## `database/`

```
database/
├── schema.sql                       # Schema completo (base para migration 001)
├── seed.sql                         # Seeds iniciais
└── migrations/
    ├── 001_initial_schema.sql       # Inclui schema.sql via \i
    ├── 002_customers.sql            # Tabela customers
    ├── 003_financial.sql            # Tabela financial_entries, sales, commissions
    ├── 004_billing.sql              # Campos Asaas + trigger grace_until
    ├── 005_billing_extended.sql     # Extensões de billing
    ├── 006_followups_audit.sql      # Tabela follow-ups + audit_log
    ├── 007_storage.sql              # Supabase Storage buckets/policies
    ├── 008_users_vendors.sql        # vendor_invitations + view plan_usage
    ├── 009_performance_indexes.sql  # Índices adicionais de performance
    └── 010_security_hardening.sql   # Políticas RLS endurecidas
```

---

## `infra/`

```
infra/
├── .env.prod.example
└── scripts/
    ├── backup.sh                    # pg_dump + opcional S3
    ├── deploy.sh                    # Deploy manual VPS
    └── vps-setup.sh                 # Provisiona VPS: Docker, Nginx, Certbot
```

---

## `scripts/`

```
scripts/
├── smoke-test.sh                    # 10 seções de testes: TLS, health, headers, auth, webhooks, cache
├── deploy-production.sh             # Deploy produção manual
├── deploy-ssl.sh                    # Certbot SSL provisioning
├── staging-deploy.sh                # Deploy staging
├── create-staging-admin.sh          # Cria admin no staging
├── validate-billing.sh              # Valida endpoints de billing
├── validate-production.sh           # Checklist de validação pós-deploy
├── validate-ssl.sh                  # Valida certificados SSL
└── resume-step7.sh                  # Script de continuação de deploy passo a passo
```

---

## `assets/`

```
assets/branding/
├── logo.png / logo-primary.png / logo-dark.png
├── brand-guideline.docx
├── prompt-final.docx
└── ux-reference.png
```

---

## `supabase/`

```
supabase/.temp/
├── cli-latest                       # Versão do CLI Supabase linkado
└── linked-project.json              # ID do projeto Supabase linkado
```
