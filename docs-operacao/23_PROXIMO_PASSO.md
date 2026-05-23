# 23 — PRÓXIMO PASSO

> Atualizado em: 23/05/2026
> Atualizar este arquivo ao final de cada sessão com o que deve ser feito na próxima.

---

## Estado Atual do Projeto

Sistema em produção com correção crítica deployed:

- Backend Go → `https://api.revendaclick.com.br` ✓
- Frontend Next.js → `https://app.revendaclick.com.br` ✓ (deploy automático via Vercel)
- CI/CD GitHub Actions → automático em push para `main` ✓
- Evolution API (WhatsApp) → `https://evolution.revendaclick.com.br` ✓
- Billing Asaas → assinaturas funcionando ✓
- Observabilidade → `/metrics` + BetterStack ✓

---

## ⚠️ AÇÃO URGENTE (Fazer Antes de Qualquer Outra Coisa)

### Configurar SUPABASE_SERVICE_ROLE_KEY no Vercel

O fix desta sessão eliminou a dependência em `SUPABASE_SERVICE_ROLE_KEY` para o caminho crítico (`getTenantForUser`). Mas outros componentes ainda usam `createServiceClient()`:

- `getTenantById` — usado em rotas públicas (vitrine de veículos)
- `getTenantBySlug` — usado em rotas públicas (vitrine de veículos)
- `getTenantUsage` — dashboard usage/plan
- Billing (`getSubscription`)

**Como configurar:**
1. Acessar [vercel.com/dashboard](https://vercel.com/dashboard)
2. Projeto `revendaclick` → Settings → Environment Variables
3. Verificar/adicionar as seguintes vars (copiar de `frontend/.env.local`):

```
NEXT_PUBLIC_SUPABASE_URL=https://ibgaywezfcbbiiziaoac.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...  (anon key do .env.local)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...      (service role key do .env.local)
NEXT_PUBLIC_API_URL=https://api.revendaclick.com.br
NEXT_PUBLIC_APP_URL=https://app.revendaclick.com.br
```

4. Após salvar → redeploy manual (ou push de qualquer commit)

### Verificar usuários travados

Após configurar o Vercel e redeploy, verificar se estes usuários conseguem acessar o dashboard:

- `dilneysantos.coprodutor@gmail.com` — sem tenant, deve conseguir completar onboarding
- `metodolimpezas@gmail.com` — sem tenant, deve conseguir completar onboarding
- `desconto.do.dono@gmail.com` — tem tenant, deve conseguir acessar /dashboard diretamente
- `dilsant.nocode@gmail.com` — tem tenant, deve conseguir acessar /dashboard diretamente

---

## Próximos Passos (por prioridade)

### 1. Testar o fluxo completo de auth pós-deploy (Alta prioridade)

Testar com cada usuário afetado:

```
1. login → /dashboard (usuários com tenant)
2. register → onboarding → dashboard (novo usuário)
3. logout → login → dashboard
4. verificar que não há mais loops /onboarding
```

### 2. Verificar rotas públicas (Média prioridade)

Testar vitrine pública após configurar `SUPABASE_SERVICE_ROLE_KEY`:

```
https://app.revendaclick.com.br/desccontocar
https://app.revendaclick.com.br/nocode-car
```

### 3. Backup S3 (Média prioridade)

O container `backup` está configurado no `docker-compose.prod.yml` mas S3 é opcional.

Para ativar:
```bash
# No VPS — adicionar ao .env
BACKUP_S3_BUCKET=meu-bucket-s3
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_DEFAULT_REGION=sa-east-1
```

Ver `11_DOCKER.md` para detalhes do container de backup.

---

### 4. Uptime Monitoring (Baixa prioridade)

Configurar monitor externo para `https://api.revendaclick.com.br/health`.

Opções gratuitas: UptimeRobot, BetterStack Uptime, Freshping.

---

### 5. Rotação de Secrets (Baixa prioridade)

Definir política semestral para rotação de:
- `ASAAS_API_KEY`
- `EVOLUTION_API_KEY`
- `METRICS_TOKEN`

---

### 6. Review de Indexes (Baixa prioridade)

Executar `EXPLAIN ANALYZE` nas queries mais frequentes após 30 dias em produção com carga real.

---

## Diagnóstico desta Sessão (para referência)

**Como confirmamos o bug via ferramentas:**
1. Supabase MCP → `SELECT auth.users JOIN public.users` → revelou 4 usuários sem tenant
2. Vercel MCP → runtime logs → `[getTenantForUser] users query error` em 100% dos requests /dashboard
3. Vercel MCP → build logs → warning "middleware deprecated, use proxy instead"
4. RLS policies → `users_select_own_tenant: WHERE tenant_id = auth_tenant_id()` confirmou que session client funciona

**Usuários no banco (estado em 23/05/2026):**
| Email | auth.users | public.users | Tenant |
|---|---|---|---|
| desconto.do.dono@gmail.com | ✓ | ✓ owner | desccontocar |
| dilsant.nocode@gmail.com | ✓ | ✓ owner | nocode-car |
| dilneysantos.coprodutor@gmail.com | ✓ | ✗ | ✗ |
| metodolimpezas@gmail.com | ✓ | ✗ | ✗ |

---

## Contexto para a Próxima Sessão

Ao iniciar uma nova sessão:

1. Ler `00_LEIA_PRIMEIRO.md` — visão geral do sistema
2. Ler `20_PENDENCIAS.md` — o que está pendente
3. Ler este arquivo (`23_PROXIMO_PASSO.md`) — o que fazer agora
4. Se for alterar banco: ver `05_SUPABASE.md` primeiro
5. Se for alterar infra: ver `10_INFRA_VPS.md` e `11_DOCKER.md`
6. Se for alterar backend: ver `04_BACKEND.md` e `08_API_ROTAS_REAIS.md`
7. Se for fazer deploy: ver `13_DEPLOY.md` e `12_CICD.md`
