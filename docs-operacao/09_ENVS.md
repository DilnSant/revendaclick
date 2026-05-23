# 09 — VARIÁVEIS DE AMBIENTE

> Extraído de: `.env.example`, `backend/.env.example`, `frontend/.env.local.example`, `infra/.env.prod.example`, `backend/internal/config/config.go`.

---

## Backend (`/backend/.env`)

### OBRIGATÓRIAS (boot falha se ausentes)

| Variável | Exemplo | Onde obter |
|---|---|---|
| `DATABASE_URL` | `postgresql://postgres.REF:PASS@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?sslmode=require` | Supabase → Settings → Database → **Transaction pooler** porta 6543 |
| `SUPABASE_URL` | `https://REF.supabase.co` | Supabase → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` | Supabase → Settings → API |

### OPCIONAIS com default

| Variável | Default | Descrição |
|---|---|---|
| `PORT` | `8080` | Porta HTTP |
| `ENV` | `development` | `production` ativa release mode |
| `SUPABASE_JWT_SECRET` | `""` | Se vazio, usa ES256 via JWKS automático |
| `ALLOWED_ORIGINS` | `http://localhost:3000` | CORS — separar por vírgula em prod |
| `EVOLUTION_API_URL` | — | URL da Evolution (aceita `EVOLUTION_BASE_URL` também) |
| `EVOLUTION_API_KEY` | `""` | Se vazio, WhatsApp desabilitado |
| `OPENROUTER_API_KEY` | `""` | Se vazio, IA desabilitada |
| `OPENROUTER_MODEL` | `openai/gpt-4o-mini` | Modelo de IA |
| `ASAAS_API_KEY` | `""` | Se vazio, billing retorna 401 |
| `ASAAS_ENV` | `sandbox` | Use `production` em prod |
| `ASAAS_WEBHOOK_TOKEN` | `""` | Token de validação dos webhooks Asaas |
| `METRICS_TOKEN` | `""` | Bearer para `/metrics` |
| `BETTER_STACK_SOURCE_TOKEN` | `""` | Se preenchido, envia logs para BetterStack |

---

## Frontend (`/frontend/.env.local`)

### PÚBLICAS (expostas ao browser — seguro expor)

| Variável | Exemplo |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://REF.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` |
| `NEXT_PUBLIC_API_URL` | `https://api.revendaclick.com.br` |
| `NEXT_PUBLIC_APP_URL` | `https://app.revendaclick.com.br` |
| `NEXT_PUBLIC_GA_ID` | `G-XXXXXXXXXX` (opcional) |

### SECRETAS (server-only — NUNCA expor ao browser)

| Variável | Descrição |
|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | Bypassa RLS — usado só em Server Actions/Route Handlers |
| `INTERNAL_API_URL` | URL interna do backend (`http://backend:8080` no Docker) — tem prioridade sobre NEXT_PUBLIC_API_URL |
| `BETTER_STACK_SOURCE_TOKEN` | Log shipping server-side |
| `BETTER_STACK_INGESTING_URL` | URL de ingestão BetterStack |

---

## Docker Compose Raiz (`.env`)

Variáveis compartilhadas entre serviços:

| Variável | Uso |
|---|---|
| `DATABASE_URL` | Backend Go — porta **6543** |
| `EVOLUTION_DATABASE_URL` | Evolution API — porta **5432** |
| `NEXT_PUBLIC_SUPABASE_URL` | Repassado ao frontend |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Repassado ao frontend |
| `SUPABASE_SERVICE_ROLE_KEY` | Repassado ao backend |
| `NEXT_PUBLIC_API_URL` | URL pública do backend |
| `NEXT_PUBLIC_APP_URL` | URL do app |
| `BACKEND_IMAGE` | `ghcr.io/dilnsant/revendaclick-backend` |
| `FRONTEND_IMAGE` | `ghcr.io/dilnsant/revendaclick-frontend` |
| `IMAGE_TAG` | `latest` (CI substitui pelo SHA do commit) |
| `EVOLUTION_API_KEY` | Compartilhado: backend + evolution container |
| `EVOLUTION_SERVER_URL` | URL pública da Evolution |
| `ASAAS_API_KEY` | Billing |
| `ASAAS_ENV` | `sandbox` ou `production` |
| `ASAAS_WEBHOOK_TOKEN` | Validação de webhooks |
| `METRICS_TOKEN` | Protege `/metrics` |
| `BACKUP_S3_BUCKET` | Bucket S3 (opcional) |
| `AWS_ACCESS_KEY_ID` | Credenciais S3 |
| `AWS_SECRET_ACCESS_KEY` | Credenciais S3 |
| `AWS_DEFAULT_REGION` | Default: `sa-east-1` |

---

## Onde o `.env` de Produção Fica

```
VPS Hostinger:
/opt/revendaclick/.env   ← arquivo real de produção (NUNCA commitar)
```

O CI/CD usa `--env-file .env` ao rodar `docker compose`.

---

## Diferença Crítica: Duas DATABASE_URLs

```
DATABASE_URL          → porta 6543 (PgBouncer transaction mode)
                         Usado pelo: Backend Go (pgx com SimpleProtocol)

EVOLUTION_DATABASE_URL → porta 5432 (session pooler — sem PgBouncer)
                         Usado pelo: Evolution API (Prisma — usa advisory locks)
```

**NUNCA trocar as portas** — Prisma com porta 6543 falha com advisory lock errors.

---

## Variáveis por Ambiente

| Variável | Desenvolvimento | Produção |
|---|---|---|
| `ENV` | `development` | `production` |
| `ASAAS_ENV` | `sandbox` | `production` |
| `ALLOWED_ORIGINS` | `http://localhost:3000` | `https://app.revendaclick.com.br,...` |
| `EVOLUTION_API_URL` | `http://localhost:8081` | `http://evolution:8080` (Docker interno) |
| `INTERNAL_API_URL` | `http://localhost:8080` | `http://backend:8080` (Docker interno) |

---

## Como Adicionar uma Nova Variável

1. Definir a variável com default em `backend/internal/config/config.go` (ou como `NEXT_PUBLIC_` no frontend)
2. Adicionar ao `.env.example` com comentário explicativo
3. Documentar em `09_ENVS.md` (este arquivo)
4. Adicionar ao `.env` do VPS antes de fazer deploy
5. Se for secret do CI, adicionar em GitHub → Settings → Secrets → Actions
