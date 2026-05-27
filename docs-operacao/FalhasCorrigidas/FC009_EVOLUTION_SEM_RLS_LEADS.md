# FC009 — Evolution sem RLS / leads_public_insert sem restrição de tenant

## Data

2026-05-26

## Severidade

ALTA

## Sintoma

Não havia sintoma visível para usuários finais. O problema era de segurança: qualquer pessoa com acesso ao endpoint público `/api/public/:slug/leads` podia inserir leads em **qualquer** tenant — não apenas no tenant correto do slug.

Descoberto via Supabase Advisor (WARN: "RLS policy allows insert without tenant restriction").

## Contexto

Vitrine pública de leads: formulários de contato em páginas públicas de revendas (`/vitrine/:slug`) chamam `POST /api/public/:slug/leads` para registrar interesse em um veículo. O backend valida o slug e insere o lead com o `tenant_id` correto, mas a RLS policy do banco não validava isso — era uma segunda camada de defesa que estava ausente.

## Causa Raiz

**Policy `leads_public_insert` original:**
```sql
CREATE POLICY "leads_public_insert" ON leads
FOR INSERT TO public
WITH CHECK (true);
-- "true" = sem nenhuma restrição
-- Qualquer role (inclusive anon) pode inserir lead para qualquer tenant_id
```

A policy original permitia que qualquer chamada autenticada como `anon` inserisse uma linha em `leads` com qualquer `tenant_id` — incluindo IDs de outros tenants. O backend valida o slug, mas se alguém chamasse a API Supabase diretamente (bypassando o backend), poderia poluir dados de qualquer tenant.

**Complementar — vehicles storage policy:**
`vehicles_public_read` no storage bucket `vehicles` habilitava listagem de **todos** os arquivos do bucket via SDK do Supabase. Como o bucket é `public=true`, as URLs diretas já funcionam sem policy. A policy apenas expunha a listagem completa de arquivos de todos os tenants.

## Arquivos Afetados

- `database/migrations/013_security_leads_insert_storage_listing.sql` — policy corrigida

## Banco/Migrations

### Migration 013

```sql
-- Fix leads_public_insert — restringir por tenant ativo
DROP POLICY IF EXISTS "leads_public_insert" ON leads;
CREATE POLICY "leads_public_insert" ON leads
  FOR INSERT TO anon
  WITH CHECK (
    tenant_id IN (
      SELECT id FROM tenants WHERE is_active = TRUE
    )
  );

-- Remove storage policy desnecessária que expunha listagem de todos os arquivos
DROP POLICY IF EXISTS "vehicles_public_read" ON storage.objects;
```

**Decisão técnica D17:** `leads_public_insert` restrito a `anon` + tenant ativo. O backend Go faz o lookup do tenant por slug antes de inserir — a RLS é segunda camada de defesa.

## Correção Aplicada

Migration 013 aplicada diretamente via Supabase MCP. Arquivo criado em `database/migrations/013_security_leads_insert_storage_listing.sql`.

## Commit(s)

- `c981b0b8013740a9225a72e289b3ac8c25da9f42` — fix(security): restrict leads_public_insert to anon + fix storage listing

## Como Validar

```sql
-- 1. Verificar policy corrigida
SELECT polname, polroles, polqual, polwithcheck
FROM pg_policies
WHERE tablename = 'leads' AND polname = 'leads_public_insert';
-- polroles: {anon}
-- polwithcheck: deve referenciar tenants.is_active

-- 2. Tentar inserir lead com tenant_id inválido (deve falhar)
-- Via Supabase SQL Editor como anon:
INSERT INTO leads (tenant_id, name, phone, source)
VALUES ('00000000-0000-0000-0000-000000000000', 'Teste', '11999999999', 'whatsapp');
-- deve retornar ERROR: new row violates row-level security policy
```

```bash
# 3. Verificar que vitrine pública ainda funciona (não quebrou)
curl -s -X POST https://api.revendaclick.com.br/api/public/santos-car/leads \
  -H "Content-Type: application/json" \
  -d '{"name":"Teste","phone":"11999999999","source":"marketplace"}'
# deve retornar 201 com o lead criado
```

## Resultado Final

`leads_public_insert` restrita a `anon` + apenas para `tenants.is_active = TRUE`. Storage policy de listagem removida. Vitrine pública continua funcionando normalmente (URLs diretas de imagens funcionam pelo bucket público).

## Risco de Regressão

**BAIXO.** Policy está no banco. Risco: nova migration que recrie a policy com `WITH CHECK (true)` sem perceber.

## Prevenção Futura

1. Toda policy `FOR INSERT` em tabelas com `tenant_id` deve ter `WITH CHECK (tenant_id = ...)` ou similar.
2. Nunca usar `WITH CHECK (true)` em tabelas de negócio — sempre restringir por tenant.
3. Storage policies em buckets públicos: só criar se necessário para operações READ/WRITE protegidas. Listagem pública via policy expõe estrutura de arquivos de todos os tenants.
4. Checar Supabase Advisor após cada migration de policy.
