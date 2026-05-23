# AUTENTICAÇÃO REAL — RevendaClick

> Extraído de: `backend/internal/middleware/auth.go`, `backend/internal/middleware/tenant.go`, `backend/internal/onboarding/onboarding.go`, `frontend/middleware.ts`, `frontend/lib/supabaseServer.ts`, `frontend/lib/supabaseClient.ts`, `frontend/app/auth/callback/route.ts`, `frontend/app/(dashboard)/layout.tsx`.

---

## Provedor de Autenticação

**Supabase Auth** — gerencia registro, login, sessões, JWT, confirmação de email, recuperação de senha.

---

## Algoritmos JWT Suportados

**Arquivo:** `backend/internal/config/config.go`, `backend/internal/middleware/auth.go`

O backend suporta dois algoritmos de assinatura JWT:

| Algoritmo | Quando usado | Configuração |
|---|---|---|
| **HS256** | Projetos Supabase antigos | `SUPABASE_JWT_SECRET` preenchido |
| **ES256** | Projetos Supabase novos | Chave pública buscada automaticamente via JWKS |

O backend tenta buscar a EC key no boot:
```
GET <SUPABASE_URL>/auth/v1/.well-known/jwks.json
→ busca key com kty=EC, crv=P-256
→ se encontrar: usa ES256
→ fallback: usa HMAC com SUPABASE_JWT_SECRET
```

---

## JWT Claims Usados

```json
{
  "sub": "<user_uuid>",              // user_id
  "aud": "authenticated",
  "exp": <timestamp>,
  "app_metadata": {
    "tenant_id": "<tenant_uuid>",   // setado no onboarding via Admin API
    "user_role": "owner"            // owner | admin | seller | viewer
  }
}
```

### Como o backend extrai esses claims (`middleware/auth.go`)

```go
userID, _ := claims.GetSubject()       // → CtxUserID
c.Set(CtxTenantID, app_metadata.tenant_id)
c.Set(CtxUserRole, app_metadata.user_role)
```

Após onboarding, `tenant_id` e `user_role` estão no JWT. Antes disso, o backend usa fallback via DB (tabela `users`).

---

## Middleware de Autenticação — Backend

### JWTAuth (`middleware/auth.go`)

```
Authorization: Bearer <supabase_access_token>
    ↓
Valida assinatura (ES256 ou HS256)
Valida audience ("authenticated")
Valida expiração
    ↓
Injeta no gin.Context:
  - user_id
  - tenant_id (se presente no app_metadata)
  - user_role (se presente no app_metadata)
```

Se token inválido/ausente → **401 Unauthorized**

### RequireRole (`middleware/auth.go`)

```go
ownerAdmin := appMiddleware.RequireRole("owner", "admin")
```

Verifica `ctx.user_role`. Se não permitido → **403 Forbidden**

### TenantResolver (`middleware/tenant.go`)

Executado após JWTAuth em rotas autenticadas:

```
Se JWT já tem tenant_id e user_role:
    → Verifica se tenant is_active=TRUE no DB
    → Carrega slug do tenant
    → Injeta CtxTenantSlug

Se JWT não tem tenant_id (usuário pré-onboarding):
    → SELECT users JOIN tenants WHERE user_id=$1 AND is_active=TRUE
    → Injeta tenant_id, role, slug

Se tenant não encontrado → 403 ("user_not_provisioned")
```

### SubscriptionGate (`middleware/subscription.go`)

```
SELECT status, grace_until FROM subscriptions WHERE tenant_id=$1

  active | trialing → passa
  past_due + dentro grace → passa + header "X-Subscription-Warning: payment_overdue"
  past_due + grace expirada → 402
  canceled | paused → 402
  sem subscription → passa (onboarding)
```

### PlanGate (`middleware/plan_gate.go`)

```go
PlanGate(pool, "analytics")
```

```sql
SELECT EXISTS (
    SELECT 1 FROM subscriptions s JOIN plans p ON p.id = s.plan_id
    WHERE s.tenant_id = $1
    AND s.status IN ('active', 'trialing')
    AND p.features @> to_jsonb($2::text)
)
```

Se feature não disponível no plano → **403 feature_not_available**

---

## Middleware de Autenticação — Frontend

### middleware.ts (Next.js)

**Arquivo:** `frontend/middleware.ts`

Executa em **todas as requests** (exceto assets estáticos):

```
1. createServerClient com cookie adapter (get/set)
2. supabase.auth.getUser() → refresca token automaticamente
3. Se rota protegida E sem user → redirect /login?redirect=<pathname>
4. Se user autenticado → injeta x-user-id no header da response
5. Sempre → injeta x-pathname no header da response
```

**Rotas protegidas verificadas pelo middleware:**
```
/dashboard, /leads, /crm, /vehicles, /customers,
/financial, /sales, /analytics, /settings,
/vendors, /billing, /whatsapp, /onboarding
```

---

## Callback de Autenticação

**Arquivo:** `frontend/app/auth/callback/route.ts`

Endpoint: `GET /auth/callback?code=...&type=...&next=...`

```
1. Extrai code + type + next da query string
2. Se sem code → redirect /login?error=missing_code
3. supabase.auth.exchangeCodeForSession(code)
   → troca o PKCE code por access_token + refresh_token
   → salva em cookies
4. Se type=recovery → redirect /reset-password
5. Caso contrário → redirect <next> (default: /dashboard)
```

**Usado por:**
- Confirmação de email (signup)
- Magic link
- Recovery de senha

---

## Clientes Supabase no Frontend

**Arquivo:** `frontend/lib/supabaseServer.ts`

| Função | Chave usada | Bypassa RLS | Uso |
|---|---|---|---|
| `createClient()` | ANON_KEY | Não | Server Components que respeitam RLS |
| `createServiceClient()` | SERVICE_ROLE_KEY | Sim | Middleware e server actions que precisam de acesso total |

**Arquivo:** `frontend/lib/supabaseClient.ts`

| Função | Chave usada | Uso |
|---|---|---|
| `createClient()` | ANON_KEY | Client Components (browser) — singleton |

### Cookie Adapter (obrigatório para SSR)

O `createServerClient` do `@supabase/ssr` requer adapter com **3 métodos**:
```typescript
cookies: {
    getAll()   // leitura de cookies
    setAll()   // escrita de cookies (server actions / route handlers)
    // remove é implícito via setAll com valor vazio
}
```

**Risco:** remover `setAll` quebra refresh de sessão.

---

## Fluxo de Onboarding — Vinculação Tenant/JWT

**Arquivo:** `backend/internal/onboarding/onboarding.go`

Após o usuário criar a loja, o backend:

```
POST /api/onboarding/setup
    ↓
1. Verifica JWT (jwtAuth)
2. Verifica idempotência (user já tem tenant?)
3. Transação DB:
   a. INSERT INTO tenants → auto-cria subscription (trialing) + onboarding_checklist
   b. INSERT INTO users (id=auth.uid, tenant_id=..., role='owner')
4. Atualiza Supabase app_metadata:
   PUT <SUPABASE_URL>/auth/v1/admin/users/<user_id>
   { "app_metadata": { "tenant_id": "...", "user_role": "owner" } }
5. A partir do próximo login, JWT inclui tenant_id e user_role
```

**Nota:** O passo 4 é não-fatal. Se falhar, `TenantResolver` usa fallback via DB.

---

## Roles e Permissões

| Role | Permissões |
|---|---|
| `owner` | Tudo, incluindo DELETE e operações financeiras |
| `admin` | Tudo exceto ações exclusivas de owner |
| `seller` | Leitura + criação de leads/veículos próprios |
| `viewer` | Apenas leitura |

**RLS do banco** valida roles via `auth_user_role()` que lê do JWT.
**Backend Go** valida via `RequireRole("owner", "admin")` middleware.

---

## Tokens de Acesso às APIs

### Backend Go (de qualquer client)

```
Authorization: Bearer <supabase_access_token>
```

O token é obtido via:
```typescript
// Server-side (frontend)
const { data: { session } } = await supabase.auth.getSession()
const token = session.access_token
```

### Proxy Frontend → Backend (`lib/proxy.ts`)

```typescript
async function getAccessToken(): Promise<string> {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) throw new Error('Unauthenticated')
    return session.access_token
}
```

---

## Sequência de Auth no Dashboard Layout

```
Request chega ao dashboard
    ↓
middleware.ts: verifica cookie → injeta x-user-id ou redireciona /login
    ↓
(dashboard)/layout.tsx:
    1. getUserIdFromHeaders() → lê x-user-id
    2. getTenantForUser(uid) → Supabase service client
       → se sem tenant → redirect /onboarding
    3. getSession() → extrai access_token
    4. getUsageFromAPI(token) → GET /api/usage (backend Go)
    5. getSubscription() → backend Go
    6. se sub.is_blocked e não em /billing → redirect /billing?reason=blocked
    7. Renderiza com tenant, subscription, usage context
```

---

## Riscos ao Alterar Autenticação

| Mudança | Risco |
|---|---|
| Remover `jwt.WithAudience("authenticated")` | Qualquer JWT Supabase passaria, mesmo service role |
| Trocar `getUser()` por `getSession()` no middleware | Sessão não é verificada no servidor — vulnerabilidade |
| Remover `setAll` do cookie adapter | Refresh de sessão para de funcionar → usuários deslogados |
| Não atualizar `app_metadata` no onboarding | JWT não carrega tenant_id → TenantResolver faz DB query extra em todo request |
| Remover `jwtAuth` de qualquer rota gated | Dados de tenant expostos sem autenticação |
| Alterar nome dos campos `tenant_id`/`user_role` no `app_metadata` | RLS do Storage e TenantResolver param de funcionar |
