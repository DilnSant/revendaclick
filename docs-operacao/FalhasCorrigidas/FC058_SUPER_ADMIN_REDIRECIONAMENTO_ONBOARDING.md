# FC058 — Super Admin redirecionado para `/onboarding` ao logar + subdomínio `www.` sem redirect canônico

**Sessão:** 58
**Data:** 2026-06-23
**Commit:** (a definir)
**Severidade:** ALTA (login do owner/super_admin completamente quebrado — fluxo administrativo inacessível em produção)

---

## Sintoma

Ao tentar logar como super_admin (`dilneysantos.developer@gmail.com`) em `app.revendaclick.com.br/login`, o usuário era redirecionado para `/onboarding` — fluxo de criação de loja — em vez de `/admin`. Resultado: impossível acessar o painel super_admin sem editar manualmente a URL.

Em paralelo, usuários que chegavam ao app via `www.revendaclick.com.br/*` (subdomínio aceito pela Vercel mas não canônico) tinham sessão perdida porque cookies são scoped ao domínio exato — login feito em `www.` não era reconhecido em `app.`.

## Causa Raiz

### A) Layout do dashboard assumia "todo usuário tem tenant"

`frontend/app/(dashboard)/layout.tsx:28` (versão pré-FC058):

```ts
const tenantStatus = await getTenantStatusForUser(uid)
if (!tenantStatus) redirect('/onboarding')
```

`getTenantStatusForUser` (`frontend/lib/tenant.ts:239`) consulta `users.tenant_id` e retorna `null` quando o usuário não tem tenant. Para super_admin, isso **sempre** acontece porque `users.tenant_id = NULL` é o design correto (migration 025: super_admin não opera loja comercial).

O layout não distinguia:
- "Usuário normal sem tenant → precisa ir para `/onboarding` para criar loja" (correto)
- "Super_admin sem tenant → precisa ir para `/admin` para acessar painel administrativo" (quebrado)

### B) Subdomínio `www.` não tinha redirect para `app.`

`frontend/next.config.ts` aceitava imagens de `www.revendaclick.com.br` (linha 34) mas **não tinha regra de redirect** forçando `www.` → `app.`. Como cookies Supabase são scoped ao domínio exato, login feito em `www.` não era reconhecido em `app.`, gerando confusão para o usuário (parecia que "login não funcionou").

## Correção Aplicada

### A) Detecção de super_admin no dashboard layout

`frontend/app/(dashboard)/layout.tsx`:

1. Substituído o padrão duplicado de `getUser()` + fallback por um único `getUser()` no topo da função.
2. Adicionado early-return para super_admin ANTES de chamar `getTenantStatusForUser`:

```ts
const { data: { user } } = await supabase.auth.getUser()
if (!user) redirect('/login')
const uid = (await getUserIdFromHeaders()) ?? user.id

// FC058: super_admin has tenant_id=NULL by design (migration 025), so
// getTenantStatusForUser() always returns null. Route them to /admin
// instead of /onboarding (which is the create-tenant flow).
const role = user.app_metadata?.user_role as string | undefined
if (role === 'super_admin') redirect('/admin')

const tenantStatus = await getTenantStatusForUser(uid)
if (!tenantStatus) redirect('/onboarding')
```

Padrão consistente com `frontend/app/login/page.tsx:37-41` que já usa `app_metadata?.user_role`.

### B) Redirect `www.` → `app.` em `next.config.ts`

```ts
async redirects() {
  return [
    {
      source: '/:path*',
      has: [{ type: 'host', value: 'www.revendaclick.com.br' }],
      destination: 'https://app.revendaclick.com.br/:path*',
      permanent: true,
    },
  ]
},
```

`permanent: true` retorna HTTP 308 (preserva método HTTP, cacheável em CDNs). Preserva path e query string via `:path*`.

## Arquivos Alterados

| Arquivo | Mudança |
|---|---|
| `frontend/app/(dashboard)/layout.tsx` | getUser() único; super_admin → /admin antes de getTenantStatusForUser |
| `frontend/next.config.ts` | redirects() — `www.revendaclick.com.br/:path*` → `app.revendaclick.com.br/:path*` (308) |

## Impacto

- **Tenants afetados**: 0 (mudança afeta apenas super_admin e usuários em subdomínio não-canônico)
- **Dados corrompidos**: NÃO
- **Billing afetado**: NÃO
- **Duração do incidente**: ~9 dias (desde migration 025 em 2026-05-29, owner vinha trabalhando com edição manual de URL para `/admin`)

## Validação

### Pré-deploy
- `npx tsc --noEmit` → **0 erros**

### Pós-deploy (manual)
1. Login `dilneysantos.developer@gmail.com` em `app.revendaclick.com.br/login` → esperado: HTTP 200 em `/admin`
2. Login `dilneysantos@gmail.com` (santos-car Pro) → esperado: HTTP 200 em `/dashboard` (sem mudança de comportamento)
3. Registro novo sem tenant → esperado: HTTP 200 em `/onboarding` (não afetado)
4. Login tenant bloqueado/quarentenado → esperado: HTTP 200 em `/conta-suspensa?motivo=...` (não afetado)
5. Acesso direto a `https://www.revendaclick.com.br/admin` → esperado: 308 → `https://app.revendaclick.com.br/admin`

## Prevenção Futura

1. **Convenção**: Qualquer layout que assuma "tenant existe" deve primeiro verificar o role e rotear super_admin para `/admin` separadamente. Aplicar este padrão em novos layouts do grupo `(dashboard)` no futuro.
2. **Canônico único**: O subdomínio oficial é `app.revendaclick.com.br`. Qualquer referência a `www.revendaclick.com.br` em código, documentação ou comunicação deve considerar que será redirecionada.
3. **Auditoria futura**: Ao adicionar novos layouts no grupo `(dashboard)`, verificar que o helper `getAuthenticatedContext()` (a ser criado) já distinga super_admin antes de operações tenant-scoped.

## Relacionados

- **FC047** — Pós-deploy FC046: `audit_logs.tenant_id` nullable para super_admin (migration 025) — preparou o terreno mas este FC não existia na época
- **FC053** — Super Admin DELETE tenant "Acesso negado" — outros bugs de super_admin corrigidos
- **FC055** — middleware.ts conflito com proxy.ts — confirmou que `proxy.ts` é o middleware nativo do Next.js 16
- **D5 (CLAUDE.md)** — Dupla proteção de tenant: backend + RLS. super_admin é a exceção documentada.

## Notas

- O usuário notou o problema ao tentar atender o lead "Joaõ" (48998232010, São José/SC, `landing_leads` com status `novo` desde 2026-06-04). O lead em si está correto no sistema — o usuário buscava no lugar errado (`/leads` da loja = CRM interno; `/admin/leads` = landing leads). Documentação atualizada em `23_PROXIMO_PASSO.md` para indicar a URL correta.

---

## FC058 (adendo) — Causa raiz completa revelada por FC059

**Sessão do adendo:** 59 (2026-06-26)
**Severidade do adendo:** ALTA (FC058 sozinho não resolvia o problema em produção)

A correção FC058 substituiu a checagem `user.app_metadata?.user_role` no `(dashboard)/layout.tsx`, mas isso assume que o JWT **contém** a claim `user_role`. Na realidade, o usuário `dilneysantos.developer@gmail.com`:

- `public.users.role = 'super_admin'` (setado via SQL — migration 025)
- `auth.users.app_metadata.user_role = UNDEFINED` (nunca sincronizado via Supabase Auth Admin API)

Resultado: o JWT emitido pelo Supabase para esse usuário **não carrega** a claim `user_role`. Logo a checagem FC058 `role === 'super_admin'` falhava em produção mesmo após o deploy.

Por que isso acontece:
- O único writer de `app_metadata` é `updateSupabaseAppMetadata()` em `backend/internal/onboarding/onboarding.go:184` — hardcoded para `role = "owner"`.
- Essa função roda apenas no fluxo de onboarding (`CompleteOnboarding`).
- Promover alguém para `super_admin` via SQL (`UPDATE public.users SET role = 'super_admin' WHERE id = ...`) **não propaga** para `auth.users.app_metadata`, porque `auth.users` é gerenciado pelo Supabase Auth (PostgREST não tem acesso de escrita direto).

FC059 fecha a falha de defense-in-depth: qualquer layout/route que checar role passa a usar `resolveUserRole()` (JWT-first + DB-fallback via `createServiceClient`). Ver `FC059_SUPER_ADMIN_DEFENSE_IN_DEPTH_DB_FALLBACK.md` para a correção completa.
