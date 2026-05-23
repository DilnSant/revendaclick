# 01 — ARQUITETURA REAL

> Baseado na leitura de: `backend/internal/server/server.go`, `cmd/api/main.go`, `frontend/middleware.ts`, `frontend/lib/proxy.ts`, `docker-compose.prod.yml`, `nginx.conf`.

---

## Diagrama Geral

```
┌─────────────────────────────────────────────────────────────┐
│                         INTERNET                            │
└───────────────────────────┬─────────────────────────────────┘
                            │ HTTPS
                ┌───────────▼───────────┐
                │     VPS Hostinger     │
                │       (Linux)         │
                │                       │
                │  ┌─────────────────┐  │
                │  │  Nginx (host)   │  │
                │  │  SSL Let's Enc. │  │
                │  └────────┬────────┘  │
                │      ┌────┴────┐      │
                │      │        │       │
                │  :8080     :8081      │
                │      │        │       │
                │  ┌───▼───┐ ┌──▼────┐ │
                │  │Backend│ │Evolu- │ │
                │  │  Go   │ │tion   │ │
                │  │(Docker│ │(Docker│ │
                │  └───┬───┘ └──┬────┘ │
                └──────┼────────┼──────┘
                       │        │
          ┌────────────┘        └────────────┐
          │                                  │
┌─────────▼──────────┐            ┌──────────▼─────────┐
│  Supabase Cloud    │            │  WhatsApp (celular) │
│  - PostgreSQL      │            │  via QR Code        │
│  - Auth            │            └────────────────────┘
│  - Storage         │
│  - PgBouncer       │
└────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                      EXTERNAS                               │
│  Asaas (billing)  │  OpenRouter (AI)  │  GHCR (images)     │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│               Frontend Next.js (Coolify)                    │
│  Server Components → INTERNAL_API_URL → Backend Go          │
│  Client Components → NEXT_PUBLIC_API_URL → via Nginx        │
│  Auth → Supabase Auth (cookies)                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Fluxo de uma Request Autenticada

```
Browser
  → GET https://revendaclick.com.br/leads
  → Coolify (Next.js standalone)
    → middleware.ts: verifica cookie Supabase → ok
    → injeta x-user-id no header
    → (dashboard)/layout.tsx: resolve tenant, sub, usage
    → leads/page.tsx: Server Component
      → lib/proxy.ts: apiCall('GET', '/api/leads')
        → GET http://backend:8080/api/leads (INTERNAL_API_URL)
          → Nginx não está neste caminho (rede Docker interna)
          → JWTAuth: valida Bearer token
          → TenantResolver: injeta tenant_id
          → SubscriptionGate: verifica se sub ativa
          → leads/handler.go → leads/service.go → PostgreSQL
          → resposta JSON
      → renderiza HTML no servidor
  → HTML entregue ao browser
```

---

## Comunicação entre Serviços

| De | Para | Protocolo | URL |
|---|---|---|---|
| Browser | Frontend Next.js | HTTPS | `revendaclick.com.br` |
| Browser | Backend (direto, client components) | HTTPS | `api.revendaclick.com.br` via Nginx |
| Frontend Server Component | Backend | HTTP interno Docker | `http://backend:8080` |
| Backend | Supabase Auth Admin | HTTPS | `<SUPABASE_URL>/auth/v1/admin/*` |
| Backend | Supabase DB | PgBouncer TCP | porta 6543 |
| Backend | Evolution API | HTTP Docker interno | `http://evolution:8080` |
| Backend | Asaas | HTTPS | `api.asaas.com` |
| Backend | OpenRouter | HTTPS | `openrouter.ai` |
| Evolution API | Backend (webhook) | HTTP Docker interno | `http://backend:8080/api/webhooks/evolution` |
| Asaas | Backend (webhook) | HTTPS | `api.revendaclick.com.br/api/webhooks/asaas` |
| GitHub Actions | VPS (deploy) | SSH | self-hosted runner |
| VPS | GHCR | HTTPS | `ghcr.io` (pull de imagens) |

---

## Cadeia de Middleware do Backend (ordem de execução)

```
Request chega
    ↓
1. RequestID()          → gera X-Request-ID único
2. SecurityHeaders()    → HSTS, X-Frame-Options, CSP, nosniff
3. gin.Recovery()       → captura panics sem derrubar servidor
4. ZapLogger()          → log estruturado JSON
5. observability.Middleware() → conta request, mede latência ms
6. MaxBodySize(512KB)   → rejeita body > 512KB em POST/PUT/PATCH
7. RateLimit(20rps, burst=60) → token-bucket por IP
8. cors.New()           → CORS para AllowedOrigins
    ↓
[Rota específica]:
9. JWTAuth()            → valida Bearer token (ES256 ou HS256)
10. TenantResolver()    → resolve tenant_id do JWT ou banco
11. SubscriptionGate()  → verifica se assinatura ativa
12. RequireRole()       → verifica cargo (owner/admin/seller)
13. PlanGate()          → verifica feature no plano
    ↓
Handler do módulo
```

---

## Tecnologias e Versões

| Tecnologia | Versão | Uso |
|---|---|---|
| Go | 1.25.0 | Backend |
| Gin | v1.12.0 | Framework HTTP |
| pgx/v5 | v5.9.2 | Driver PostgreSQL |
| jwt/v5 | v5.3.1 | Validação JWT |
| zap | v1.28.0 | Logger |
| Next.js | 16 | Frontend |
| @supabase/ssr | — | Auth SSR |
| TailwindCSS | — | Estilos |
| PostgreSQL | 15+ | Banco (Supabase) |
| Docker | CE | Containers |
| Docker Compose | V2 | Orquestração |
| Nginx | — | Proxy reverso |
| Evolution API | latest | WhatsApp |

---

## Multi-Tenant

Cada cliente (revenda) é um **tenant** com:
- `tenant_id` (UUID) em todas as tabelas de negócio
- RLS (Row Level Security) no PostgreSQL garantindo isolamento
- JWT carregando `tenant_id` no `app_metadata`
- Backend validando `tenant_id` em toda query

Não existe risco de um cliente ver dados de outro se RLS estiver ativo.

Veja detalhes em `07_MULTI_TENANT.md`.

---

## Domínios em Produção

| Domínio | Destino | Porta |
|---|---|---|
| `revendaclick.com.br` | Frontend Next.js (Coolify) | 443 → Coolify |
| `app.revendaclick.com.br` | Frontend Next.js (Coolify) | 443 → Coolify |
| `api.revendaclick.com.br` | Backend Go (Docker) | 443 → 127.0.0.1:8080 |
| `evolution.revendaclick.com.br` | Evolution API (Docker) | 443 → 127.0.0.1:8081 |
| `revendaclick.com.br/:slug` | Vitrine pública da revenda | → Next.js → Backend /api/public/:slug |
