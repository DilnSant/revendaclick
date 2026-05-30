# PROMPT OFICIAL DE BUG CRÍTICO — REVENDACLICK

Usar imediatamente ao identificar bug crítico, regressão, corrupção de dados ou incidente de segurança.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OBJETIVO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PARAR tudo.

Antes de qualquer correção:

✓ identificar sintoma exato

✓ identificar causa raiz

✓ avaliar impacto multi-tenant

✓ avaliar risco de dados

✓ planejar correção segura

✓ validar reversibilidade

NUNCA corrigir por tentativa e erro.

NUNCA assumir causa sem evidência.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PASSO 1 — TRIAGEM IMEDIATA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Classificar o incidente:

### Severidade

| Nível | Critério | Ação |
|---|---|---|
| CRÍTICO | dados corrompidos / cross-tenant / billing errado | PARAR deploy. Avaliar rollback |
| ALTO | feature quebrada em produção | Corrigir na sessão atual |
| MÉDIO | degradação de UX / erro não crítico | Registrar. Corrigir na próxima sessão |
| BAIXO | cosmético / texto / layout | Registrar. Corrigir quando conveniente |

### Impacto multi-tenant

Responder:

* O bug vaza dados entre tenants?
* O bug afeta billing de algum tenant?
* O bug permite acesso não autorizado?

Se SIM para qualquer item acima:

PARAR IMEDIATAMENTE.

Não corrigir até entender o impacto completo.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PASSO 2 — DIAGNÓSTICO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Coletar evidências ANTES de alterar qualquer código:

### Sintoma

* o que o usuário vê
* mensagem de erro exata
* endpoint ou página afetada
* reprodução: sempre / às vezes / em condição específica

### Logs

```bash
# Backend VPS
ssh root@2.24.67.84
docker logs rc_backend --tail 100 --since 30m

# Frontend — verificar Vercel dashboard
# https://vercel.com/dilneysantos/revendaclick

# Banco — verificar Supabase logs
# Supabase Dashboard → Logs → API / Postgres
```

### Causa raiz

Identificar:

1. arquivo responsável (path completo)
2. função responsável
3. tabela responsável (se banco)
4. migration responsável (se banco)
5. query responsável (se SQL)

Não avançar sem identificar causa raiz.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PASSO 3 — AVALIAR ROLLBACK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Antes de corrigir, avaliar:

### Rollback necessário?

Responder:

* O bug foi introduzido em migration recente?
* O bug foi introduzido em deploy recente?
* Rollback é mais seguro que correção forward?

### Se migration for a causa:

```sql
-- Verificar migrations aplicadas
SELECT name, executed_at FROM supabase_migrations.schema_migrations
ORDER BY executed_at DESC LIMIT 5;
```

Decidir: rollback via migration reversa ou corrigir forward?

### Se deploy for a causa:

```bash
# Verificar commit que causou o problema
git log --oneline -10

# Reverter para commit anterior (apenas se necessário)
git revert <hash>
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PASSO 4 — PLANO DE CORREÇÃO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Antes de alterar qualquer arquivo, apresentar:

### O que será corrigido

### Arquivo(s) afetado(s)

Paths completos.

### Tabela(s) afetada(s)

Se aplicável.

### Risco da correção

* Pode introduzir regressão?
* Afeta outros módulos?
* Requer migration?
* Requer downtime?

### Teste de validação

Como confirmar que o bug foi corrigido?

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PASSO 5 — IMPLEMENTAR CORREÇÃO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Regras obrigatórias:

✓ Alterar apenas o necessário para corrigir o bug

✓ Não refatorar código não relacionado

✓ Não adicionar features durante correção de bug

✓ Se migration necessária: numerar sequencialmente

✓ Se migration aplicada: regenerar database.types.ts

✓ Validar multi-tenant após qualquer alteração de banco

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PASSO 6 — VALIDAÇÃO PÓS-CORREÇÃO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Executar:

```bash
# TypeScript
cd frontend && npx tsc --noEmit

# Go
cd backend && go build ./... && go vet ./...

# Testes unitários
cd backend && go test ./internal/billing/... ./internal/leads/...
```

Validar no browser/API:

* O bug foi corrigido?
* Nenhuma regressão introduzida?
* Outros módulos afetados?

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PASSO 7 — REGISTRAR FC (FALHA CORRIGIDA)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Criar obrigatoriamente:

docs-operacao/FalhasCorrigidas/FCXXX_NOME_DA_FALHA.md

Onde XXX é o próximo número sequencial.

Registrar:

### Sintoma

O que o usuário via.

### Causa Raiz

* arquivo: path completo
* função: nome exato
* tabela: nome exato (se aplicável)
* migration: número (se aplicável)

### Impacto

* tenants afetados
* dados corrompidos? (SIM/NÃO)
* billing afetado? (SIM/NÃO)
* duração do incidente

### Correção

* o que foi alterado
* commit hash

### Prevenção

* como evitar recorrência
* teste adicionado? (SIM/NÃO)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PASSO 8 — DEPLOY E COMUNICAÇÃO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### Commit

```bash
git add <arquivos específicos>
git commit -m "fix: <descrição concisa do bug corrigido>"
git push origin main
```

### Deploy automático

Frontend: Vercel (automático via push para main)

Backend: CI/CD GitHub Actions → VPS self-hosted runner

Banco: migration aplicada via MCP Supabase

### Healthcheck pós-deploy

```bash
# Backend
curl https://api.revendaclick.com.br/health

# Frontend (via Vercel dashboard)
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PASSO 9 — ATUALIZAR DOCUMENTAÇÃO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Atualizar obrigatoriamente:

* docs-operacao/FalhasCorrigidas/FCXXX_NOME.md — criado no passo 7
* docs-operacao/20_PENDENCIAS.md — marcar pendência como resolvida (se aplicável)
* docs-operacao/22_HISTORICO_ALTERACOES.md — registrar incidente e correção
* docs-operacao/REFERENCE.md — adicionar FC ao índice de falhas

Após atualização: executar prompt de encerramento completo.

prompts/01_PROMPT_ENCERRAMENTO_SESSAO.md
