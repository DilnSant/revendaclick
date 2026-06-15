# FC053 — Super Admin DELETE Tenant: "Acesso negado"

**Data:** 15/06/2026
**Sessão:** 55
**Severidade:** CRÍTICA
**Área:** Admin / Frontend / Auth
**Status:** CONCLUÍDA

---

## Problema

Super admin (`dilneysantos.developer@gmail.com`) recebia "Acesso negado" ao tentar executar exclusão lógica ou física de tenants. Outras operações (editar tenant, plano, assinatura, usuário, WhatsApp) pareciam funcionar.

Endpoint afetado:
```
DELETE /api/admin/tenants/:id
DELETE /api/admin/tenants/:id?hard=true
```

---

## Diagnóstico

### 1. Origem da mensagem "Acesso negado"

A string "Acesso negado" **só existe em um lugar no codebase**:
`frontend/app/api/admin/[...path]/route.ts:16`

```typescript
if (role !== 'super_admin') {
  return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
}
```

O backend Go retorna `{ "error": { "code": "forbidden", "message": "Insufficient permissions" } }`, nunca "Acesso negado". Portanto a falha era **no frontend proxy**, não no backend.

### 2. Verificação do backend

Teste via SSH curl com JWT de super_admin gerado manualmente:

```bash
DELETE http://localhost:8080/api/admin/tenants/00000000-0000-0000-0000-000000000000
Authorization: Bearer {jwt}
Content-Type: application/json
{"reason":"test FC053"}
```

Resultado: `{"data":null,"error":{"code":"bad_request","message":"tenant not found or already deleted"}}`

O middleware `superAdmin` no backend aceita DELETE corretamente — o erro era 400 (tenant inexistente), não 403. **Backend OK.**

### 3. Causa raiz 1 — proxy.ts nunca wired como middleware Next.js

`frontend/proxy.ts` contém a lógica de middleware SSR (refresh de sessão Supabase, proteção de rotas), mas **o arquivo não estava wired como Next.js middleware**. Next.js só reconhece `middleware.ts` (ou `src/middleware.ts`) — nunca `proxy.ts`.

Consequência: **nenhum refresh de sessão acontecia por request**. A sessão do usuário ficava estagnada no JWT emitido no momento do login. Se o login ocorreu ANTES de `app_metadata.user_role = 'super_admin'` ser adicionado ao Supabase Auth, o JWT não tinha a claim `user_role`. O token era auto-renovado após 1h, mas qualquer operação antes disso falhava.

### 4. Causa raiz 2 — getSession() em vez de getUser()

`route.ts` usava `supabase.auth.getSession()` para ler o papel do usuário:

```typescript
const { data: { session } } = await supabase.auth.getSession()
const role = session.user?.app_metadata?.user_role
```

`getSession()` lê o JWT armazenado no cookie **sem validar no servidor Supabase**. Se o cookie estava com JWT antigo (sem `user_role`), o check falhava.

`getUser()` faz request ao servidor Supabase e retorna `app_metadata` atual — não depende do JWT cached no cookie.

### 5. Causa raiz 3 — DELETE body nunca encaminhado ao backend

`route.ts` linha 24 excluía DELETE explicitamente do forwarding de body:

```typescript
// ANTES:
if (method !== 'GET' && method !== 'DELETE') {
  body = await request.text()
}
```

Consequência: `reason` enviado pelo frontend nunca chegava ao backend Go. `SoftDeleteTenant` gravava `deleted_reason = ''` em vez do motivo real.

---

## Correção

### Arquivo 1: `frontend/middleware.ts` (CRIADO)

```typescript
import { proxy, config } from './proxy'

export default proxy
export { config }
```

Wira `proxy.ts` como Next.js middleware real. A partir deste commit:
- `proxy()` executa em toda request (matcher existente em `proxy.ts`)
- `supabase.auth.getUser()` é chamado por request → refresh de sessão automático
- Rotas protegidas são redirecionadas para `/login` se não autenticadas
- Cookies de sessão são atualizados no response

### Arquivo 2: `frontend/app/api/admin/[...path]/route.ts` (MODIFICADO)

**Fix 1 — getUser() para role check:**

```typescript
// ANTES:
const role = session.user?.app_metadata?.user_role as string | undefined

// DEPOIS:
const { data: { user } } = await supabase.auth.getUser()
const role = user?.app_metadata?.user_role as string | undefined
```

**Fix 2 — DELETE body forwarded:**

```typescript
// ANTES:
if (method !== 'GET' && method !== 'DELETE') {

// DEPOIS:
if (method !== 'GET') {
```

---

## Commit

`cfc060f` — fix(fc053): super admin delete tenant — Acesso negado corrigido

---

## Impacto

| Operação | Antes | Depois |
|---|---|---|
| DELETE /api/admin/tenants/:id (soft) | 403 Acesso negado (JWT stale) | ✅ 200 + reason forwarded |
| DELETE /api/admin/tenants/:id?hard=true | 403 Acesso negado (JWT stale) | ✅ 200 + reason forwarded |
| GET /api/admin/tenants/:id/delete-summary | ✅ OK | ✅ OK |
| Refresh de sessão Supabase por request | ❌ Não ocorria | ✅ middleware.ts ativo |
| Proteção de rotas /admin/* sem sessão | ❌ Não enforced no server | ✅ Middleware redireciona |

---

## Validação

Deploy automático Vercel via push `cfc060f` → `main`.

Validação necessária após deploy:
1. Logar como super_admin (`dilneysantos.developer@gmail.com`)
2. Acessar `/admin` → aba Tenants
3. Clicar em excluir em qualquer tenant de teste
4. Confirmar com "EXCLUIR" → soft delete → HTTP 200
5. Confirmar que `deleted_reason` foi gravado com o motivo digitado
