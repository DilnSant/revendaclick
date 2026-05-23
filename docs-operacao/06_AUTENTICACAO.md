# 06 — AUTENTICAÇÃO

> Baseado em leitura de: `backend/internal/middleware/auth.go`, `backend/internal/middleware/tenant.go`, `frontend/middleware.ts`, `frontend/lib/supabaseServer.ts`, `frontend/app/auth/callback/route.ts`, `backend/internal/onboarding/onboarding.go`.

---

## Provedor

**Supabase Auth** gerencia registro, login, sessões, JWT e email de confirmação.

---

## Fluxos de Autenticação

### 1. Registro
```
/register → supabase.auth.signUp({ email, password })
         → Supabase envia email de confirmação
         → Usuário clica no link
         → GET /auth/callback?code=...&type=signup
         → exchangeCodeForSession(code) → sessão criada
         → redirect /onboarding
```

### 2. Login
```
/login → supabase.auth.signInWithPassword({ email, password })
       → sessão salva em cookies
       → middleware.ts: detecta usuário → injeta x-user-id
       → redirect /dashboard
```

### 3. Recuperação de senha
```
/forgot-password → supabase.auth.resetPasswordForEmail(email)
               → Supabase envia email com link
               → GET /auth/callback?code=...&type=recovery
               → exchangeCodeForSession(code)
               → redirect /reset-password
               → supabase.auth.updateUser({ password: nova })
```

### 4. Onboarding (primeira vez)
```
POST /api/onboarding/setup (backend)
  → valida JWT
  → verifica idempotência (já tem tenant?)
  → transação DB: INSERT tenants + users
  → triggers: cria subscription trial + checklist
  → PUT Supabase Admin API: atualiza app_metadata
    { "tenant_id": "...", "user_role": "owner" }
  → próximos JWTs já carregam tenant_id e user_role
```

---

## JWT — Estrutura e Claims

```json
{
  "sub": "<user_uuid>",           // user_id extraído com claims.GetSubject()
  "aud": "authenticated",         // validado com jwt.WithAudience()
  "exp": 1748000000,              // validado automaticamente
  "email": "user@example.com",
  "role": "authenticated",
  "app_metadata": {
    "tenant_id": "<tenant_uuid>", // setado no onboarding — usado por RLS e backend
    "user_role": "owner"          // owner | admin | seller | viewer
  }
}
```

---

## Middleware de Auth — Backend Go

### JWTAuth (`middleware/auth.go`)

```
Authorization: Bearer <access_token>
    ↓
Detecta algoritmo (ES256 ou HS256)
Valida assinatura
Valida audience ("authenticated")
Valida expiração
    ↓
gin.Context recebe:
  "user_id"    = claims.Sub
  "tenant_id"  = app_metadata.tenant_id (se presente)
  "user_role"  = app_metadata.user_role (se presente)
```

Algoritmos suportados:
- **ES256** (projetos Supabase novos): chave EC P-256 buscada do JWKS no boot
- **HS256** (projetos Supabase antigos): `SUPABASE_JWT_SECRET`

### TenantResolver (`middleware/tenant.go`)

Executa após JWTAuth:

```
Se JWT já tem tenant_id + user_role:
    → SELECT slug FROM tenants WHERE id=$1 AND is_active=TRUE
    → Se não encontrado → 403 tenant_inactive
    → Injeta tenant_slug no contexto

Se JWT não tem (usuário pré-onboarding):
    → SELECT u.tenant_id, u.role, t.slug
      FROM users u JOIN tenants t ON t.id=u.tenant_id
      WHERE u.id=$1 AND u.is_active=TRUE
    → Se não encontrado → 403 user_not_provisioned
    → Injeta tenant_id, role, slug no contexto
```

### RequireRole

```go
ownerAdmin := appMiddleware.RequireRole("owner", "admin")

// Uso em rota:
gated.DELETE("/vehicles/:id", ownerAdmin, vehicleH.Delete)
```

Se role não permitida → **403 Forbidden**

---

## Middleware de Auth — Frontend Next.js

### middleware.ts

Executa em toda request (exceto assets):

```typescript
// 1. Cria cliente Supabase SSR com cookie adapter
const supabase = createServerClient(URL, ANON_KEY, {
    cookies: { getAll, setAll }  // setAll é obrigatório para refresh
})

// 2. Verifica sessão (refresca automaticamente se necessário)
const { data: { user } } = await supabase.auth.getUser()

// 3. Guard de rota
if (isProtected(pathname) && !user) {
    redirect('/login?redirect=' + pathname)
}

// 4. Injeta contexto nos headers para Server Components
response.headers.set('x-user-id', user.id)
response.headers.set('x-pathname', pathname)
```

**Importante:** Usar `getUser()` (não `getSession()`) para verificação server-side — recomendado pelo Supabase para evitar replay attacks.

---

## Fluxo de Sessão Completo

```
Browser tem cookie sb-<ref>-auth-token
    ↓
middleware.ts:
    → createServerClient com cookie adapter
    → supabase.auth.getUser() → valida no Supabase
    → se token expirado → refresca automaticamente
    → atualiza cookie no browser via setAll()
    ↓
(dashboard)/layout.tsx:
    → getSession() → obtém access_token para backend
    → apiCall('GET', '/api/usage') → backend Go
    → backend: JWTAuth → valida token → extrai claims
```

---

## Roles e Permissões

| Role | Quem é | O que pode fazer |
|---|---|---|
| `owner` | Dono da revenda | Tudo: DELETE, billing, settings, team |
| `admin` | Gerente | Quase tudo, exceto ações exclusivas do owner |
| `seller` | Vendedor | Ver e criar leads/veículos próprios |
| `viewer` | Observador | Apenas leitura |

### Validação dupla (backend + banco)

```
Backend middleware: RequireRole("owner", "admin")
    +
RLS do banco: auth_user_role() IN ('owner', 'admin')
```

Mesmo que alguém contorne o middleware, o banco bloqueia.

---

## Callback de Auth (`/auth/callback`)

Arquivo: `frontend/app/auth/callback/route.ts`

```
GET /auth/callback?code=X&type=Y&next=/dashboard

Se sem code → redirect /login?error=missing_code
Se error → redirect /login?error=auth_callback_failed
Se type=recovery → redirect /reset-password
Caso contrário → redirect <next> (default: /dashboard)
```

Usado por:
- Confirmação de email (tipo: signup)
- Magic link (tipo: magiclink)
- Reset de senha (tipo: recovery)

---

## Clientes Supabase por Contexto

| Contexto | Função | Chave | RLS |
|---|---|---|---|
| Server Components | `createClient()` de `supabaseServer.ts` | ANON_KEY | Respeita |
| Server Actions / Route Handlers privilegiados | `createServiceClient()` de `supabaseServer.ts` | SERVICE_ROLE_KEY | Bypassa |
| Client Components (browser) | `createClient()` de `supabaseClient.ts` | ANON_KEY | Respeita |
| Backend Go (Auth Admin) | HTTP direto para Supabase Admin API | SERVICE_ROLE_KEY | — |

---

## Regras Críticas de Auth

| Regra | Risco se violado |
|---|---|
| Cookie adapter DEVE ter `getAll` + `setAll` | Sessões não são renovadas → usuários deslogados |
| Usar `getUser()` no middleware, não `getSession()` | Sessões comprometidas podem passar |
| `SERVICE_ROLE_KEY` nunca no browser | Acesso total ao banco por qualquer usuário |
| Validar `aud = "authenticated"` no backend | Tokens de service role passam como usuário |
| `app_metadata.tenant_id` sempre presente após onboarding | Cada request faz query extra ao banco |
| RLS ativo em todas as tabelas de negócio | Cross-tenant data leak |
