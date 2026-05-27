# FC007 — Security Advisor / RLS — 3 warnings críticos no Supabase

## Data

2026-05-26

## Severidade

ALTA

## Sintoma

Supabase Advisor (Dashboard → Database → Advisors) exibia 3 warnings de nível `WARN`:

1. **RLS performance:** Funções `auth.*()` chamadas diretamente em políticas RLS sem wrap em `SELECT` — causa full table scan em todas as queries de tabelas protegidas.
2. **Security definer functions:** `complete_sale()`, `get_tenant_invoices()`, `get_tenant_usage()` com `SECURITY DEFINER` acessíveis a `anon` e `authenticated` — exposição de dados sensíveis.
3. **leads_public_insert policy:** `FOR ALL ROLES WITH CHECK (true)` — qualquer role podia inserir leads para qualquer tenant sem restrição.

## Contexto

Detectado durante auditoria de segurança na sessão 6. Além dos advisors, havia uma política de storage que habilitava listagem pública de todos os arquivos de veículos.

## Causa Raiz

### Warning 1 — RLS sem SELECT wrapper
Políticas RLS usavam `auth.jwt()`, `auth.uid()` diretamente:
```sql
-- RUIM: re-executa a função para cada linha
WHERE tenant_id = (auth.jwt() ->> 'tenant_id')::uuid

-- CORRETO: executa uma vez, usa o resultado
WHERE tenant_id = (SELECT (auth.jwt() ->> 'tenant_id')::uuid)
```
Sem o `SELECT` wrapper, o PostgreSQL recalcula a expressão para cada linha da tabela, impossibilitando uso de índices e causando full table scan em tabelas grandes.

### Warning 2 — SECURITY DEFINER functions acessíveis publicamente
`complete_sale()`, `get_tenant_invoices()`, `get_tenant_usage()` foram criadas com `SECURITY DEFINER` e tinham `EXECUTE` concedido a `PUBLIC` (o default do PostgreSQL). Isso significa que roles `anon` e `authenticated` podiam chamar essas funções e executar queries com permissões do `owner` (geralmente `postgres`).

### Warning 3 — leads_public_insert sem restrição de tenant
```sql
-- RUIM: qualquer anon pode inserir lead para qualquer tenant_id
CREATE POLICY "leads_public_insert" ON leads
FOR INSERT TO public
WITH CHECK (true);

-- CORRETO: apenas para tenants ativos
CREATE POLICY "leads_public_insert" ON leads
FOR INSERT TO anon
WITH CHECK (tenant_id IN (SELECT id FROM tenants WHERE is_active = TRUE));
```

### Bônus — storage policy expunha listagem
`vehicles_public_read` no storage habilitava listagem SDK de todos os arquivos do bucket via API. O bucket é `public=true`, então URLs diretas já funcionam sem policy — a policy era desnecessária e criava superfície de ataque.

## Arquivos Afetados

- `database/migrations/011_performance_rls_indexes.sql` — SELECT wrapper em todas as policies RLS
- `database/migrations/012_fix_security_definer_revoke.sql` — REVOKE das funções SECURITY DEFINER
- `database/migrations/013_security_leads_insert_storage_listing.sql` — leads_public_insert + storage

## Banco/Migrations

### Migration 011 — SELECT wrapper em RLS + 14 indexes

```sql
-- Exemplo da correção de RLS performance:
DROP POLICY IF EXISTS "leads_select_tenant" ON leads;
CREATE POLICY "leads_select_tenant" ON leads
  FOR SELECT
  USING (tenant_id = (SELECT (auth.jwt() ->> 'tenant_id')::uuid));
-- O SELECT wrapper garante que auth.jwt() é avaliado uma vez por query
```

### Migration 012 — REVOKE SECURITY DEFINER

```sql
REVOKE EXECUTE ON FUNCTION complete_sale(uuid, uuid, text, numeric, numeric, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION complete_sale(uuid, uuid, text, numeric, numeric, text)
  TO service_role;

REVOKE EXECUTE ON FUNCTION get_tenant_invoices(uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION get_tenant_invoices(uuid)
  TO service_role;

REVOKE EXECUTE ON FUNCTION get_tenant_usage(uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION get_tenant_usage(uuid)
  TO service_role;
```

### Migration 013 — leads_public_insert + storage

```sql
-- Fix leads_public_insert
DROP POLICY IF EXISTS "leads_public_insert" ON leads;
CREATE POLICY "leads_public_insert" ON leads
  FOR INSERT TO anon
  WITH CHECK (
    tenant_id IN (SELECT id FROM tenants WHERE is_active = TRUE)
  );

-- Remove storage policy desnecessária
DROP POLICY IF EXISTS "vehicles_public_read" ON storage.objects;
```

## Correção Aplicada

Três migrations aplicadas via Supabase MCP (`apply_migration`) + arquivos criados no repositório para rastreamento git.

## Commit(s)

- `0b32a6dc8a7d313863ac91d412711f35936b7d0c` — fix: sync repo — analytics, infra, migrations 011/012
- `c981b0b8013740a9225a72e289b3ac8c25da9f42` — fix(security): restrict leads_public_insert + storage

## Como Validar

```bash
# 1. Verificar Supabase Advisor
# Supabase Dashboard → Database → Advisors → deve estar limpo (0 WARN)

# 2. Verificar que leads_public_insert restringe por tenant
# Supabase SQL Editor:
SELECT polname, polroles, polqual FROM pg_policies
WHERE tablename = 'leads' AND polname = 'leads_public_insert';
-- polroles deve incluir apenas {anon}
-- polqual deve referenciar tenants.is_active

# 3. Verificar REVOKE das funções
SELECT routine_name, grantee, privilege_type
FROM information_schema.role_routine_grants
WHERE routine_name IN ('complete_sale', 'get_tenant_invoices', 'get_tenant_usage')
  AND grantee IN ('anon', 'authenticated', 'public');
-- deve retornar 0 linhas
```

## Resultado Final

Supabase Advisor: 0 warnings após as 3 migrations. Policies RLS com SELECT wrapper (melhor performance). Functions SECURITY DEFINER acessíveis apenas pelo service_role. leads_public_insert restrita a tenants ativos.

## Risco de Regressão

**MÉDIO.**

1. **Novas funções SECURITY DEFINER:** PostgreSQL concede `EXECUTE` a `PUBLIC` por padrão. Sempre incluir `REVOKE` nas migrations de novas funções SECURITY DEFINER.
2. **Novas policies RLS:** Verificar se usam `SELECT` wrapper. Supabase Advisor detecta o problema automaticamente.
3. **Bucket de storage:** Nunca criar policies de listagem em buckets públicos — URLs diretas já funcionam.

## Prevenção Futura

1. Após cada migration: rodar `SELECT * FROM pg_policies WHERE ...` para verificar novas policies.
2. Toda nova função SECURITY DEFINER deve ter `REVOKE ... FROM PUBLIC, anon, authenticated` + `GRANT ... TO service_role`.
3. Checar Supabase Advisor mensalmente ou após cada conjunto de migrations.
4. Template obrigatório para functions SECURITY DEFINER:
```sql
CREATE OR REPLACE FUNCTION nome_funcao(...)
RETURNS tipo
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$ ... $$;

REVOKE EXECUTE ON FUNCTION nome_funcao FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION nome_funcao TO service_role;
```
