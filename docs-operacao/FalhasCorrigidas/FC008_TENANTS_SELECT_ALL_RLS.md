# FC008 — tenants_select_all — RLS policy permitia acesso cross-tenant

## Data

2026-05-23

## Severidade

ALTA

## Sintoma

Em determinadas condições, `getTenantForUser` via session client retornava `null` para usuários legítimos, enquanto o mesmo dado era acessível via service role. Usuários com tenant válido no banco não conseguiam acessar o dashboard (ver FC001 e FC003 para o loop resultante).

O problema complementar: a RLS policy `tenants_select_own` dependia de `auth_tenant_id()` que lê o JWT claim `tenant_id`. Sem o claim, **nenhum tenant** era visível ao usuário — nem o seu próprio.

## Contexto

Tabela `public.tenants` com RLS habilitado. A policy de SELECT original usava `auth_tenant_id()` diretamente (sem SELECT wrapper — ver FC007). Quando o JWT não tinha o claim, a função retornava `null`, e `tenant_id = null` nunca casava com nenhuma linha.

## Causa Raiz

**Causa 1 — RLS policy sem SELECT wrapper (performance + correctness):**
```sql
-- PROBLEMA: recalcula auth_tenant_id() para cada linha
CREATE POLICY "tenants_select_own" ON tenants
  FOR SELECT
  USING (id = auth_tenant_id());
-- auth_tenant_id() = (auth.jwt() ->> 'tenant_id')::uuid
-- Sem o SELECT wrapper, é recalculada por linha e nunca usa índice
```

**Causa 2 — JWT claim ausente faz a policy retornar false para todas as linhas:**
Se `auth_tenant_id()` retorna `null` (JWT sem claim), então `id = null` é sempre `false` no PostgreSQL. O usuário não vê nenhum tenant — nem o seu.

**Causa 3 — Sem fallback para busca por `user_id`:**
A query não tinha fallback para buscar o tenant via tabela `public.users` (que tem `user_id → tenant_id`), dependendo 100% do JWT claim.

## Arquivos Afetados

- `database/migrations/011_performance_rls_indexes.sql` — SELECT wrapper em `tenants_select_own`
- `frontend/lib/tenant.ts` — service role fallback (ver FC003)

## Banco/Migrations

### Migration 011 — Correção da policy tenants_select_own

```sql
DROP POLICY IF EXISTS "tenants_select_own" ON tenants;
CREATE POLICY "tenants_select_own" ON tenants
  FOR SELECT
  USING (id = (SELECT auth_tenant_id()));
  -- SELECT wrapper: avalia uma vez por query, permite uso de índice
```

## Correção Aplicada

**No banco:** SELECT wrapper adicionado na policy (migration 011).

**No frontend:** service role fallback em `getTenantForUser` para usuários sem JWT claim (ver FC003 para detalhes completos).

## Commit(s)

- `0b32a6dc8a7d313863ac91d412711f35936b7d0c` — fix: sync repo — migrations 011 (inclui tenants_select_own)
- `b5685c2dd396cc4a753ca07333c911b1b7c0e0c8` — fix: service role fallback in getTenantForUser

## Como Validar

```sql
-- Verificar que a policy tem o SELECT wrapper
SELECT polname, polqual
FROM pg_policies
WHERE tablename = 'tenants' AND polname = 'tenants_select_own';
-- polqual deve conter "SELECT auth_tenant_id()"

-- Verificar que usuário com JWT válido vê apenas o próprio tenant
-- (testar via Supabase Dashboard → SQL Editor → executar como usuário específico)
SELECT id, slug, name FROM tenants;
-- deve retornar apenas 1 linha (o tenant do usuário logado)
```

## Resultado Final

Policy `tenants_select_own` com SELECT wrapper. Performance melhorada (índice usado). Usuários com JWT correto veem apenas o próprio tenant. Usuários sem JWT claim: service role fallback via `getTenantForUser` resolve o acesso ao dashboard sem depender da policy.

## Risco de Regressão

**BAIXO.** A policy está correta. O risco principal é uma nova migration que recrie a policy sem o SELECT wrapper. Verificar com Supabase Advisor após qualquer migration em `tenants`.

## Prevenção Futura

1. Todo `auth.*()` ou `auth_tenant_id()` em RLS policies deve ser encapsulado em `(SELECT ...)`.
2. Nunca criar policy que dependa 100% de JWT claim sem ter um path alternativo de fallback.
3. Ver FC007 para o template correto de policies RLS.
