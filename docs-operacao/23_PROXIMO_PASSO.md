# 23 — PRÓXIMO PASSO

> Atualizado em: 25/05/2026 (sessão 3)
> Atualizar este arquivo ao final de cada sessão com o que deve ser feito na próxima.

---

## Estado Atual do Projeto

Sistema em produção com fixes de auth e onboarding deployados:

- Backend Go → `https://api.revendaclick.com.br` ✓
- Frontend Next.js → `https://app.revendaclick.com.br` ✓ (Vercel, deploy automático)
- CI/CD GitHub Actions → automático em push para `main` ✓
- Evolution API (WhatsApp) → `https://evolution.revendaclick.com.br` ✓
- Billing Asaas → assinaturas funcionando ✓
- Observabilidade → `/metrics` + BetterStack ✓
- Vercel env vars → todas configuradas (SUPABASE_URL, ANON_KEY, SERVICE_ROLE_KEY, API_URL, APP_URL) ✓
- Runbook de incidentes → `24_RUNBOOK_INCIDENTES.md` ✓ (10 cenários)

**Último commit local (a deployar):** fix updateSupabaseAppMetadata (retry 3x + logging)
**Deploy anterior:** `b5685c2` — fix: service role fallback in getTenantForUser + protocol guard

---

## Estado do Banco (23/05/2026)

| Email | auth.users | public.users | jwt_tenant_id | Situação |
|---|---|---|---|---|
| dilneysantos@gmail.com | ✓ confirmado | ✓ owner | ✓ fd1172f6 (patchado) | Deve acessar /dashboard após deploy |
| admin@staging.revendaclick.com.br | ✓ confirmado | ✓ owner | ✓ e9f92ebf (patchado) | OK |
| admin@revendaclick.staging | ✓ confirmado | ✗ | ✗ | Sem tenant (staging, irrelevante) |

**Nota:** Os usuários `desconto.do.dono@gmail.com`, `dilsant.nocode@gmail.com`, `dilneysantos.coprodutor@gmail.com`, `metodolimpezas@gmail.com` mencionados em sessões anteriores **não existem mais neste projeto Supabase** (ou foram excluídos). Apenas 3 usuários encontrados no banco.

---

## ⚠️ AÇÃO URGENTE (Primeira Coisa da Próxima Sessão)

### 1. Fazer deploy do fix de onboarding e verificar logs

```bash
# O fix já está no código — fazer commit e push
git add backend/internal/onboarding/onboarding.go backend/internal/server/server.go
git commit -m "fix: retry + logging on updateSupabaseAppMetadata in onboarding"
git push
```

Após o deploy (CI/CD automático), verificar nos logs do VPS se `updateSupabaseAppMetadata` está funcionando:

```bash
# No VPS — durante ou após um novo cadastro de teste
docker compose -f docker-compose.production.yml logs backend --tail=100 | grep -i "updateSupabase"

# Resultado esperado se OK:
# {"level":"info","msg":"updateSupabaseAppMetadata: success","user_id":"...","tenant_id":"...","attempt":1}

# Resultado se ainda falha:
# {"level":"warn","msg":"updateSupabaseAppMetadata: non-2xx response","status":401,"body":"..."}
# → Se 401: SUPABASE_SERVICE_ROLE_KEY incorreta no .env do VPS
# → Se 404: SUPABASE_URL incorreta no .env do VPS
```

### 2. Testar login em produção

```
1. Acessar https://app.revendaclick.com.br/login
2. Fazer login com dilneysantos@gmail.com
3. Deve ir para /dashboard (não mais loop /onboarding)
4. Verificar que KPIs e módulos carregam normalmente
```

**Se login ainda falhar com "Email ou senha inválidos":**
- Tentar reset de senha: Supabase Dashboard → Authentication → Users → Reset Password
- Verificar `NEXT_PUBLIC_SUPABASE_ANON_KEY` no Vercel (deve ser igual ao projeto Supabase atual)

### 3. Testar fluxo de novo cadastro

```
1. Acessar https://app.revendaclick.com.br/register
2. Criar nova conta com email novo
3. Deve ir para /onboarding (email confirmation está DESABILITADO)
4. Preencher formulário → Criar loja → deve ir para /dashboard
5. Verificar no Supabase: raw_app_meta_data tem tenant_id?
   Supabase Dashboard → Authentication → Users → selecionar usuário → Raw Metadata
```

Se `raw_app_meta_data` ainda não tiver `tenant_id`, verificar logs do VPS (passo 1 acima).

---

## Próximos Passos (por prioridade)

### 1. Testar fluxo completo auth (Alta — fazer agora)

Descrito acima na seção URGENTE.

### 2. Corrigir updateSupabaseAppMetadata no backend (Alta — se confirmado falho)

Se o teste 2 mostrar que `raw_app_meta_data` não recebe `tenant_id`:

```bash
# Verificar .env do backend no VPS
grep "SUPABASE_URL\|SUPABASE_SERVICE" /path/to/.env
```

O fix pode ser:
- Remover trailing slash de `SUPABASE_URL`
- Corrigir o `SUPABASE_SERVICE_ROLE_KEY`
- Ou tornar o `updateSupabaseAppMetadata` fatal (panic em startup se credenciais inválidas)

### 3. Verificar rotas públicas de vitrine (Média)

```
https://app.revendaclick.com.br/<slug-de-tenant>
```

Depende de `getTenantBySlug` (usa service role) — deve funcionar agora que `SUPABASE_SERVICE_ROLE_KEY` está no Vercel.

### 4. Backup S3 (Média — opcional)

```bash
# No VPS — adicionar ao .env
BACKUP_S3_BUCKET=meu-bucket-s3
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_DEFAULT_REGION=sa-east-1
```

Ver `11_DOCKER.md`.

### 5. Uptime Monitoring (Baixa)

Configurar UptimeRobot ou BetterStack Uptime para `https://api.revendaclick.com.br/health`.

### 6. Rotação de Secrets (Baixa)

Definir política semestral: `ASAAS_API_KEY`, `EVOLUTION_API_KEY`, `METRICS_TOKEN`.

### 7. Review de Indexes (Baixa)

`EXPLAIN ANALYZE` nas queries mais frequentes após 30 dias com carga real.

---

## Diagnóstico desta Sessão

**O que foi investigado:**

Bug report com 3 sintomas:
1. Novo cadastro não envia email de confirmação — vai direto para /onboarding
2. Login existente retorna "email/senha incorretos"
3. Onboarding: inputs limpam, fica na página, sem erro visível, sem redirect

**Causa raiz identificada:**

`updateSupabaseAppMetadata` (Go backend) falha silenciosamente → `raw_app_meta_data` sem `tenant_id` → JWT emitido sem claim → `getTenantForUser` (session client + RLS `auth_tenant_id()`) retorna 0 linhas → `null` → dashboard redireciona para /onboarding → loop.

**Sequência real do bug no onboarding:**
1. Usuário submete formulário → `setupTenant` server action é chamada
2. `fetch(API + '/api/onboarding/setup')` → backend cria tenant + user no DB (transação OK)
3. Backend chama `updateSupabaseAppMetadata` → **falha silenciosamente**
4. Backend retorna 201 → `setupTenant` retorna `{ data: ..., error: null }`
5. `refreshSession()` é chamado → JWT refreshado **sem** `tenant_id` (pois `app_metadata` não foi atualizado)
6. `router.push('/dashboard')` → dashboard → `getTenantForUser` → null → redirect /onboarding
7. Usuário vê form limpo — parece que "nada aconteceu"

**Sintoma 1 (sem email):** Comportamento correto — email confirmation está desabilitado no Supabase. Quando desabilitado, `signUp` retorna `data.session` imediatamente e o código faz `window.location.href = '/onboarding'`.

**Sintoma 2 (login falha):** Não totalmente investigado — pode ser senha errada ou anon key incorreto no build anterior. O novo deploy com env vars corretas deve resolver se for questão de key.

**Sintoma 3 (onboarding loop):** Causa raiz confirmada e corrigida (ver acima).

**Fixes aplicados:**
- `getTenantForUser`: session client primeiro → service role fallback (unbloqueia qualquer usuário com tenant no DB, independente do JWT)
- SQL patch: `raw_app_meta_data` corrigido retroativamente para todos os usuários com tenant sem claim
- Protocol guard: `API.startsWith('http')` garante que URL sem protocolo nunca gera TypeError

**SQL executado:**
```sql
UPDATE auth.users au
SET raw_app_meta_data = au.raw_app_meta_data 
  || jsonb_build_object('tenant_id', pu.tenant_id::text, 'user_role', pu.role)
FROM public.users pu
WHERE au.id = pu.id
  AND pu.tenant_id IS NOT NULL
  AND pu.is_active = TRUE
  AND (au.raw_app_meta_data ->> 'tenant_id') IS NULL;
-- Afetados: dilneysantos@gmail.com, admin@staging.revendaclick.com.br
```

**Commits desta sessão:**
- `1436f8a` — debug: show exact error code+message on onboarding submit failure
- `de7c02b` — fix: redirect to /onboarding immediately when email confirmation is disabled
- `4e76ced` — fix: simplify register to account-only — store config moves to /onboarding after email confirmation
- `9f3b7e0` — fix: add emailRedirectTo in signUp to route confirmation through /auth/callback
- `c3beeb6` — fix: wait for backend healthy before smoke test
- `606ebd9` — fix: remove middleware.ts (conflicted with proxy.ts in Next.js 16)
- `b5685c2` — fix: service role fallback in getTenantForUser + protocol guard on API URL

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
