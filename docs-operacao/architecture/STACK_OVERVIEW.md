# Stack Overview — RevendaClick

> Resumo técnico rápido. Detalhes em `01_ARQUITETURA_REAL.md` e `PRODUCT_ARCHITECTURE.md`.

---

## Stack em Produção

| Camada | Tecnologia | Hosting | Deploy |
|---|---|---|---|
| Frontend | Next.js 16 (App Router, SSR) | Vercel | Auto via push `main` |
| Backend | Go (Gin) — Clean Architecture | VPS Docker | CI/CD GitHub Actions |
| Database | PostgreSQL + Supabase Auth + Storage | Supabase Cloud | Migrations via MCP |
| WhatsApp | Evolution API v2.3.7 | VPS Docker | Manual |
| Cache | Redis 7-alpine | VPS Docker | Auto com compose |
| Billing | Asaas (BR) | Externo | — |
| IA | OpenRouter (`gpt-4o-mini`) | Externo | — |
| CI/CD | GitHub Actions → GHCR → Self-hosted runner | VPS | Push para `main` |

---

## Fluxo de Request

```
Browser
  → Vercel (Next.js SSR)
    → proxy.ts: injeta x-user-id
    → Server Component: apiCall()
      → http://backend:8080 (rede Docker interna)
        → JWTAuth → TenantResolver → SubscriptionGate
        → handler → service → PostgreSQL (Supabase)
```

---

## Containers VPS

| Container | Imagem | Porta interna |
|---|---|---|
| `rc_backend` | `ghcr.io/dilnsant/revendaclick-backend` | 8080 |
| `rc_evolution` | `evoapicloud/evolution-api:v2.3.7` | 8080 |
| `rc_redis` | `redis:7-alpine` | 6379 |
| `rc_backup` | `alpine` | — |

Nginx no host faz reverse proxy (SSL Let's Encrypt).

---

## Padrões Obrigatórios

- RLS em toda tabela de negócio
- `tenant_id` em todo SELECT/INSERT/UPDATE
- JWT claim `tenant_id` propagado do Supabase Auth
- Migrations numeradas sequencialmente (`database/migrations/`)
- `database.types.ts` regenerado após cada migration
- Variáveis com `$` literal no VPS .env usam `$$`

---

## Módulos Backend (`backend/internal/`)

```
auth/          — JWT middleware + tenant resolver
billing/       — Asaas subscription + webhooks + add-ons
customers/     — Módulo Clientes
evolution/     — WhatsApp via Evolution API
financial/     — Financeiro + Comissões
leads/         — Leads + CRM
observability/ — Prometheus metrics
onboarding/    — Setup tenant + user
openrouter/    — IA classify-lead + suggest-reply
sales/         — Vendas
server/        — Rotas HTTP (Gin)
tenants/       — CRUD tenant + upload
users/         — Equipe + convites
vehicles/      — Veículos + vitrine pública
```
