# ARQUITETURA REAL — RevendaClick

> Baseado exclusivamente na leitura dos arquivos existentes.
> Fonte: `backend/internal/server/server.go`, `cmd/api/main.go`, `frontend/lib/proxy.ts`, `frontend/middleware.ts`.

---

## Visão Geral

```
Browser / FlutterFlow
       │
       ▼
  Nginx (VPS)
  ├── api.revendaclick.com.br  →  Go Backend (127.0.0.1:8080)
  └── evolution.revendaclick.com.br  →  Evolution API (127.0.0.1:8081)

  Next.js Frontend (Coolify / standalone)
  ├── Server Components → lib/proxy.ts → Go Backend (INTERNAL_API_URL)
  ├── middleware.ts → Supabase Auth (cookie refresh)
  └── lib/supabaseServer.ts → Supabase PostgreSQL (RLS)
```

---

## Backend — Go (Gin)

### Entrypoint
- **Arquivo:** `backend/cmd/api/main.go`
- **Framework:** `github.com/gin-gonic/gin v1.12.0`
- **Porta:** `cfg.Port` (default `8080`, env `PORT`)
- **Graceful shutdown:** 10s timeout via `context.WithTimeout`
- **Logger:** `go.uber.org/zap` — production JSON ou development console
- **Log shipping:** BetterStack via `betterstack/syncer.go` (opcional, só se `BETTER_STACK_SOURCE_TOKEN` configurado)

### Banco de Dados
- **Driver:** `github.com/jackc/pgx/v5/pgxpool`
- **Arquivo:** `backend/internal/db/db.go`
- **Pool:** MaxConns=10, MinConns=2, MaxConnLifetime=30min, HealthCheckPeriod=30s
- **Modo de query:** `SimpleProtocol` — obrigatório para PgBouncer transaction mode (porta 6543)
- **Timeout de query:** `statement_timeout=10000ms` (10 segundos)
- **Conexão:** configurada via `DATABASE_URL`

### Cadeia de Middleware (ordem de execução)

```
RequestID()          → injeta X-Request-ID único
SecurityHeaders()    → HSTS, X-Frame-Options, X-Content-Type-Options, CSP, etc.
gin.Recovery()       → panic recovery
ZapLogger()          → log estruturado de cada request
observability.Middleware() → conta requests, mede latência (Prometheus)
MaxBodySize(512KB)   → rejeita POST/PUT/PATCH > 512 KB
RateLimit(20rps, burst=60) → token-bucket por IP
cors.New()           → CORS para AllowedOrigins
```

### Módulos e Padrão

Cada módulo segue o padrão:
```
NewHandler(NewService(NewRepository(pool)))
```

| Módulo | Arquivo Handler | Responsabilidade |
|---|---|---|
| tenant | `internal/tenant/handler.go` | Info da loja, atualização |
| vehicles | `internal/vehicles/handler.go` | CRUD veículos + público |
| leads | `internal/leads/handler.go` | CRUD leads + atividades |
| customers | `internal/customers/handler.go` | CRUD clientes |
| users | `internal/users/handler.go` | CRUD usuários + sellers |
| plans | `internal/plans/handler.go` | Planos + usage |
| financial | `internal/financial/handler.go` | Entradas, vendas, comissões |
| onboarding | `internal/onboarding/onboarding.go` | Setup tenant + checklist |
| evolution | `internal/evolution/handler.go` | WhatsApp proxy + webhook |
| analytics | `internal/analytics/handler.go` | Summary com cache TTL |
| audit | `internal/audit/handler.go` | Audit trail (owner/admin) |
| ai | `internal/ai/handler.go` | suggest-reply + classify-lead via OpenRouter |
| billing | `internal/billing/handler.go` | Asaas: subscribe, cancel, invoices, webhook |
| observability | `internal/observability/handler.go` | /metrics Prometheus |

### Grupos de Rotas (segurança em camadas)

| Grupo | Middlewares | Escopo |
|---|---|---|
| público `/api/public/:slug` | `SlugTenantResolver` | Vitrine, veículos, form de lead |
| `/api/plans` | nenhum | Pricing page |
| webhooks | token header validation | Asaas, Evolution |
| `/api/onboarding/setup` | `jwtAuth` + StrictRateLimit | Criação do tenant |
| `free` `/api/...` | `jwtAuth + resolveTenant` | Billing, usage, onboarding checklist |
| `gated` `/api/...` | `jwtAuth + resolveTenant + subGate` | Todo restante (bloqueado se sub inativa) |

---

## Frontend — Next.js

### Comunicação com Backend

**Arquivo:** `frontend/lib/proxy.ts`

```
Server Components / Actions
  └── apiCall(method, path, body)
        ├── getAccessToken() → supabase.auth.getSession()
        ├── fetch(INTERNAL_API_URL + path)  ← rede interna Docker
        └── retorna ApiResult<T> | { error }

Páginas públicas
  └── publicFetch(path)
        └── fetch(BACKEND + path, { next: { revalidate: 60 } })
```

- `INTERNAL_API_URL` → `http://backend:8080` (Docker) — só server-side
- `NEXT_PUBLIC_API_URL` → `https://api.revendaclick.com.br` — fallback e client components

### Middleware Next.js

**Arquivo:** `frontend/middleware.ts`

- Refresca cookies de sessão Supabase em cada request (`createServerClient` com `getAll/setAll`)
- Redireciona para `/login?redirect=...` se rota protegida e sem sessão
- Injeta `x-user-id` e `x-pathname` nos headers de request (lidos pelos Server Components)
- Matcher: todas as rotas exceto `_next/static`, `_next/image`, imagens

### Rotas Protegidas (verificadas no middleware)

```
/dashboard, /leads, /crm, /vehicles, /customers,
/financial, /sales, /analytics, /settings,
/vendors, /billing, /whatsapp, /onboarding
```

### Layout do Dashboard

**Arquivo:** `frontend/app/(dashboard)/layout.tsx`

1. Lê `x-user-id` do header (injetado pelo middleware)
2. Busca tenant via `getTenantForUser(uid)` — Supabase service role
3. Se sem tenant → redirect `/onboarding`
4. Resolve token de acesso Supabase para chamadas ao backend
5. Busca `usage` (GET /api/usage) e `subscription` em paralelo
6. Se `sub.is_blocked` e não está em `/billing` → redirect `/billing?reason=blocked`
7. Renderiza `DashboardShell` + `SubscriptionBanner` + `PlanAlertBanner`

---

## Supabase

### Clientes usados

| Arquivo | Tipo | Chave | Bypassa RLS |
|---|---|---|---|
| `lib/supabaseServer.ts` `createClient()` | Server SSR | `ANON_KEY` | Não |
| `lib/supabaseServer.ts` `createServiceClient()` | Service Role | `SERVICE_ROLE_KEY` | Sim |
| `lib/supabaseClient.ts` `createClient()` | Browser singleton | `ANON_KEY` | Não |

### Supabase Auth → JWT Claims

Após onboarding, o Go backend atualiza `app_metadata` do usuário via Admin API:
```json
{
  "app_metadata": {
    "tenant_id": "<uuid>",
    "user_role": "owner"
  }
}
```
Isso permite que JWTs subsequentes carregem `tenant_id` e `user_role`, usados pelas políticas RLS e pelo middleware Go.

---

## Docker (desenvolvimento)

**Arquivo:** `docker-compose.yml`

| Serviço | Imagem | Porta externa |
|---|---|---|
| backend | build local `./backend` | `8080:8080` |
| evolution | `atendai/evolution-api:latest` | `8081:8080` |

- Frontend roda fora do Docker em dev (Next.js dev server)
- Evolution aponta webhook para `http://backend:8080/api/webhooks/evolution`

## Docker (produção)

**Arquivo:** `docker-compose.prod.yml`

| Serviço | Imagem | Porta |
|---|---|---|
| backend | `BACKEND_IMAGE:IMAGE_TAG` GHCR | `127.0.0.1:8080:8080` |
| evolution | `atendai/evolution-api:latest` | `127.0.0.1:8081:8080` |
| backup | `alpine:3.20` | sem porta |

- Portas bind a `127.0.0.1` — Nginx faz proxy HTTPS externamente
- Backup: roda diariamente às 03:00 UTC via `pg_dump` + opcional S3

---

## Dependências Externas

| Serviço | Uso | Env var |
|---|---|---|
| Supabase | Auth, PostgreSQL, Storage, RLS | `SUPABASE_URL`, `SUPABASE_JWT_SECRET`, `SUPABASE_SERVICE_ROLE_KEY` |
| Evolution API | WhatsApp (instâncias, QR, envio) | `EVOLUTION_API_KEY`, `EVOLUTION_API_URL` |
| OpenRouter | AI (suggest-reply, classify-lead) | `OPENROUTER_API_KEY`, `OPENROUTER_MODEL` |
| Asaas | Billing (subscribe, cancel, webhooks) | `ASAAS_API_KEY`, `ASAAS_ENV`, `ASAAS_WEBHOOK_TOKEN` |
| BetterStack | Log shipping (opcional) | `BETTER_STACK_SOURCE_TOKEN` |
| FIPE | Tabela FIPE (consulta externa) | Sem auth, route handler `/api/fipe/*` |
| GHCR | Registry Docker das imagens | `GITHUB_TOKEN` (CI) |

---

## Riscos Críticos ao Alterar Arquitetura

| Mudança | Risco |
|---|---|
| Trocar `SimpleProtocol` no pgxpool | Quebra PgBouncer transaction mode (porta 6543) — queries falham |
| Remover `set/remove` do cookie adapter Supabase | Sessões não persistem — usuários não conseguem logar |
| Alterar `app_metadata` do JWT | RLS do Supabase Storage para de funcionar |
| Mudar `INTERNAL_API_URL` | Server Components perdem acesso ao backend Go |
| Desativar RLS em qualquer tabela | Vazamento de dados cross-tenant |
| Trocar porta do Evolution de 5432 para 6543 | Prisma usa advisory locks — incompatível com transaction mode |
