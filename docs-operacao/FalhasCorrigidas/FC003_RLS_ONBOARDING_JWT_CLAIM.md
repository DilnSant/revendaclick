# FC003 — RLS onboarding — JWT claim ausente / getTenantForUser retorna null

## Data

2026-05-23

## Severidade

ALTA

## Sintoma

Usuário completa o onboarding com sucesso (backend confirma criação do tenant), mas ao tentar acessar o dashboard:
- É redirecionado de volta para `/onboarding`
- Onboarding exibe "você já possui uma loja cadastrada" e não avança
- Usuário fica travado indefinidamente

## Contexto

Ocorre quando `updateSupabaseAppMetadata` falha silenciosamente durante o onboarding. O tenant é criado no banco (`public.tenants` e `public.users`), mas o JWT do usuário nunca recebe o claim `tenant_id` no `raw_app_meta_data`. Sem esse claim, a RLS policy `auth_tenant_id()` retorna `null`, bloqueando qualquer query via session client.

## Causa Raiz

`getTenantForUser` em `frontend/lib/tenant.ts` dependia **exclusivamente** do JWT claim `tenant_id` via RLS:

```sql
-- RLS policy em public.users:
auth.jwt() ->> 'tenant_id' = tenant_id::text
```

Quando o JWT não tem o claim (porque `updateSupabaseAppMetadata` falhou), `auth_tenant_id()` retorna `null`, a policy bloqueia a query, e `getTenantForUser` retorna `null`. O middleware interpreta `null` como "usuário sem tenant" e redireciona para `/onboarding`.

`updateSupabaseAppMetadata` era chamado como:
```go
_ = h.updateSupabaseAppMetadata(ctx, userID, tenantID, role)
// erro completamente ignorado — sem log, sem retry
```

Quando o Supabase Admin API retornava qualquer erro (timeout, credenciais, etc.), o claim nunca era injetado e o usuário ficava permanentemente bloqueado.

## Arquivos Afetados

- `frontend/lib/tenant.ts` — `getTenantForUser`
- `backend/internal/onboarding/onboarding.go` — `updateSupabaseAppMetadata`

## Banco/Migrations

Patch SQL para corrigir usuários já afetados (executar no Supabase SQL Editor):

```sql
-- Identificar usuários afetados
SELECT au.email,
       pu.tenant_id AS db_tenant_id,
       au.raw_app_meta_data ->> 'tenant_id' AS jwt_claim
FROM auth.users au
JOIN public.users pu ON au.id = pu.id
WHERE pu.tenant_id IS NOT NULL
  AND (au.raw_app_meta_data ->> 'tenant_id') IS NULL;

-- Corrigir: injetar claims ausentes
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

**Fix principal — service role fallback em getTenantForUser:**

```typescript
export async function getTenantForUser(userId: string): Promise<TenantData | null> {
  // Tentativa 1: session client com RLS (JWT claim necessário)
  const sessionClient = await createClient()
  const { data: sessionRow } = await sessionClient
    .from('users')
    .select('tenant_id')
    .eq('id', userId)
    .maybeSingle()

  if (sessionRow?.tenant_id) {
    // busca tenant com session client
    return await fetchTenant(sessionClient, sessionRow.tenant_id)
  }

  // Tentativa 2: service role (não depende de JWT claim — filtra por userId)
  // Seguro: userId vem do JWT verificado pelo Supabase, não do cliente
  const serviceClient = createServiceClient()
  const { data: serviceRow } = await serviceClient
    .from('users')
    .select('tenant_id')
    .eq('id', userId)  // filtra por userId, não expõe cross-tenant
    .maybeSingle()

  if (!serviceRow?.tenant_id) return null
  return await fetchTenant(serviceClient, serviceRow.tenant_id)
}
```

**Fix secundário — updateSupabaseAppMetadata com retry:**

```go
func (h *Handler) updateSupabaseAppMetadata(ctx context.Context, userID, tenantID, role string) error {
    var lastErr error
    for attempt := 0; attempt < 3; attempt++ {
        if attempt > 0 {
            time.Sleep(500 * time.Millisecond)
        }
        err := h.doUpdateMetadata(ctx, userID, tenantID, role)
        if err == nil {
            h.logger.Info("updateSupabaseAppMetadata ok", zap.String("userID", userID))
            return nil
        }
        lastErr = err
        h.logger.Warn("updateSupabaseAppMetadata attempt failed",
            zap.Int("attempt", attempt+1), zap.Error(err))
    }
    h.logger.Error("updateSupabaseAppMetadata failed after 3 attempts", zap.Error(lastErr))
    return lastErr
}
```

## Commit(s)

- `b5685c2dd396cc4a753ca07333c911b1b7c0e0c8` — fix: service role fallback in getTenantForUser + protocol guard
- `5f5c97f46c0b5e2bc92f612d30379b5f28d55688` — fix: retry + structured logging on updateSupabaseAppMetadata

## Como Validar

```bash
# 1. Verificar no banco se há usuários sem JWT claim
# Supabase SQL Editor:
SELECT count(*) FROM auth.users au
JOIN public.users pu ON au.id = pu.id
WHERE pu.tenant_id IS NOT NULL
  AND (au.raw_app_meta_data ->> 'tenant_id') IS NULL;
# deve ser 0

# 2. Simular falha de metadata e verificar se fallback funciona:
# Fazer login com usuário que tem tenant no banco
# Dashboard deve carregar mesmo com JWT sem claim (service role fallback)

# 3. Verificar logs de onboarding:
docker compose -f docker-compose.production.yml logs backend | grep "updateSupabase"
# deve mostrar "updateSupabaseAppMetadata ok" para cada novo onboarding
```

## Resultado Final

Usuários com tenant no banco sempre acessam o dashboard, independente do estado do JWT claim. `updateSupabaseAppMetadata` tenta 3 vezes e loga cada tentativa.

## Risco de Regressão

**MÉDIO.** O fallback depende de `SUPABASE_SERVICE_ROLE_KEY` estar configurada no Vercel. Se for removida, o fallback para e usuários sem JWT claim voltam a ter loop.

Também: se a query de `users` via service role for restrita por RLS com `SECURITY DEFINER`, o fallback pode parar de funcionar. Verificar ao aplicar novas migrations de segurança.

## Prevenção Futura

1. Nunca ignorar erros de `updateSupabaseAppMetadata` com `_ =`.
2. Monitorar periodicamente a query de verificação de claims ausentes.
3. Ao criar usuário via onboarding, verificar imediatamente nos logs se `updateSupabaseAppMetadata ok` apareceu.
4. Manter `SUPABASE_SERVICE_ROLE_KEY` no Vercel — é crítica para o fallback.
