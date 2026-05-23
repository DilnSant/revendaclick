# 03 — FRONTEND

> Baseado em leitura de: `frontend/middleware.ts`, `frontend/lib/proxy.ts`, `frontend/lib/supabaseServer.ts`, `frontend/app/(dashboard)/layout.tsx`, `frontend/lib/tenant.ts`, `frontend/package.json`.

---

## Stack

- **Framework:** Next.js 16 com App Router
- **Runtime:** Node.js (standalone mode — não usa Edge Runtime)
- **CSS:** TailwindCSS
- **Auth:** @supabase/ssr (cookies SSR-safe)
- **Hospedagem:** Coolify (no VPS Hostinger)

---

## Grupos de Rotas (Route Groups)

### `app/(dashboard)/` — Rotas protegidas

Requer usuário autenticado + tenant criado.

Layout: `app/(dashboard)/layout.tsx`

O que o layout faz:
1. Lê `x-user-id` do header (injetado pelo middleware)
2. Busca tenant do usuário via Supabase service role
3. Se sem tenant → redirect `/onboarding`
4. Busca usage e subscription do backend em paralelo
5. Se subscription bloqueada → redirect `/billing?reason=blocked`
6. Renderiza sidebar + banners de alerta

Páginas existentes:
- `/dashboard` — KPIs da loja
- `/leads` — lista e CRM de leads
- `/crm` — kanban visual
- `/vehicles` — estoque de veículos
- `/customers` — clientes cadastrados
- `/financial` — entradas e caixa
- `/financial/commissions` — comissões de vendedores
- `/sales` — vendas registradas
- `/analytics` — analytics (plano Pro+)
- `/billing` — assinatura atual
- `/billing/history` — faturas pagas
- `/billing/plans` — upgrade de plano
- `/settings` — configurações da loja
- `/vendors` — gestão de equipe
- `/whatsapp` — integração WhatsApp

### `app/(public)/` — Rotas públicas (SEO)

Sem autenticação. Indexadas por Google.

- `/:slug` — vitrine da revenda com lista de veículos
- `/:slug/:vehicleSlug` — página individual do veículo com schema.org + Open Graph

### Rotas de auth

- `/login` — login com email/senha
- `/register` — criação de conta
- `/onboarding` — setup inicial da loja (após primeiro login)
- `/forgot-password` — solicita reset de senha
- `/reset-password` — nova senha via token
- `/auth/callback` — troca PKCE code por sessão

---

## Middleware (`middleware.ts`)

Executa em **toda request** (exceto assets estáticos):

```typescript
// Rotas protegidas verificadas:
const PROTECTED_PREFIXES = [
  '/dashboard', '/leads', '/crm', '/vehicles', '/customers',
  '/financial', '/sales', '/analytics', '/settings',
  '/vendors', '/billing', '/whatsapp', '/onboarding'
]
```

Comportamento:
1. Refresca cookies de sessão Supabase automaticamente
2. Se rota protegida e sem sessão → redirect `/login?redirect=<path>`
3. Se autenticado → injeta `x-user-id` no header (lido por Server Components)
4. Sempre → injeta `x-pathname` no header

**Regra crítica:** O cookie adapter deve ter `getAll` + `setAll`. Se remover `setAll`, sessões param de funcionar.

---

## Comunicação com Backend (`lib/proxy.ts`)

```typescript
// Para Server Components / Server Actions:
await apiCall('GET', '/api/leads')
await apiCall('POST', '/api/leads', { name, phone })

// Para rotas públicas (sem auth):
await publicFetch('/api/public/minha-loja/vehicles')
```

URL base:
- **Em Docker:** `INTERNAL_API_URL=http://backend:8080` (rede interna — mais rápido)
- **Em produção Coolify:** `INTERNAL_API_URL=https://api.revendaclick.com.br`
- **Fallback:** `NEXT_PUBLIC_API_URL=https://api.revendaclick.com.br`

O token de acesso é obtido automaticamente via `supabase.auth.getSession()`.

---

## Clientes Supabase

### Server-side (`lib/supabaseServer.ts`)

```typescript
// Respeita RLS — usa anon key
const supabase = await createClient()

// Bypassa RLS — usa service role key (NUNCA expor ao browser)
const supabase = createServiceClient()
```

### Client-side (`lib/supabaseClient.ts`)

```typescript
// Singleton no browser — respeita RLS
const supabase = createClient()
```

---

## Tipos do Tenant (`lib/tenant.ts`)

```typescript
type PlanUsage = {
  vehicles_count, users_count, leads_count   // uso atual
  max_vehicles, max_users, max_leads          // limites do plano
  vehicles_pct, users_pct                     // percentual de uso
  plan_name, plan_display                     // nome do plano
  subscription_status                         // active/trialing/past_due/canceled
  vehicles_alert: 'ok'|'warning'|'critical'|'blocked'
  features?: string[]                          // features do plano
  has_crm, has_analytics, has_whatsapp, ...   // flags de feature
}
```

Alerta de uso:
- ≥ 80% → `warning`
- ≥ 85% → `critical`
- ≥ 100% → `blocked`

---

## Feature Gates (`components/ui/FeatureGate.tsx`)

Bloqueia UI baseado nas features do plano:

```typescript
// Só renderiza children se plano tem a feature
<FeatureGate feature="analytics" usage={usage}>
  <AnalyticsPage />
</FeatureGate>
```

Features disponíveis (do banco, campo `plans.features`):
`marketplace`, `whatsapp_button`, `lead_capture`, `crm`, `kanban`,
`custom_domain`, `analytics`, `priority_support`, `api_access`, `white_label`

---

## SEO — Páginas Públicas

Arquivo: `app/(public)/[slug]/[vehicleSlug]/page.tsx`

Gera automaticamente:
- `<title>` e `<meta description>`
- **schema.org** (JSON-LD) com dados do veículo
- **Open Graph** (para compartilhamento no WhatsApp/Facebook)
- URL canônica

Arquivo: `app/sitemap.ts` — sitemap.xml dinâmico
Arquivo: `app/robots.ts` — robots.txt dinâmico

---

## Upload de Fotos

Rota: `POST /api/upload/vehicle-photo`
Arquivo: `app/api/upload/vehicle-photo/route.ts`

Fluxo:
1. Frontend envia multipart/form-data
2. Route handler usa `createServiceClient()` (bypassa RLS)
3. Upload para Supabase Storage bucket `vehicle-photos`
4. Retorna URL pública da foto
5. Frontend salva URL em `vehicles.images[]` ou `thumbnail_url`

---

## Observabilidade Frontend

- **Client errors:** `lib/error-tracking.ts` → POST `/api/log/error`
- **Server logs:** `instrumentation.ts` → BetterStack
- **Analytics:** `components/Analytics.tsx` → Google Analytics GA4 (`NEXT_PUBLIC_GA_ID`)

---

## Variáveis de Ambiente Frontend

| Variável | Tipo | Uso |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Pública | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Pública | Chave anônima |
| `NEXT_PUBLIC_API_URL` | Pública | URL pública do backend |
| `NEXT_PUBLIC_APP_URL` | Pública | URL do app |
| `NEXT_PUBLIC_GA_ID` | Pública | Google Analytics |
| `SUPABASE_SERVICE_ROLE_KEY` | **Secreta** | Bypassa RLS — server only |
| `INTERNAL_API_URL` | **Secreta** | URL interna do backend — server only |
| `BETTER_STACK_SOURCE_TOKEN` | **Secreta** | Log shipping |
| `BETTER_STACK_INGESTING_URL` | **Secreta** | URL BetterStack |

---

## Regras Críticas do Frontend

| Regra | Motivo |
|---|---|
| Usar `async cookies()` — nunca síncrono | Next.js 16 exige async |
| Nunca usar `cookies()` dentro de `unstable_cache` | Causa erro de runtime |
| Sempre `await params` em Server Components | Next.js 16 exige async params |
| Nunca expor `SERVICE_ROLE_KEY` ao browser | Bypassa RLS — segurança crítica |
| Não mover lógica para client sem necessidade | Quebra SSR e SEO |
| `loading.tsx` em rotas lentas | UX — evita tela em branco |
| `error.tsx` em rotas críticas | UX — erro amigável ao usuário |
