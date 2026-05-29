# FC029 — Vercel build freeze: database.types.ts desatualizado bloqueou 8 deploys consecutivos

**Data:** 2026-05-28  
**Sessão:** 21  
**Severidade:** CRÍTICA — produção congelada nas sessões 16–20  
**Status:** RESOLVIDO

---

## Sintoma

Produção exibia código da sessão 15 (`c885492`). Nenhuma feature implementada nas sessões 16–20 aparecia em produção. Santos-car mostrava sidebar antiga completa. Super admin seguia layout de tenant. Labels não atualizadas.

## Causa raiz

`frontend/lib/database.types.ts` não era regenerado após as migrations 018–021. O arquivo estava gerado antes dessas migrations, portanto o TypeScript não conhecia as tabelas:
- `tenant_public_contacts` (migration 018)
- `tenant_features` (migration 020)
- `subscription_addons`, `plan_addons` (migration 021)

Qualquer arquivo que referenciasse essas tabelas (`lib/tenant.ts:332` era o primeiro) gerava erro de compilação TypeScript:

```
./lib/tenant.ts:332:11
Type error: Argument of type '"tenant_public_contacts"' is not assignable to parameter 
of type '"leads" | "tenants" | "users" | ... | "usage_snapshots"'.
```

O Vercel aborta o build no primeiro erro TypeScript — todos os 8 deploys falharam antes de gerar qualquer página.

## Diagnóstico

1. Confirmado que frontend → Vercel exclusivamente (nginx.conf sem entrada `app.`; CI/CD só builda backend)
2. Código local correto — problema era apenas tipagem
3. DB correto — santos-car=starter, devecar=pro (verificado via Supabase SQL)
4. Vercel build logs do commit `b8d2a48` confirmaram erro em `lib/tenant.ts:332`

## Correção

### Fix 1 — Regenerar `database.types.ts` (commit `f0e59c0`)

```bash
# Gerado via MCP Supabase generate_typescript_types
# Arquivo: frontend/lib/database.types.ts
# De: ~1200 linhas (antes da migration 018)
# Para: 4263 linhas (inclui todas as tabelas até migration 021)
```

### Fix 2 — Cast intermediário em `lib/tenant.ts` (commit `5eb241a`)

O novo tipo gerado expõe `tenant.theme` como `Json` (correto per DB schema: `jsonb`), conflitando com o tipo local `{ primary_color: string; font: string }`. TypeScript rejeita o cast direto.

```typescript
// Antes (linhas 116 e 136):
return data as Tenant

// Depois:
return data as unknown as Tenant
```

Sem impacto runtime — comportamento idêntico; apenas satisfaz o compilador.

## Resultado

Deploy `dpl_FySkkpdCPWXTHzYJGcwSWvLTiHPa` (commit `5eb241a`) → **READY**  
`app.revendaclick.com.br` agora executa código das sessões 16–21.

## Prevenção

**REGRA:** Após cada migration no Supabase, regenerar `frontend/lib/database.types.ts` antes de commitar código que referencie as novas tabelas.

```bash
# Comando via MCP ou CLI:
supabase gen types typescript --project-id <id> > frontend/lib/database.types.ts

# Ou via MCP:
mcp__claude_ai_Supabase__generate_typescript_types
```

Incluir regeneração dos tipos no checklist de cada migration.

## Commits

- `f0e59c0` — regenerar database.types.ts com tabelas das migrations 018–021
- `5eb241a` — tenant.ts: use unknown cast for theme Json type mismatch

## Arquivos afetados

- `frontend/lib/database.types.ts`
- `frontend/lib/tenant.ts`
