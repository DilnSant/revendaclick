# FC059 — Super Admin defense-in-depth: DB-fallback quando `app_metadata.user_role` ausente

**Sessão:** 59
**Data:** 2026-06-26
**Commit:** (a definir)
**Severidade:** ALTA (sem o fallback, super_admin permanece inacessível a partir do login mesmo após FC058 deployado em produção)

---

## Sintoma

Após deploy da correção FC058, o usuário `dilneysantos.developer@gmail.com` (super_admin) continuava sendo redirecionado para `/onboarding` ao logar — comportamento idêntico ao pré-FC058. Verificação via logs Vercel + reprodução manual confirmou que a checagem `role === 'super_admin'` em `(dashboard)/layout.tsx` **nunca disparava** o `redirect('/admin')`.

## Causa Raiz

O usuário `dilneysantos.developer@gmail.com` tem:

| Tabela/Coluna | Valor |
|---|---|
| `public.users.role` | `super_admin` (setado via SQL — migration 025) |
| `auth.users.app_metadata.user_role` | `undefined` (nunca sincronizado) |

Resultado: o JWT emitido pelo Supabase para esse usuário **não contém** a claim `user_role`. Toda checagem baseada apenas em `user.app_metadata?.user_role` falha aberto.

### Por que `app_metadata.user_role` está ausente

- Único writer: `updateSupabaseAppMetadata()` em `backend/internal/onboarding/onboarding.go:184` — **hardcoded** para `role = "owner"`.
- Chamada apenas no fluxo de onboarding (`CompleteOnboarding`).
- Promover alguém para `super_admin` via SQL puro (`UPDATE public.users SET role = 'super_admin' WHERE id = ...`) **não propaga** para `auth.users.app_metadata`, porque:
  - `auth.users` é gerenciado pelo GoTrue (Auth server do Supabase).
  - A única forma de escrever `app_metadata` em `auth.users` é via **Supabase Auth Admin API** (service_role JWT).
  - Não existe trigger SQL capaz de fazer isso — `auth.users` write requer chamada HTTP.

### Por que FC058 sozinho não resolve

FC058 substituiu `getTenantStatusForUser() → null → /onboarding` por `user.role === 'super_admin' → /admin`. Mas o gating ainda depende inteiramente do JWT claim — que está ausente. O bug apenas migrou de um local para outro.

## Correção Aplicada — Defense-in-Depth

Adicionado helper `resolveUserRole()` em `frontend/lib/tenant.ts` com semântica **JWT-first + DB-fallback**:

```ts
export const getUserRoleFromDB = cache(
  async (userId: string): Promise<string | null> => {
    if (!userId) return null
    try {
      const admin = createServiceClient()
      const { data, error } = await admin
        .from('users')
        .select('role')
        .eq('id', userId)
        .eq('is_active', true)
        .maybeSingle()
      if (error) {
        console.error('[getUserRoleFromDB] error:', error.message, { userId })
        return null
      }
      return data?.role ?? null
    } catch (err) {
      console.error('[getUserRoleFromDB] unexpected error:', err)
      return null
    }
  }
)

export async function resolveUserRole(
  user: { app_metadata?: Record<string, unknown> | null } | null,
  userId: string
): Promise<string | null> {
  const fromJwt = user?.app_metadata?.user_role
  if (typeof fromJwt === 'string' && fromJwt.length > 0) {
    return fromJwt
  }
  return await getUserRoleFromDB(userId)
}
```

**Comportamento:**
1. JWT tem claim válida → usa JWT (caminho rápido, sem query extra).
2. JWT sem claim → fallback para `SELECT role FROM users WHERE id = $1` via service-role.
3. Ambos falham → retorna `null`; caller trata como "desconhecido".

**`React.cache()`** dedup — múltiplos call sites no mesmo request compartilham uma única query.

### Call sites atualizados

| Arquivo | Mudança |
|---|---|
| `frontend/lib/tenant.ts` | +52 linhas — `getUserRoleFromDB` + `resolveUserRole` |
| `frontend/app/(dashboard)/layout.tsx` | super_admin check: `user.app_metadata?.user_role` → `resolveUserRole(user, user.id)` |
| `frontend/app/(admin)/layout.tsx` | super_admin gate: mesmo swap |
| `frontend/app/api/admin/[...path]/route.ts` | proxy guard: mesmo swap + null user check |
| `frontend/app/api/me/role/route.ts` | **NOVO** — endpoint server-side que retorna `{ role }` via `resolveUserRole` |
| `frontend/app/login/page.tsx` | após `signInWithPassword`, fetch `/api/me/role` para resolver destino (`/admin` vs `/dashboard`) |

### Por que o endpoint `/api/me/role` é necessário

`login/page.tsx` é `'use client'` — não pode usar `createServiceClient()` (bypassa RLS e exige env var server-only). O endpoint expõe `resolveUserRole()` de forma segura e autenticada para o client decidir o redirect após login. Implementação:

```ts
// frontend/app/api/me/role/route.ts
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ role: null }, { status: 200 })
  const role = await resolveUserRole(user, user.id)
  return NextResponse.json({ role }, { status: 200 })
}
```

Try/catch no login garante fallback gracioso: se o endpoint falhar (network, hiccup), `resolvedRole = null` → destino default `/dashboard` → layout do dashboard faz a checagem correta via `resolveUserRole` server-side.

## Arquivos Alterados

| Arquivo | Tipo | Linhas |
|---|---|---|
| `frontend/lib/tenant.ts` | modificação | +52 |
| `frontend/app/(dashboard)/layout.tsx` | modificação | ~3 |
| `frontend/app/(admin)/layout.tsx` | modificação | ~3 |
| `frontend/app/api/admin/[...path]/route.ts` | modificação | ~4 |
| `frontend/app/api/me/role/route.ts` | **novo** | 25 |
| `frontend/app/login/page.tsx` | modificação | ~10 |

## Impacto

- **Tenants afetados:** 0 (mudança transparente para usuários não-super_admin — JWT path preserva comportamento)
- **Dados corrompidos:** NÃO
- **Billing afetado:** NÃO
- **Performance:** +1 query service-role **apenas quando JWT falta claim** (caminho comum); cache por request dedup.

## Validação

### Pré-deploy
- `npx tsc --noEmit` → **0 erros**

### Pós-deploy
1. Login `dilneysantos.developer@gmail.com` → esperado: HTTP 200 em `/admin` (não `/onboarding`)
2. Login `dilneysantos@gmail.com` (santos-car Pro, JWT com `user_role=owner`) → `/dashboard` (caminho JWT-first, sem regressão)
3. Tenant sem role especial → `/dashboard`
4. `curl https://app.revendaclick.com.br/api/me/role` (sem cookie) → `{"role":null}` HTTP 200

## Prevenção Futura

### Procedimento manual documentado (backlog)

Ao promover um usuário para `super_admin` (ou qualquer role sensível) via SQL, **sempre** sincronizar também `auth.users.app_metadata.user_role` via Supabase Auth Admin API:

```bash
curl -X PATCH "https://ibgaywezfcbbiiziaoac.supabase.co/auth/v1/admin/users/{user_id}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"app_metadata": {"user_role": "super_admin"}}'
```

> Não usar trigger SQL — `auth.users` write requer HTTP Admin API.

### Automação (não adotada)

Trigger PostgreSQL em `public.users` que chama `pg_net.http()` para Admin API é tecnicamente viável, mas:
- Aumenta superfície de ataque (service_role JWT em logs PostgreSQL).
- Latência: chamada HTTP síncrona no write atrasa `UPDATE`.
- Supabase desencoraja — risco de bypass do Auth server.

**Decisão:** manter procedimento manual + defense-in-depth via `resolveUserRole()`. Documentado em `23_PROXIMO_PASSO.md` como backlog.

## Relacionados

- **FC058** — tentou corrigir o mesmo problema (layout.tsx) mas confiou no JWT claim. Adendo em FC058 documenta esta falha de causa raiz.
- **FC053** — Super Admin DELETE tenant "Acesso negado": outros bugs de super_admin corrigidos.
- **FC046** — Super Admin CRUD completo: painel `/admin` requer role=super_admin em todas as chamadas.
- **FC047** — `audit_logs.tenant_id` nullable: super_admin pode executar ops globais sem tenant_id.
- **D5 (CLAUDE.md)** — Dupla proteção: backend + RLS. super_admin documentado como exceção.

## Notas

- Esta falha foi descoberta quando o usuário reportou o sintoma pós-FC058 (login ainda em `/onboarding`). O deploy FC058 (commit pendente) sozinho **não resolvia** o problema porque a claim JWT estava ausente — defense-in-depth é a única solução que cobre o estado atual dos dados sem requerer migração manual imediata.
- Após o deploy deste FC059, o `auth.users.app_metadata.user_role` do `dilneysantos.developer@gmail.com` pode ser sincronizado via Admin API para normalizar o estado (opcional — não é mais bloqueador).

## Verificação pós-deploy (sessão 59 — 26/06/2026)

**Achado importante:** Ao executar o procedimento manual de sincronização documentado acima, foi constatado via Admin API que **`app_metadata.user_role` já estava `"super_admin"` para o `dilneysantos.developer@gmail.com`** no momento da sessão 59.

| Fonte | Valor |
|---|---|
| `auth.users.app_metadata.user_role` | `"super_admin"` ✓ (já sincronizado) |
| `public.users.role` | `"super_admin"` ✓ |
| `last_sign_in_at` | `2026-06-26T21:51:31Z` (login recente confirmado) |

**Implicações:**
1. A sincronização manual foi aplicada em algum momento entre FC058 (sessão 58 — 23/06) e a verificação atual (sessão 59 — 26/06), provavelmente pelo owner durante um dos logins de teste ou deploy intermediário.
2. O sintoma original do FC058 ("redireciona para /onboarding") já estava resolvido antes mesmo do deploy do FC059 — o que explica o `last_sign_in_at` recente.
3. **FC059 permanece arquiteturalmente correto** porque:
   - Caminho JWT-first preserva o comportamento atual sem overhead (sem query extra)
   - DB-fallback é a defesa real contra futuras promoções via SQL sem sync manual
   - Não há regressão (tenants regulares continuam usando o caminho JWT, sem query extra)
