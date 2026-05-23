# 04 — BACKEND

> Baseado em leitura de: `backend/internal/server/server.go`, `cmd/api/main.go`, `internal/config/config.go`, `internal/db/db.go`, todos os middleware, `go.mod`.

---

## Stack

- **Linguagem:** Go 1.25.0
- **Framework HTTP:** Gin v1.12.0
- **Driver DB:** pgx/v5 v5.9.2
- **JWT:** golang-jwt/jwt v5.3.1
- **Logger:** go.uber.org/zap v1.28.0
- **Config:** joho/godotenv v1.5.1

---

## Estrutura do Entrypoint (`cmd/api/main.go`)

```
main()
  → config.Load()           # carrega env vars + busca JWKS do Supabase
  → zap.NewProduction()     # logger estruturado JSON (dev: colorido)
  → betterstack.NewSyncer() # se BETTER_STACK_SOURCE_TOKEN configurado
  → db.New()                # pool pgx: SimpleProtocol, max=10, timeout=10s
  → server.New()            # gin router com todos os módulos
  → http.Server{:PORT}      # ReadTimeout=15s, WriteTimeout=30s, IdleTimeout=60s
  → graceful shutdown (10s) # aguarda requests em andamento
```

---

## Pool de Banco (`internal/db/db.go`)

```go
cfg.ConnConfig.DefaultQueryExecMode = pgx.QueryExecModeSimpleProtocol
// ↑ CRÍTICO: PgBouncer transaction mode (porta 6543) não suporta protocolo estendido

cfg.ConnConfig.RuntimeParams["statement_timeout"] = "10000"
// ↑ Queries > 10s são abortadas automaticamente

cfg.MaxConns = 10
cfg.MinConns = 2
cfg.MaxConnLifetime = 30 * time.Minute
cfg.MaxConnIdleTime = 5 * time.Minute
cfg.HealthCheckPeriod = 30 * time.Second
```

---

## Configuração (`internal/config/config.go`)

Variáveis obrigatórias (panic no boot se ausentes):
- `DATABASE_URL`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Detecção automática de algoritmo JWT:
```
config.Load()
  → fetchSupabaseECKey(SUPABASE_URL)
    → GET <SUPABASE_URL>/auth/v1/.well-known/jwks.json
    → se EC P-256 encontrado → usa ES256
    → senão → usa HS256 com SUPABASE_JWT_SECRET
```

---

## Módulos (padrão Clean Architecture)

Cada módulo segue:
```
NewHandler(NewService(NewRepository(pool)))
```

### AI (`internal/ai/`)
- `POST /api/ai/suggest-reply` → OpenRouter → resposta sugerida para o vendedor
- `POST /api/ai/classify-lead` → OpenRouter → classificação automática do lead
- Modelo: `OPENROUTER_MODEL` (default: `openai/gpt-4o-mini`)

### Analytics (`internal/analytics/`)
- `GET /api/analytics/summary` → requer feature `analytics` no plano (Pro+)
- Cache in-memory com TTL para evitar queries pesadas repetidas

### Audit (`internal/audit/`)
- `GET /api/audit` → listagem de ações auditáveis (owner/admin apenas)
- Registra quem fez o quê e quando

### Billing (`internal/billing/`)
- Integração completa com Asaas
- `GET /api/billing/subscription` → status atual
- `POST /api/billing/subscribe` → cria customer + subscription na Asaas
- `DELETE /api/billing/subscription` → cancela
- `POST /api/billing/reactivate` → reativa
- `GET /api/billing/invoices` → faturas
- `POST /api/webhooks/asaas` → recebe eventos: `PAYMENT_CONFIRMED`, `PAYMENT_OVERDUE`, etc.

### Evolution (`internal/evolution/`)
- Proxy para Evolution API (WhatsApp)
- `POST /api/webhooks/evolution` → recebe mensagens WhatsApp → cria/atualiza lead
- Status, QR, connect, disconnect, send

### Financial (`internal/financial/`)
- Entradas financeiras (receitas e despesas)
- Vendas: create, complete, cancel
- Comissões de vendedores com mark as paid

### Leads (`internal/leads/`)
- CRUD completo de leads
- Atividades de CRM (status_change, note, call, whatsapp, email)
- Follow-ups: `GET /api/leads/follow-ups`
- Kanban position (campo `kanban_position`)

### Onboarding (`internal/onboarding/`)
- `POST /api/onboarding/setup` — cria tenant + usuário em transação atômica
- Triggers automáticos no DB: subscription trial + onboarding checklist
- Atualiza `app_metadata` do Supabase via Admin API
- `GET/PUT /api/onboarding` — checklist de progresso

### Plans (`internal/plans/`)
- `GET /api/plans` → listagem pública (para pricing page)
- `GET /api/usage` → uso atual do tenant (vehicles, users, leads count + %)

### Tenant (`internal/tenant/`)
- `GET /api/tenants/me` → dados da loja logada
- `PUT /api/tenants/me` → atualiza dados da loja
- `GET /api/public/:slug/` → dados públicos da loja (sem auth)

### Users (`internal/users/`)
- CRUD de usuários do tenant
- `GET /api/users/sellers` → lista vendedores (para atribuir leads)

### Vehicles (`internal/vehicles/`)
- CRUD de veículos
- `GET /api/public/:slug/vehicles` → lista pública (marketplace)
- `GET /api/public/:slug/vehicles/:vehicleSlug` → veículo específico (SEO)

---

## Grupos de Rotas por Segurança

### Rotas públicas (sem auth)
```
GET  /health, /api/v1/health, /metrics
GET  /api/plans
GET  /api/public/:slug/*
POST /api/public/:slug/leads
POST /api/webhooks/evolution, /api/webhooks/asaas
```

### Setup (JWT only)
```
POST /api/onboarding/setup  [jwtAuth + StrictRateLimit]
```

### Free (JWT + tenant — sem subscription gate)
```
GET/PUT  /api/tenants/me
GET      /api/usage
GET/PUT  /api/onboarding
GET      /api/billing/subscription
POST     /api/billing/subscribe      [owner/admin + StrictRateLimit]
DELETE   /api/billing/subscription   [owner/admin]
POST     /api/billing/reactivate     [owner/admin + StrictRateLimit]
GET      /api/billing/invoices
```

### Gated (JWT + tenant + SubscriptionGate)
```
Veículos, Leads, Usuários, Clientes, Financeiro, Vendas,
Comissões, Analytics, Audit, AI, Evolution/WhatsApp
```

---

## Healthcheck

```
GET /health
  → pinga banco com timeout de 3s
  → 200: {"status":"ok","db":"ok"}
  → 503: {"status":"unhealthy","db":"error"}

GET /api/v1/health
  → 200: {"status":"ok","version":"1"}
```

---

## Rate Limiting Backend

Duas camadas:
1. **Nginx:** 30rps por IP, burst=60
2. **Backend Gin:** `RateLimit(20, 60)` — 20rps sustained, 60 burst por IP

Rotas críticas com `StrictRateLimit()` adicional:
- `POST /api/billing/subscribe` — chama Asaas API (cobrado)
- `POST /api/billing/reactivate` — idem
- `POST /api/onboarding/setup` — criação de tenant (operação pesada)

---

## Tratamento de Erros

Arquivo: `internal/response/response.go`

```go
response.JSON(c, 200, data)
response.BadRequest(c, "mensagem")
response.NotFound(c)
response.Unauthorized(c)
response.InternalError(c)
```

Formato padrão de erro:
```json
{
  "error": {
    "code": "subscription_inactive",
    "message": "Assinatura inativa. Renove seu plano para continuar."
  }
}
```

---

## Construir e Rodar Localmente

```bash
cd backend
go mod tidy
go build ./cmd/api/...
go test ./... -race

# ou com Docker:
docker compose up backend
```

---

## Dockerfile Backend

Multi-stage build:
1. `FROM golang:1.25-alpine AS builder` → compila binário
2. `FROM alpine:latest` → imagem final mínima (~15MB)
3. Binary copiado para `/app/server`
4. `CMD ["/app/server"]`
