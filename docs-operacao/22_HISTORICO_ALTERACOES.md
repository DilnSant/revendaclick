# 22 — HISTÓRICO DE ALTERAÇÕES

> Registrar toda alteração significativa feita em cada sessão de trabalho.
> Formato: data + o que mudou + por quê + arquivos afetados.

---

## Como Usar

No **início** de cada sessão: ler este arquivo para entender o estado atual.
No **fim** de cada sessão: adicionar uma entrada com as alterações feitas.

---

## 2026-05-26 (sessão 8) — Validação e desbloqueio do billing Asaas

**O que foi feito:**

### Diagnóstico e resolução da cadeia de bloqueios do billing

O billing estava bloqueado por 3 problemas em cascata, resolvidos em sequência:

**Problema 1 — Whitelist Asaas aplicada no ambiente errado (sandbox)**
- Sintoma: `not_allowed_ip` em `POST /api/billing/subscribe`
- Causa: Usuário havia aplicado o whitelist do IP `2.24.67.84` em `sandbox.asaas.com`, mas o backend usa `www.asaas.com` (production — `ASAAS_ENV` não definido no `.env` → padrão `production` via docker-compose `${ASAAS_ENV:-production}`)
- Diagnóstico: `curl ifconfig.me` dentro do container → `2.24.67.84`; `grep ASAAS_ENV /opt/revendaclick/.env` → vazio (production); `curl -v www.asaas.com` com chave inválida → 401 (não 403) confirmando que IP check é por-account, não global
- Fix: Whitelist `2.24.67.84` adicionado em `www.asaas.com` (production Asaas)

**Problema 2 — API key com `$$` no `.env` (Docker Compose double-interpolation)**
- Sintoma: Após whitelist corrigido → `asaas HTTP 401` (auth failure)
- Causa: `ASAAS_API_KEY=$$aact_prod_...` no `.env` do VPS. Docker Compose faz dupla interpolação: lê `$$aact_prod_...` do `.env`, substitui `${ASAAS_API_KEY}` no compose → o resultado `$$aact_prod_...` é processado novamente como variável `$aact_prod_...` → não encontrada → **container recebe key vazia**. O `$$` no `.env` é o escape correto para Docker Compose produzir um `$` literal no container.
- Diagnóstico: `docker compose up -d backend` logava `WARN: The "aact_prod_000M..." variable is not set. Defaulting to a blank string.` — a chave inteira era tratada como nome de variável
- Fix tentado e revertido: `sed` que removeu o `$$` quebrou o escaping. Restaurado com `sed -i 's/^ASAAS_API_KEY=\$/ASAAS_API_KEY=\$\$/' /opt/revendaclick/.env` + restart backend
- Evidência de resolução: warning sumiu nos logs, backend logou `asaas configured, env: production`

**Problema 3 — `UpdateSubscriptionAsaas`: `$2` nunca usado, `tenantID` duplicado nos args**
- Sintoma: `update subscription: unused argument: 1` (pgx)
- Causa: Query SQL usava `$1, $3, $4, $5, $6` (pulava `$2`), mas args passavam `tenantID` duas vezes: `tenantID, tenantID, planID, asaasSubID, paymentLink, cycle`. O pgx rejeita quando um argumento (índice 1 = segundo) não é referenciado na query.
- Fix: Removido `tenantID` duplicado; placeholders renumerados para `$1–$5` sequenciais
- Arquivo: `backend/internal/billing/repository.go`
- Commit: `71d6ba6`

### Estado do billing após correções

- Customer Asaas criado com CPF ✓ (`cus_000178453189` no tenant de teste)
- Subscription: SQL bug fixado e deployado; confirmação end-to-end pendente (token do teste expirou)
- Webhook, trial→active, upgrade, cancel, reactivate: pendentes

### Arquivos alterados

- `backend/internal/billing/repository.go` — fix `UpdateSubscriptionAsaas` SQL args (commit `71d6ba6`)
- `/opt/revendaclick/.env` no VPS — restaurado `$$` na `ASAAS_API_KEY` (Docker Compose escape)

### Comandos executados no VPS

```bash
# Diagnóstico de IP
docker compose -f docker-compose.production.yml exec backend wget -qO- ifconfig.me
grep ASAAS_ENV /opt/revendaclick/.env
curl -v --max-time 5 https://www.asaas.com/api/v3/customers?limit=1 -H "access_token: invalida"

# Fix da API key (restaurar $$ correto)
sed -i 's/^ASAAS_API_KEY=\$/ASAAS_API_KEY=\$\$/' /opt/revendaclick/.env
docker compose -f docker-compose.production.yml up -d backend
docker compose -f docker-compose.production.yml logs backend --tail=5
```

### Commits desta sessão

- `71d6ba6` — fix: billing subscribe — remove duplicate tenantID arg in UpdateSubscriptionAsaas

---

## 2026-05-26 (sessão 7) — Validação de produção completa + fix lead source + fix nil slice

**O que foi feito:**

### Testes de produção executados (smoke test + CRUD completo)

**Infraestrutura: 22/22 PASS**
- TLS válido 76 dias em ambos os domínios ✓
- Backend `/health` → `{status:ok, db:ok}` ✓
- Frontend `https://app.revendaclick.com.br` → 200 ✓
- Evolution API → 200 ✓
- Auth enforcement (401 sem JWT) ✓
- Rate limiting via X-Request-ID ✓
- Nginx cache `/api/public/*` → HIT ✓
- Webhook Asaas rejeitando sem token → 401 ✓
- Metrics bloqueado por nginx → 403 ✓
- SSL/TLS em api + evolution ✓

**Auth/Login:**
- Supabase auth API: erro 400 com `invalid_credentials` para credenciais inválidas ✓
- Signup → Onboarding → JWT com `app_metadata.tenant_id` ✓
- Backend lê JWT de `app_metadata` (não top-level) — correto ✓
- Estado banco: 6 tenants ativos, todos com `jwt_tenant_id` correto ✓

**CRUDs testados com usuário de teste real:**
- Lead CREATE(✓), GET(✓), UPDATE(✓), ADD Activity(✓), DELETE(✓)
- Customer CREATE(✓), GET(✓), UPDATE(✓), DELETE(✓)
- Vehicle CREATE(✓), GET(✓), UPDATE(✓), DELETE(✓)
- Public API `/api/public/:slug/leads` (anon) ✓
- Public API `/api/public/:slug/vehicles` ✓
- Sales list ✓, Financial entries ✓
- Analytics bloqueado por plan gate (starter) — correto ✓
- Vendors: GET `/api/users` ✓, invite via `POST /api/users` requer UUID Supabase ✓
- Audit log ✓

### Bugs encontrados e corrigidos

**Bug A: Lead CREATE com `source` inválido → `internal_error` opaco**
- Causa: `source: "manual"` não existe no enum `lead_source` → pgx DB error → `internal_error`
- Fix: Adicionado `validLeadSources` map + validação em `CreateRequest.Validate()`
- Enum válido: `marketplace`, `whatsapp`, `referral`, `direct`, `social`, `other`
- Arquivo: `backend/internal/leads/model.go`

**Bug B: Listas vazias retornam `null` em vez de `[]`**
- Causa: `var list []*T` nil em Go serializa como `null` com `json:"data,omitempty"`
- Fix: `response.normalizeSlice()` converte nil slices para `make([]T, 0)` via reflect
- Removido `omitempty` de `Envelope.Data` para garantir `data` sempre presente
- Frontend já usa `json.data ?? []` — seguro
- Arquivo: `backend/internal/response/response.go`

### Riscos identificados (não corrigidos — exigem decisão)

**CRÍTICO: Trials expiram em 4 dias**
- `santos-car` (dilneysantos@gmail.com): trial_ends_at = 2026-05-31
- `devecar` (dilneysantos.developer@gmail.com): trial_ends_at = 2026-05-31
- `testecar`, `teste-02`, `teste03`: trial_ends_at = 2026-06-01
- Impacto: sem Asaas whitelist, usuários não podem assinar; `SubscriptionGate` checa apenas `status` (não `trial_ends_at`) → acesso continua mesmo expirado
- Ação: resolver Asaas whitelist ANTES de 2026-05-31

**staging-admin**: trial expirado em 2026-05-20 — conta de staging, sem impacto real

**Arquivos alterados:**
- `backend/internal/leads/model.go` — source validation
- `backend/internal/response/response.go` — normalizeSlice + remove omitempty

**Commits:**
- `43c65ee` — fix: lead source validation + nil slice → [] in API responses

---

## 2026-05-26 (sessão 6) — Fix analytics, nginx, segurança Supabase, infra, smoke test

**O que foi feito:**

### 1. Fix analytics revenue zerado (`backend/internal/analytics/repository.go`)
- **Causa raiz:** Duas queries SQL usavam colunas inexistentes: `final_value` (não existe em `sales`) e `completed_at` (não existe — coluna correta é `sold_at`).
- **Fix:** `final_value` → `sale_price`; `completed_at` → `sold_at`. Confirmado via Supabase MCP (`\d sales`).
- **Impacto:** Analytics retornava receita R$0 para todos os tenants silenciosamente.

### 2. Fix nginx webhook rate limiting silencioso (`nginx.conf`)
- **Causa raiz:** `location ~ ^/api/v1/webhooks/` nunca casava com as rotas reais `/api/webhooks/evolution` e `/api/webhooks/asaas` (sem "v1"). Os webhooks recebiam o `api_limit` geral (30rps) em vez do `webhook_limit` restrito (5rps/burst=10).
- **Fix:** `^/api/v1/webhooks/` → `^/api/webhooks/`. Comentário com rotas adicionado.

### 3. Migrations 011 e 012 rastreadas no git
- **Migration 011** (`database/migrations/011_performance_rls_indexes.sql`): Já estava aplicada no Supabase (`20260526145045`) mas sem arquivo local. Criado. Contém 14 indexes de performance + otimização de políticas RLS (wrap `auth.function()` em `SELECT`).
- **Migration 012** (`database/migrations/012_fix_security_definer_revoke.sql`): Recuperada do `supabase_migrations.schema_migrations`. REVOKE de `complete_sale()`, `get_tenant_invoices()`, `get_tenant_usage()` de PUBLIC/anon/authenticated; GRANT só para service_role.

### 4. Migration 013 aplicada (segurança)
- **`leads_public_insert`:** Era `FOR ALL ROLES WITH CHECK (true)` — qualquer role podia inserir leads para qualquer tenant. Fixado para `TO anon WITH CHECK (tenant_id IN (SELECT id FROM tenants WHERE is_active = TRUE))`.
- **`vehicles_public_read` (storage):** Política removida. Bucket é `public=true` — URLs diretas funcionam sem policy. A policy habilitava listagem SDK de todos os arquivos do bucket.
- Aplicado diretamente via Supabase MCP antes de criar o arquivo local.
- Resolve 2 advisors de nível WARN no Supabase Advisor.

### 5. Infra: Docker Compose melhorias (`docker-compose.production.yml`)
- Redis healthcheck adicionado: `test: ["CMD", "redis-cli", "ping"]`
- Evolution agora aguarda Redis healthy antes de iniciar (`depends_on: redis: condition: service_healthy`)
- `BETTER_STACK_SOURCE_TOKEN` adicionado ao backend (estava faltando para BetterStack log ingestion)
- Backup scheduler reescrito em bash puro (eliminada dependência de `python3` que não existe no `alpine` base image)
- Variáveis S3 adicionadas ao serviço backup: `BACKUP_S3_BUCKET`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_DEFAULT_REGION`

### 6. Backup UTC + S3 (`backup.sh`)
- `date` → `date -u` (timestamp UTC consistente)
- Bloco S3 upload opcional: se `BACKUP_S3_BUCKET` definido, instala `aws-cli` via `apk add` e faz upload

### 7. Smoke test: Frontend adicionado (`scripts/smoke-test.sh`)
- Seção #11 adicionada: testa `https://app.revendaclick.com.br` e `https://revendaclick.com.br`
- Também testa `/api/health` no frontend Next.js

### Decisões técnicas registradas
- D16: `public_vehicle_listings` mantém SECURITY DEFINER (converter exporia emails de tenants via PostgREST)
- D17: `leads_public_insert` restrito a anon + tenant ativo

**Arquivos alterados:**
- `backend/internal/analytics/repository.go` — `final_value`→`sale_price`, `completed_at`→`sold_at`
- `nginx.conf` — `^/api/v1/webhooks/` → `^/api/webhooks/`
- `database/migrations/011_performance_rls_indexes.sql` — criado (rastreamento git)
- `database/migrations/012_fix_security_definer_revoke.sql` — criado (recuperado do Supabase)
- `database/migrations/013_security_leads_insert_storage_listing.sql` — criado + aplicado
- `docker-compose.production.yml` — Redis healthcheck, Evolution depends_on, backup scheduler, BETTER_STACK_SOURCE_TOKEN
- `backup.sh` — UTC timestamps, S3 upload block
- `scripts/smoke-test.sh` — check #11 frontend

**Commits desta sessão:**
- `0b32a6d` — analytics fix + migrations 011/012 + infra improvements
- `39b5a38` — nginx webhook location bug fix
- `c981b0b` — security migration 013 (leads_public_insert + storage listing)

---

## 2026-05-25 (sessão 5) — Auditoria completa docs-operacao + sync documentação ↔ código

**O que foi feito:**

### Auditoria
- Leitura integral de todos os 25 arquivos de `docs-operacao/` (00 a 24 + README)
- Identificadas divergências entre documentação e código introduzidas pelo commit `d17025e`

### Divergências identificadas e corrigidas

**1. Evolution memory limit:** Documentação dizia `512m`; código (`docker-compose.production.yml` linha 117) tem `768m`. Corrigido em `11_DOCKER.md` e `16_EVOLUTION.md`.

**2. Redis adicionado ao stack de produção:** Commit `d17025e` adicionou serviço `redis:7-alpine` (`rc_redis`) ao `docker-compose.production.yml`. Não estava documentado em lugar algum. Corrigido em `11_DOCKER.md`, `16_EVOLUTION.md`, `21_DECISOES_TECNICAS.md` (nova decisão D15).

**3. NODE_OPTIONS na Evolution:** `NODE_OPTIONS: "--max-old-space-size=400"` adicionado ao container Evolution. Não documentado. Corrigido em `16_EVOLUTION.md`.

**4. Runbook I3:** Texto "se memory > 512m: aumentar para 768m" ficou obsoleto (768m já é o valor atual). Corrigido para "se > 768m: aumentar para 1024m".

**5. Risco R13:** Severidade/mitigação atualizados para refletir 768m + NODE_OPTIONS + Redis.

### Sem alterações de código
Nenhum arquivo de código foi alterado nesta sessão. Apenas sincronização de documentação.

**Arquivos alterados:**
- `docs-operacao/11_DOCKER.md` — Evolution 512m→768m; seção Redis adicionada
- `docs-operacao/16_EVOLUTION.md` — 512m→768m; NODE_OPTIONS; Redis documentados
- `docs-operacao/19_RISCOS.md` — R13 atualizado (768m + mitigações)
- `docs-operacao/20_PENDENCIAS.md` — Evolution OOM CONCLUÍDA; sync docs CONCLUÍDA; diagnóstico VPS atualizado
- `docs-operacao/21_DECISOES_TECNICAS.md` — D15 adicionada (Redis para Evolution)
- `docs-operacao/22_HISTORICO_ALTERACOES.md` — este registro
- `docs-operacao/23_PROXIMO_PASSO.md` — próximos passos atualizados
- `docs-operacao/24_RUNBOOK_INCIDENTES.md` — I3 atualizado (512m→768m→1024m)

**Commits desta sessão:** nenhum (somente docs — a commitar)

---

## 2026-05-25 (sessão 4) — Fix 6 bugs críticos de produção: vendedores, billing, WhatsApp, settings/plan, settings/users

**O que foi feito:**

### BUG 1 — Vendedores: "Error sending invite email" + UX
- **Causa raiz:** `inviteUserByEmail` depende de SMTP do Supabase (rate limit severo no free tier). Gerava erro "Error sending invite email" sempre que o limite era atingido.
- **Fix:** Trocado `inviteUserByEmail` → `generateLink({ type: 'invite' })`. Gera URL de convite sem enviar email. Admin compartilha o link manualmente (WhatsApp, SMS, etc.).
- **UX:** Botão "Convidar membro" → "Novo vendedor". Modal título atualizado. Role Admin removido do dropdown (só Vendedor e Visualizador). Sucesso mostra o link copiável.
- Cleanup automático do auth user se o backend falhar ao registrar o usuário.

### BUG 2 — Billing: 403 not_allowed_ip
- **Causa raiz:** IP do VPS não whitelisted na API Asaas (sandbox ou produção).
- **Fix código:** `asaasUserErr()` em `billing/service.go` detecta `not_allowed_ip` e retorna mensagem amigável ao usuário em vez do erro raw do Asaas.
- **Fix configuração (requer ação manual):** Ver "AÇÃO URGENTE" em `23_PROXIMO_PASSO.md`.

### BUG 3 — WhatsApp: botões sem efeito visível
- **Causa raiz código:** `refreshStatus()` (botão "Atualizar Status") falhava silenciosamente — sem toast, sem feedback ao usuário.
- **Fix:** Separado em dois handlers: `refreshStatus` (auto-poll silencioso) e `handleRefreshStatusManual` (botão manual com toast de feedback e loading state).
- **Causa raiz infra (requer diagnóstico no VPS):** Evolution API pode estar down. Ver diagnóstico em `23_PROXIMO_PASSO.md`.

### BUG 4 — Settings/Plan: botões Renovar/Assinar mortos
- **Causa raiz:** `handleSubscribe` em `PlanTab` não tinha estado de erro. Se `subscribePlan` retornava erro, nada acontecia — botão voltava ao normal sem feedback.
- **Fix:** Adicionados `planError` e `planSuccess` states com display no JSX. Banner informativo para usuários em trial.

### BUG 5 — Settings/Users: "disponível em breve"
- **Causa raiz:** Feature incompleta. Placeholder sem funcionalidade.
- **Fix:** `UsersTab` reescrita com modal "+ Convidar Membro". Roles: Administrador (admin) e Gerente (seller). Usa mesmo `inviteVendor` action com `generateLink`. Botão oculto para trial/sem plano com mensagem clara. `router.refresh()` após invite para atualizar a lista.

### Geral
- `ROLE_LABELS.admin`: `'Admin'` → `'Administrador'` (toda a aplicação).

**Arquivos alterados:**
- `frontend/app/(dashboard)/vendors/actions.ts` — `inviteUserByEmail` → `generateLink`, retorna `inviteLink`
- `frontend/app/(dashboard)/vendors/_components/VendorsClient.tsx` — UX: "Novo vendedor", roles, link copiável
- `frontend/app/(dashboard)/settings/_components/SettingsTabs.tsx` — PlanTab com error/success/trial; UsersTab com invite modal
- `frontend/components/whatsapp/WhatsAppManager.tsx` — `handleRefreshStatusManual` com toast
- `frontend/lib/users.ts` — `ROLE_LABELS.admin: 'Administrador'`
- `backend/internal/billing/service.go` — `asaasUserErr()` para mensagem amigável de IP whitelist

**SQL executado:** nenhum

**Configuração externa necessária (não código):**
1. Asaas IP Whitelist — ver `23_PROXIMO_PASSO.md`
2. Evolution API diagnóstico VPS — ver `23_PROXIMO_PASSO.md`

---

## 2026-05-25 (sessão 3) — Fix: updateSupabaseAppMetadata com retry + logging; runbook de incidentes; docs completos

**O que foi feito:**
- `updateSupabaseAppMetadata` reescrito com retry de 3 tentativas (backoff 500ms), leitura do body de erro HTTP para logging estruturado (zap), e distinção entre erros retryable (network/5xx/429) e não-retryable (4xx config errors).
- Logger injetado no `Handler` de onboarding — agora `updateSupabaseAppMetadata` loga `Warn` em cada tentativa falha, `Error` ao esgotar todas as tentativas, e `Info` no sucesso.
- `NewHandler` de onboarding recebe `*zap.Logger` — `server.go` atualizado para passar o logger existente.
- Risco R15 documentado em `19_RISCOS.md`: `updateSupabaseAppMetadata` falha silenciosa no onboarding.
- `24_RUNBOOK_INCIDENTES.md` criado com 10 cenários de incidente: 502, loop onboarding, WhatsApp desconectado, webhooks Asaas, CI/CD travado, SSL expirado, dashboard lento, erro 500 frontend, login falhando, IA retornando 500.
- `20_PENDENCIAS.md` atualizado: fix updateSupabaseAppMetadata marcado como CONCLUÍDO; runbook marcado como CONCLUÍDO; Banco/indexes já existentes (migration 009) confirmados.
- `23_PROXIMO_PASSO.md` atualizado com estado atual.

**Causa raiz que motivou o fix:**
`updateSupabaseAppMetadata` era `_ = h.update...` — erros completamente ignorados. Agora: 3 tentativas + logs estruturados com status HTTP e body exato da resposta do Supabase Admin API. Facilita diagnóstico imediato via `docker compose logs backend | grep updateSupabase`.

**Arquivos alterados:**
- `backend/internal/onboarding/onboarding.go` — retry 3x, zap logging, io.ReadAll do body de erro, logger injetado no Handler
- `backend/internal/server/server.go` — passa `logger` para `onboarding.NewHandler`
- `docs-operacao/19_RISCOS.md` — R15 adicionado
- `docs-operacao/20_PENDENCIAS.md` — atualizado
- `docs-operacao/22_HISTORICO_ALTERACOES.md` — este registro
- `docs-operacao/23_PROXIMO_PASSO.md` — atualizado
- `docs-operacao/24_RUNBOOK_INCIDENTES.md` — criado (novo)
- `docs-operacao/README.md` — referência ao runbook adicionada

**Commits:**
- A commitar nesta sessão

---

## 2026-05-23 (sessão 2) — Fix: getTenantForUser com service role fallback + protocol guard + patch JWT claims

**O que foi feito:**
- Diagnosticado que `updateSupabaseAppMetadata` falha silenciosamente no backend → `raw_app_meta_data` dos usuários fica sem `tenant_id` → JWT sem claim → `getTenantForUser` (session client + RLS `auth_tenant_id()`) retorna 0 linhas → loop /onboarding.
- `getTenantForUser` reescrito com fallback em service role: tenta session client (RLS) primeiro; se retornar null, consulta via service role filtrando por `id = userId` (seguro — não expõe dados cross-tenant).
- Patch direto via SQL no Supabase: `UPDATE auth.users SET raw_app_meta_data = raw_app_meta_data || jsonb_build_object('tenant_id', ..., 'user_role', ...)` para todos os usuários com tenant em `public.users` mas sem claim no JWT. Afetados: `dilneysantos@gmail.com`, `admin@staging.revendaclick.com.br`.
- Protocol guard adicionado em `actions.ts` e `tenant.ts`: se `NEXT_PUBLIC_API_URL` vier sem `https://`, `fetch()` não joga `TypeError: Failed to parse URL`.

**Causa raiz técnica:**
`updateSupabaseAppMetadata` em `backend/internal/onboarding/onboarding.go` é não-fatal (`_ = h.updateSupabaseAppMetadata(...)`). Quando falha (credenciais erradas, timeout, etc.), a transação do banco já foi commitada mas o JWT nunca recebe o claim. Com `getTenantForUser` dependendo de `auth_tenant_id()` (lê do JWT), o dashboard entra em loop para esses usuários mesmo com tenant no banco.

**Solução definitiva:**
1. `getTenantForUser`: session client primeiro → se null, service role fallback por `userId`. Unbloqueia todos os casos sem depender de JWT claim.
2. SQL patch: corrige JWT claims retroativamente para usuários afetados.
3. Protocol guard: garante que URL malformada nunca gera TypeError em produção.

**Arquivos alterados:**
- `frontend/lib/tenant.ts` — `getTenantForUser` reescrito com fallback; `API` constant com protocol guard
- `frontend/app/onboarding/actions.ts` — `API` constant com protocol guard

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
```

**Commits:**
- `b5685c2` — fix: service role fallback in getTenantForUser + protocol guard on API URL

---

## 2026-05-23 — Fix: bug crítico dashboard → loop infinito /onboarding (SUPABASE_SERVICE_ROLE_KEY ausente no Vercel)

**O que foi feito:**
- Diagnosticado via Vercel runtime logs: `[getTenantForUser] users query error` em TODOS os requests de /dashboard
- Causa raiz confirmada: `SUPABASE_SERVICE_ROLE_KEY` não configurado no Vercel → `createServiceClient()` falha → `getTenantForUser` retorna null → dashboard redireciona para /onboarding → loop infinito → formulário limpa
- Fix: `getTenantForUser` reescrito para usar `createClient()` (anon key + JWT do usuário) em vez de `createServiceClient()` (service role). RLS via `auth_tenant_id()` garante isolamento por tenant. Não requer `SUPABASE_SERVICE_ROLE_KEY`.
- Renomeado `middleware.ts` → `proxy.ts` para corrigir deprecation do Next.js 16

**Causa raiz técnica:**
`createServiceClient()` em `getTenantForUser` dependia de `SUPABASE_SERVICE_ROLE_KEY` que não estava no Vercel. O erro era silencioso (capturado pelo `if (userError)` com console.error). A RLS na tabela `users` (`WHERE tenant_id = auth_tenant_id()`) funciona corretamente via JWT — o claim `tenant_id` é injetado pelo backend no `app_metadata` após onboarding + `refreshSession()`.

**Usuários afetados confirmados no banco:**
- `desconto.do.dono@gmail.com` — tenant criado mas dashboard inacessível
- `dilsant.nocode@gmail.com` — tenant criado mas dashboard inacessível
- `dilneysantos.coprodutor@gmail.com` — sem tenant, loop no onboarding
- `metodolimpezas@gmail.com` — sem tenant, loop no onboarding

**Diagnóstico usado:**
- Supabase MCP: query em `auth.users JOIN public.users` revelou usuários sem tenant
- Vercel MCP: runtime logs confirmaram o erro exato `[getTenantForUser] users query error`
- Leitura de RLS policies: `users_select_own_tenant` e `tenants_select_own` via `auth_tenant_id()`

**Arquivos alterados:**
- `frontend/lib/tenant.ts` — `getTenantForUser`: `createServiceClient()` → `await createClient()`; import adicionado
- `frontend/proxy.ts` — criado (novo nome do middleware no Next.js 16)
- `frontend/middleware.ts` — esvaziado (substituído por proxy.ts)

**SQL executado:** nenhum

**Commits:**
- `894021d` — fix: switch getTenantForUser to session client

---

## 2026-05-22 — Fix: bug crítico login → redirect incorreto para /onboarding

**O que foi feito:**
- Corrigido `frontend/lib/tenant.ts` → `getTenantForUser`
- Substituído embedded Supabase join `tenants(...)` por duas queries explícitas independentes
- Substituído `.single()` por `.maybeSingle()` para evitar erro PGRST116 quando 0 linhas retornam
- Adicionado `console.error` para surfacing de erros futuros

**Causa raiz:**
O embedded join PostgREST `.select('tenant_id, tenants(id, slug, name, phone_whatsapp)')` falha silenciosamente em produção (schema cache, FK não reconhecido, ou erro de rede). O `if (error || ...)` captura o erro e retorna null. O dashboard interpreta como "sem tenant" e redireciona para /onboarding. O backend, consultando PostgreSQL diretamente, confirma que o tenant existe — daí o "usuário já possui uma loja cadastrada".

**Arquivos alterados:**
- `frontend/lib/tenant.ts` — `getTenantForUser` reescrito com duas queries explícitas

**SQL executado:** nenhum

**Commits:** ver git log

---

## 2026-05-22 — Auditoria e documentação completa

**O que foi feito:**
- Auditoria real do repositório (leitura de todos os arquivos-fonte)
- Criação de 11 documentos na raiz: `MAPA_DE_PASTAS.md`, `ARQUITETURA_REAL.md`, `ROTAS_REAIS.md`, `BANCO_REAL.md`, `ENVIRONMENT.md`, `INFRA.md`, `CICD.md`, `DEPLOY.md`, `OBSERVABILIDADE.md`, `AUTENTICACAO_REAL.md`, `FLUXOS_REAIS.md`
- Criação de `/docs-operacao/` com 24 arquivos (memória viva do projeto)
- Correção do branch padrão de `master` → `main` no GitHub via API
- Instalação do `gh` CLI em `~/.local/bin/gh` (sem sudo)
- Geração de `FLUTTERFLOW_MIGRATION.md` com plano de migração de 8 semanas
- Decisão de **cancelar** a migração para FlutterFlow (D12 em `21_DECISOES_TECNICAS.md`)

**Por quê:**
- Projeto não tinha documentação operacional — qualquer desenvolvedor novo ou IA precisava reler todo o código
- Decisão de produto: FlutterFlow não será mais necessário

**Arquivos criados/modificados:**
- `/docs-operacao/` (pasta nova com 24 arquivos)
- `MAPA_DE_PASTAS.md`, `ARQUITETURA_REAL.md`, etc. (raiz)
- `FLUTTERFLOW_MIGRATION.md` (obsoleto — decisão D12)

**Commits relacionados:**
- Ver `git log` para commits desta data

---

## Template para novas entradas

```
## YYYY-MM-DD — Descrição resumida

**O que foi feito:**
- item 1
- item 2

**Por quê:**
- motivação

**Arquivos criados/modificados:**
- caminho/do/arquivo.ext — o que mudou

**Commits relacionados:**
- sha abreviado — mensagem do commit
```

---

> Entradas mais antigas ficam abaixo das mais recentes.
> Não limitar o histórico — nunca apagar entradas.
