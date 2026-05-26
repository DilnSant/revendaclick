# 22 — HISTÓRICO DE ALTERAÇÕES

> Registrar toda alteração significativa feita em cada sessão de trabalho.
> Formato: data + o que mudou + por quê + arquivos afetados.

---

## Como Usar

No **início** de cada sessão: ler este arquivo para entender o estado atual.
No **fim** de cada sessão: adicionar uma entrada com as alterações feitas.

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
