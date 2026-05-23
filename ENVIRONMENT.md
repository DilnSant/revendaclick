# ENVIRONMENT — RevendaClick

> Extraído de: `.env.example` (raiz), `backend/.env.example`, `frontend/.env.local.example`, `infra/.env.prod.example`.
> Variáveis marcadas como REQUIRED travam o boot se ausentes.

---

## Backend (`backend/.env`)

### Obrigatórias (panic no boot se ausentes)

| Variável | Descrição | Onde obter |
|---|---|---|
| `DATABASE_URL` | PgBouncer transaction mode (porta **6543**) | Supabase → Settings → Database → Connection Pooling |
| `SUPABASE_URL` | URL do projeto Supabase | Supabase → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave service role (bypassa RLS) | Supabase → Settings → API |

### Opcionais com default

| Variável | Default | Descrição |
|---|---|---|
| `PORT` | `8080` | Porta HTTP do servidor |
| `ENV` | `development` | `production` ativa gin.ReleaseMode e logger JSON |
| `SUPABASE_JWT_SECRET` | `""` | JWT secret (HS256). Se ausente, usa JWKS (ES256) via fetch automático |
| `ALLOWED_ORIGINS` | `http://localhost:3000,http://localhost` | CORS origins separadas por vírgula |
| `EVOLUTION_API_URL` | — | URL da Evolution API. Aceita também `EVOLUTION_BASE_URL` (legado) |
| `EVOLUTION_API_KEY` | `""` | API key da Evolution. Se ausente, WhatsApp desabilitado (warning no boot) |
| `OPENROUTER_API_KEY` | `""` | Se ausente, features de AI desabilitadas (warning no boot) |
| `OPENROUTER_MODEL` | `openai/gpt-4o-mini` | Modelo usado pelo OpenRouter |
| `ASAAS_API_KEY` | `""` | Se ausente, billing retorna 401 (warning no boot) |
| `ASAAS_ENV` | `sandbox` | `production` para produção |
| `ASAAS_WEBHOOK_TOKEN` | `""` | Token para validar webhooks do Asaas |
| `METRICS_TOKEN` | `""` | Bearer token para acessar `/metrics`. Se vazio, sem auth |
| `BETTER_STACK_SOURCE_TOKEN` | `""` | Se preenchido, logs INFO+ são enviados para BetterStack |

### Produção (`docker-compose.prod.yml`) — adicionais

| Variável | Valor fixo em prod |
|---|---|
| `ENV` | `production` |
| `ALLOWED_ORIGINS` | `https://app.revendaclick.com.br,https://revendaclick.com.br,https://www.revendaclick.com.br` |
| `EVOLUTION_API_URL` | `http://evolution:8080` (rede Docker interna) |
| `ASAAS_ENV` | `production` |

---

## Frontend (`frontend/.env.local`)

### Públicas (expostas ao browser — prefixo `NEXT_PUBLIC_`)

| Variável | Exemplo | Descrição |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://[REF].supabase.co` | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` | Chave anônima (respeita RLS) |
| `NEXT_PUBLIC_API_URL` | `https://api.revendaclick.com.br` | URL pública do backend Go |
| `NEXT_PUBLIC_APP_URL` | `https://app.revendaclick.com.br` | URL do app |
| `NEXT_PUBLIC_GA_ID` | `G-XXXXXXXXXX` | Google Analytics (opcional) |

### Secretas (server-only — NUNCA expor ao browser)

| Variável | Descrição |
|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | Chave service role (bypassa RLS) — usada em `createServiceClient()` |
| `INTERNAL_API_URL` | URL interna do backend (ex: `http://backend:8080` no Docker). Sobrescreve `NEXT_PUBLIC_API_URL` no server |
| `BETTER_STACK_SOURCE_TOKEN` | Token BetterStack para log server-side |
| `BETTER_STACK_INGESTING_URL` | URL de ingestão BetterStack |

---

## Docker Compose Raiz (`.env`)

Estas variáveis são lidas pelo `docker-compose.yml` e passadas para os serviços:

| Variável | Uso |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Repassado ao frontend |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Repassado ao frontend |
| `SUPABASE_SERVICE_ROLE_KEY` | Repassado ao backend |
| `NEXT_PUBLIC_API_URL` | URL pública do backend |
| `NEXT_PUBLIC_APP_URL` | URL do app |
| `BACKEND_IMAGE` | `ghcr.io/dilnsant/revendaclick-backend` |
| `FRONTEND_IMAGE` | `ghcr.io/dilnsant/revendaclick-frontend` |
| `IMAGE_TAG` | `latest` (substituído pelo SHA do commit em CI) |
| `EVOLUTION_API_KEY` | Compartilhado entre backend e evolution container |
| `EVOLUTION_SERVER_URL` | URL pública da Evolution (ex: `https://evolution.revendaclick.com.br`) |
| `EVOLUTION_DATABASE_URL` | PostgreSQL **session pooler porta 5432** (Prisma não suporta transaction mode) |
| `ASAAS_API_KEY` | Billing |
| `ASAAS_ENV` | `sandbox` ou `production` |
| `ASAAS_WEBHOOK_TOKEN` | Validação de webhooks Asaas |
| `METRICS_TOKEN` | Protege `/metrics` |
| `DATABASE_URL` | PgBouncer porta **6543** (backend Go usa transaction mode) |
| `BACKUP_S3_BUCKET` | Bucket S3 para backups (opcional) |
| `AWS_ACCESS_KEY_ID` | Credenciais S3 |
| `AWS_SECRET_ACCESS_KEY` | Credenciais S3 |
| `AWS_DEFAULT_REGION` | Default: `sa-east-1` |
| `NEXT_PUBLIC_GA_ID` | Google Analytics |

---

## CI/CD — GitHub Secrets

Variáveis que devem estar configuradas em **Settings → Secrets → Actions** do repositório:

| Secret | Uso |
|---|---|
| `GITHUB_TOKEN` | Automático pelo GitHub — push para GHCR |

O deploy roda em `self-hosted` runner (VPS Hostinger), portanto o `.env` de produção existe diretamente no VPS em `/opt/revendaclick/.env`.

---

## Diferença Crítica: Dois DATABASE_URL

| Variável | Porta | Modo | Usado por |
|---|---|---|---|
| `DATABASE_URL` | **6543** | Transaction (PgBouncer) | Backend Go (pgx SimpleProtocol) |
| `EVOLUTION_DATABASE_URL` | **5432** | Session (sem PgBouncer) | Evolution API (Prisma, advisory locks) |

**Nunca trocar as portas.** Usar 6543 com Prisma causa erros de advisory lock. Usar 5432 sem SimpleProtocol no pgx pode causar erros em queries parametrizadas com PgBouncer.

---

## Onde Cada Variável É Lida

| Variável | `config.go` | `server.go` | `middleware.ts` | `supabaseServer.ts` | `proxy.ts` |
|---|---|---|---|---|---|
| `DATABASE_URL` | ✓ | — | — | — | — |
| `SUPABASE_URL` | ✓ | ✓ (onboarding) | ✓ | ✓ | — |
| `SUPABASE_JWT_SECRET` | ✓ | — | — | — | — |
| `SUPABASE_SERVICE_ROLE_KEY` | ✓ | ✓ (onboarding) | — | ✓ | — |
| `NEXT_PUBLIC_SUPABASE_URL` | — | — | ✓ | ✓ | — |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | — | — | ✓ | ✓ | — |
| `INTERNAL_API_URL` | — | — | — | — | ✓ (prioridade) |
| `NEXT_PUBLIC_API_URL` | — | — | — | — | ✓ (fallback) |
| `EVOLUTION_API_URL` / `EVOLUTION_BASE_URL` | ✓ | ✓ | — | — | — |
| `OPENROUTER_API_KEY` | ✓ | ✓ | — | — | — |
| `ASAAS_API_KEY` | ✓ | ✓ | — | — | — |
| `ASAAS_WEBHOOK_TOKEN` | ✓ | ✓ | — | — | — |
| `METRICS_TOKEN` | ✓ | ✓ | — | — | — |
| `BETTER_STACK_SOURCE_TOKEN` | ✓ | — | — | — | — |
