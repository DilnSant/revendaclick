# PROMPT OFICIAL DE AUDITORIA ESTRUTURAL — REVENDACLICK

Usar quando houver suspeita de divergência entre código e documentação, ou ao iniciar revisão de módulo.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OBJETIVO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Verificar integridade entre:

✓ código

✓ banco de dados

✓ documentação operacional

✓ feature flags

✓ nomenclatura

✓ multi-tenant

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PASSO 1 — AUDITORIA DE NOMENCLATURA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Verificar nos arquivos .go, .tsx, .ts, .sql, .md:

### Planos (nomes exatos no banco)

| Correto | Proibido |
|---|---|
| starter | free, basic |
| pro | professional |
| performance | premium, enterprise (como plan.name) |
| scale | enterprise (como plan.name) |

Nota: o label de UX da seção sidebar do plano `performance` é "Premium".
O banco armazena `performance` como `plan.name`.

### Add-ons (IDs exatos)

| ID | Label UX | Preço |
|---|---|---|
| user_extra | +1 Usuário | R$20/mês |
| whatsapp_automation | Central de Atendimento | R$39/mês |
| ia_recovery | IA Recovery | R$39/mês |

### Feature Flags (nomes exatos)

| Flag | Origem |
|---|---|
| has_crm | plano pro+ |
| has_api_access | plano performance+ |
| has_central_atendimento | add-on whatsapp_automation |
| has_lead_recovery | add-on ia_recovery |

### Infraestrutura

| Correto | Proibido |
|---|---|
| Vercel | Coolify (como hosting frontend) |
| proxy.ts | middleware.ts (removido) |
| docker compose | docker-compose (legado) |

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PASSO 2 — AUDITORIA DE DOCUMENTOS ESTRUTURAIS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Verificar cada documento contra o código real:

### docs-operacao/PRODUCT_ARCHITECTURE.md

* planos com nomes corretos?
* feature flags corretos?
* add-ons corretos?
* sidebar gates corretos?

### docs-operacao/DEPENDENCIES.md

* dependências externas atualizadas?
* criticidade documentada?
* fallback documentado?

### docs-operacao/ENVIRONMENTS.md

* variáveis de ambiente atualizadas?
* URLs de produção corretas?
* procedimentos de migration corretos?

### docs-operacao/17_FLUXOS_NEGOCIO.md

* proxy.ts referenciado corretamente?
* rotas atualizadas (/automations, /campaigns, /admin)?
* WhatsApp da Loja vs Central de Atendimento separados?

### docs-operacao/REFERENCE.md

* migrations numeradas corretamente?
* FCs registrados?
* tenant de referência atualizado (sandbox-revendaclick)?

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PASSO 3 — AUDITORIA DE FEATURE FLAGS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Verificar no banco:

```sql
-- Verificar função get_tenant_usage retorna todas as flags
SELECT routine_name FROM information_schema.routines
WHERE routine_name = 'get_tenant_usage';

-- Verificar flags para tenant específico
SELECT * FROM get_tenant_usage('<tenant_id>');
```

Confirmar:

✓ get_tenant_usage() usa UNION de 3 fontes:
  1. plan.features (plano ativo)
  2. tenant_features (concessão manual)
  3. active_addon.features (add-ons pagos)

✓ Resultado inclui todas as flags esperadas

### docs-operacao/features/FEATURE_FLAGS_SNAPSHOT.md

* snapshot atualizado?
* todos os add-ons documentados?
* todos os limites por plano corretos?

### docs-operacao/features/SIDEBAR_SNAPSHOT.md

* estrutura da sidebar atualizada?
* gates corretos por seção?

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PASSO 4 — AUDITORIA MULTI-TENANT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Verificar nos handlers Go e queries SQL:

✓ Todo SELECT filtra por tenant_id

✓ Todo INSERT inclui tenant_id

✓ Todo UPDATE inclui WHERE tenant_id = ?

✓ Todo DELETE inclui WHERE tenant_id = ?

✓ RLS habilitado em todas as tabelas de negócio

Verificar RLS no banco:

```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

Qualquer tabela com rowsecurity = false deve ser investigada.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PASSO 5 — AUDITORIA DE MIGRATIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Verificar:

```bash
ls database/migrations/ | sort
```

Confirmar:

✓ Numeração sequencial sem gaps

✓ database.types.ts regenerado após última migration

✓ Migrations aplicadas no Supabase confirmadas

Verificar no Supabase:

```sql
SELECT name, executed_at FROM supabase_migrations.schema_migrations
ORDER BY name DESC LIMIT 10;
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PASSO 6 — AUDITORIA DE REFERÊNCIAS OBSOLETAS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Buscar nos arquivos de código (.go, .tsx, .ts, .sql):

```bash
# Nomes de plano incorretos
grep -r "premium\|enterprise" --include="*.go" --include="*.tsx" --include="*.ts" --include="*.sql" .

# Infraestrutura obsoleta
grep -r "middleware\.ts\|Coolify\|docker-compose" --include="*.go" --include="*.tsx" --include="*.ts" .

# Tenants de teste obsoletos
grep -r "devecar" --include="*.go" --include="*.tsx" --include="*.ts" .
```

Qualquer ocorrência encontrada nos arquivos de código (não docs históricos):

CORRIGIR antes de encerrar.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PASSO 7 — RELATÓRIO DE AUDITORIA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Apresentar:

### Divergências encontradas

Lista completa com:
* arquivo
* linha
* problema
* correção aplicada

### Documentos atualizados

### Migrations verificadas

### Nomenclatura

✓ CONFORME ou lista de correções

### Multi-tenant

✓ CONFORME ou lista de riscos

### Feature flags

✓ CONFORME ou divergências

### Próxima ação recomendada

Apenas UMA — a de maior risco.
