# FC001 — React Error #300 / Loop infinito /onboarding

## Data

2026-05-23

## Severidade

CRÍTICA

## Sintoma

Usuário faz login com credenciais corretas e é redirecionado para `/dashboard`, mas cai imediatamente em `/onboarding`. Ao completar o onboarding, sistema exibe "você já possui uma loja cadastrada" e não avança. No browser, console mostra `Minified React error #300` (Too many re-renders) em alguns navegadores, ou simplesmente loop infinito de redirecionamentos sem renderizar a página.

## Contexto

Afetou múltiplos usuários em produção após o deploy inicial:
- `desconto.do.dono@gmail.com`
- `dilsant.nocode@gmail.com`
- `dilneysantos.coprodutor@gmail.com`
- `metodolimpezas@gmail.com`

Qualquer novo usuário que completasse o onboarding enquanto o `updateSupabaseAppMetadata` falhava silenciosamente ficava preso nesse loop indefinidamente.

## Causa Raiz

`getTenantForUser` em `frontend/lib/tenant.ts` usava **embedded join PostgREST** para buscar o tenant:

```typescript
.select('tenant_id, tenants(id, slug, name, phone_whatsapp)')
```

Esse join falha silenciosamente em produção (schema cache, FK não reconhecida, ou timeout). O `if (error || ...)` captura o erro e retorna `null`. O middleware interpreta `null` como "sem tenant" e redireciona para `/onboarding`. O backend Go, consultando PostgreSQL diretamente, confirma que o tenant existe — daí a mensagem "você já possui uma loja cadastrada". O React fica em loop tentando renderizar o redirect enquanto o estado muda, gerando o Error #300.

**Causa secundária** (que amplificou o problema): `updateSupabaseAppMetadata` no backend de onboarding era `_ = h.update...` — erro completamente ignorado. Usuários cujo JWT não recebeu o claim `tenant_id` ficavam com `raw_app_meta_data` vazio, fazendo `auth_tenant_id()` retornar `null`, o que fazia o RLS bloquear qualquer consulta ao `users` via session client.

## Arquivos Afetados

- `frontend/lib/tenant.ts` — `getTenantForUser`
- `frontend/proxy.ts` (era `middleware.ts`) — lógica de redirect
- `backend/internal/onboarding/onboarding.go` — `updateSupabaseAppMetadata` silencioso

## Banco/Migrations

Nenhuma migration necessária. Patch SQL aplicado manualmente para corrigir usuários já afetados:

```sql
UPDATE auth.users au
SET raw_app_meta_data = au.raw_app_meta_data
  || jsonb_build_object('tenant_id', pu.tenant_id::text, 'user_role', pu.role)
FROM public.users pu
WHERE au.id = pu.id
  AND pu.tenant_id IS NOT NULL
  AND pu.is_active = TRUE
  AND (au.raw_app_meta_data ->> 'tenant_id') IS NULL;
```

## Correção Aplicada

**Fix 1 — getTenantForUser reescrito com duas queries explícitas (sessão 1):**

```typescript
// ANTES: embedded join que falhava silenciosamente
const { data, error } = await supabase
  .from('users')
  .select('tenant_id, tenants(id, slug, name, phone_whatsapp)')
  .eq('id', userId)
  .single()

// DEPOIS: duas queries independentes
const { data: userRow } = await supabase
  .from('users')
  .select('tenant_id')
  .eq('id', userId)
  .maybeSingle()

if (!userRow?.tenant_id) return null

const { data: tenant } = await supabase
  .from('tenants')
  .select('id, slug, name, phone_whatsapp')
  .eq('id', userRow.tenant_id)
  .maybeSingle()
```

**Fix 2 — Service role fallback (sessão 2):**

```typescript
// Se session client retornar null (JWT sem claim), tenta service role
const sessionResult = await sessionClient.from('users')...
if (sessionResult) return sessionResult

// fallback seguro — filtra por userId, não expõe cross-tenant
const serviceResult = await serviceClient.from('users')
  .select('tenant_id')
  .eq('id', userId)
  .maybeSingle()
```

**Fix 3 — updateSupabaseAppMetadata com retry (sessão 3):**

```go
// ANTES: erro ignorado
_ = h.updateSupabaseAppMetadata(ctx, userID, tenantID, role)

// DEPOIS: 3 tentativas com backoff + logging estruturado
if err := h.updateSupabaseAppMetadata(ctx, userID, tenantID, role); err != nil {
    h.logger.Error("updateSupabaseAppMetadata failed after retries", zap.Error(err))
    // não bloqueia onboarding — tenant já foi criado no banco
}
```

**Fix 4 — Renomear middleware.ts → proxy.ts:**
Next.js 16 deprecou `middleware.ts` em favor de `proxy.ts`. Coexistência dos dois causava comportamento imprevisível no roteamento.

## Commit(s)

- `ee2f87123ba95b229a781172381da8d34aaf5e6f` — fix: resolve login redirect to /onboarding for existing users
- `894021d25827cfea89a3e9ad881007436997da9b` — fix: switch getTenantForUser to session client
- `606ebd952e07f67da1e6efbf7536c21be9dfb649` — fix: remove middleware.ts
- `b5685c2dd396cc4a753ca07333c911b1b7c0e0c8` — fix: service role fallback in getTenantForUser + protocol guard
- `5f5c97f46c0b5e2bc92f612d30379b5f28d55688` — fix: retry + structured logging on updateSupabaseAppMetadata

## Como Validar

```bash
# 1. Login com usuário que tem tenant no banco
# https://app.revendaclick.com.br/login

# 2. Deve ir direto para /dashboard sem passar por /onboarding

# 3. Verificar no banco se JWT claim está presente
# Supabase SQL Editor:
SELECT au.email,
       au.raw_app_meta_data ->> 'tenant_id' AS jwt_tenant_id,
       pu.tenant_id AS db_tenant_id
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE au.email = 'email@teste.com';
-- jwt_tenant_id deve ser igual a db_tenant_id

# 4. Backend onboarding logs (se suspeitar de falha):
docker compose -f docker-compose.production.yml logs backend --tail=100 | grep "updateSupabase"
```

## Resultado Final

Todos os usuários afetados conseguem acessar o dashboard normalmente. `getTenantForUser` tem dois caminhos: session client (RLS via JWT) e fallback service role (por `userId`). `updateSupabaseAppMetadata` tenta 3 vezes com backoff de 500ms e loga o resultado.

## Risco de Regressão

**MÉDIO.** Se `SUPABASE_SERVICE_ROLE_KEY` for removida do Vercel, o fallback service role deixa de funcionar e o loop retorna para usuários sem JWT claim. Monitorar com:

```bash
# Verificar periodicamente se há usuários sem claim
SELECT count(*) FROM auth.users au
JOIN public.users pu ON au.id = pu.id
WHERE pu.tenant_id IS NOT NULL
  AND (au.raw_app_meta_data ->> 'tenant_id') IS NULL;
-- deve ser 0
```

## Prevenção Futura

1. Nunca usar embedded joins PostgREST para dados críticos de autenticação — usar queries explícitas.
2. Nunca ignorar erros de `updateSupabaseAppMetadata` com `_ =`.
3. Ao criar novo usuário, verificar imediatamente se JWT claim foi injetado (log de onboarding).
4. Manter `proxy.ts` como único arquivo de roteamento Next.js (não criar `middleware.ts` concorrente).
