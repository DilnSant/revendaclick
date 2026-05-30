# PROMPT OFICIAL DE DEPLOY — REVENDACLICK

Usar antes de qualquer deploy em produção, ou ao validar o estado do ambiente.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OBJETIVO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Garantir que o deploy em produção seja:

✓ validado antes do push

✓ monitorado durante

✓ confirmado após

✓ com rollback definido

NUNCA deployar sem validação prévia.

NUNCA assumir que o deploy funcionou sem checar o healthcheck.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PASSO 1 — PRÉ-DEPLOY: VALIDAÇÃO LOCAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Executar ANTES do push:

### Frontend

```bash
cd frontend && npx tsc --noEmit
```

Resultado esperado: zero erros.

### Backend

```bash
cd backend && go build ./... && go vet ./...
```

Resultado esperado: zero erros.

### Testes unitários

```bash
cd backend && go test ./internal/billing/... ./internal/leads/...
```

Resultado esperado: todos passando.

Se qualquer validação falhar:

PARAR. Corrigir antes do push.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PASSO 2 — PRÉ-DEPLOY: VERIFICAÇÕES OBRIGATÓRIAS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Confirmar:

✓ Nenhum arquivo .env comitado

✓ Nenhuma variável hardcoded de produção no código

✓ Variáveis com $ literal no VPS .env usam $$ (escape Docker Compose)

✓ Migration numerada sequencialmente (sem gaps)

✓ database.types.ts regenerado após última migration

✓ Nenhuma migration pendente sem aplicar

✓ Multi-tenant: tenant_id presente em todas as queries novas

✓ RLS habilitado nas tabelas novas

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PASSO 3 — DEPLOY FRONTEND (VERCEL)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

O deploy do frontend é automático via push para `main`.

```bash
git add <arquivos específicos>
git commit -m "<mensagem descritiva>"
git push origin main
```

### Monitorar deploy

Vercel Dashboard: https://vercel.com/dilneysantos/revendaclick

Aguardar status: **Ready**

### Verificar em produção

```
https://app.revendaclick.com.br/
https://app.revendaclick.com.br/santos-car (vitrine pública)
https://app.revendaclick.com.br/billing/plans
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PASSO 4 — DEPLOY BACKEND (VPS)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

O deploy do backend é via CI/CD GitHub Actions → self-hosted runner VPS.

O push para `main` dispara automaticamente o workflow.

### Monitorar CI/CD

GitHub Actions: https://github.com/dilnsant/revendaclick/actions

Aguardar jobs:
1. validate
2. build
3. push image → GHCR
4. deploy (self-hosted runner no VPS)

### Verificar no VPS

```bash
ssh root@2.24.67.84

# Status dos containers
docker compose -f /opt/revendaclick/docker-compose.production.yml ps

# Logs do backend
docker logs rc_backend --tail 50

# Healthcheck
curl http://localhost:8080/health
```

### Healthcheck externo

```bash
curl https://api.revendaclick.com.br/health
```

Resultado esperado: `{"status":"ok"}`

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PASSO 5 — DEPLOY BANCO (MIGRATIONS)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Migrations são aplicadas via MCP Supabase ou CLI.

### Via MCP (preferido em sessão Claude)

Usar: `mcp__claude_ai_Supabase__apply_migration`

Project ID: `ibgaywezfcbbiiziaoac`

### Via CLI (manual)

```bash
cd /home/dilneysantos/Projetos/revendaclick
supabase db push --linked
```

### Confirmar migration aplicada

```sql
SELECT name, executed_at
FROM supabase_migrations.schema_migrations
ORDER BY executed_at DESC LIMIT 5;
```

### Regenerar types após migration

```bash
cd frontend
npx supabase gen types typescript \
  --project-id ibgaywezfcbbiiziaoac \
  > src/types/database.types.ts
```

Confirmar: `database.types.ts` atualizado no commit.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PASSO 6 — VALIDAÇÃO PÓS-DEPLOY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Executar após deploy completo:

### Checklist mínimo

| Item | URL / Comando | Resultado esperado |
|---|---|---|
| Backend health | `curl https://api.revendaclick.com.br/health` | `{"status":"ok"}` |
| Dashboard | `https://app.revendaclick.com.br/dashboard` | Carrega sem erro |
| Vitrine pública | `https://app.revendaclick.com.br/santos-car` | Visível sem login |
| Billing plans | `https://app.revendaclick.com.br/billing/plans` | 3 planos visíveis |
| Sidebar Starter | Login santos-car | Sem seção Pro |
| Admin | Login super admin | `/admin` acessível |

### Se Evolution API foi alterada

```bash
ssh root@2.24.67.84
docker logs rc_evolution --tail 50
curl http://localhost:8080/health  # porta interna Evolution
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PASSO 7 — PLANO DE ROLLBACK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Ter pronto ANTES do deploy:

### Rollback de código

```bash
# Reverter último commit
git revert HEAD
git push origin main
# CI/CD redeploya automaticamente
```

### Rollback de container VPS

```bash
ssh root@2.24.67.84
cd /opt/revendaclick

# Listar imagens disponíveis
docker images | grep revendaclick-backend

# Rodar versão anterior
docker compose -f docker-compose.production.yml pull
docker compose -f docker-compose.production.yml up -d backend
```

### Rollback de migration

Migrations Supabase não têm rollback automático.

Se necessário: criar migration reversa numerada sequencialmente.

Exemplo: se 024_X.sql causou problema → criar 025_revert_X.sql

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PASSO 8 — REGISTRAR DEPLOY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Registrar em docs-operacao/22_HISTORICO_ALTERACOES.md:

* data e sessão
* commits e hashes
* migrations aplicadas
* resultado do healthcheck
* issues identificadas pós-deploy

Atualizar docs-operacao/23_PROXIMO_PASSO.md com estado atual.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REFERÊNCIA RÁPIDA — PRODUÇÃO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

| Serviço | URL / Endpoint |
|---|---|
| Frontend | https://app.revendaclick.com.br |
| Backend API | https://api.revendaclick.com.br |
| Backend Health | https://api.revendaclick.com.br/health |
| Evolution API | https://evolution.revendaclick.com.br |
| Supabase | https://supabase.com/dashboard/project/ibgaywezfcbbiiziaoac |
| Vercel | https://vercel.com/dilneysantos/revendaclick |
| GitHub Actions | https://github.com/dilnsant/revendaclick/actions |
| VPS | root@2.24.67.84 — /opt/revendaclick |
