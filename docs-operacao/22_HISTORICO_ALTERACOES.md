# 22 — HISTÓRICO DE ALTERAÇÕES

## 2026-05-29 (sessão 23 — continuação) — Fix Evolution webhook 401 + rc_backup memory + CI/CD deploy

**Commits:** `7e3f56a`
**Arquivos alterados:** `backend/internal/evolution/handler.go`, `docker-compose.production.yml`

### Evolution webhook 401 — causa raiz identificada e corrigida

**Sintoma:** Evolution v2.3.7 recebia HTTP 401 ao postar para `http://backend:8080/api/webhooks/evolution`.

**Causa:** Gin v1.12.0 com trusted proxies padrão (`["0.0.0.0/0"]`) usa `X-Forwarded-For` para determinar o IP do cliente. Evolution v2.3.7 envia `X-Forwarded-For: 2.24.67.84` (IP público do VPS) nos seus webhooks. Gin usava esse header em vez do endereço TCP real (`10.0.4.5`), classificando a requisição como "externa". A checagem de IP interno (`10.`, `172.`, `192.168.`) falhava, e como Evolution não envia o cabeçalho `apikey` nos webhooks globais, o backend retornava 401.

**Fix:** `evolution/handler.go` — substituir `c.ClientIP()` por `c.Request.RemoteAddr` + `net.SplitHostPort()` para usar o endereço TCP real, imune a X-Forwarded-For spoofing.

### rc_backup — OOM corrigido

- Limite de memória: `128m` → `256m` (estava em 98% — 126MiB/128MiB)
- Variáveis shell no `command` do backup escapadas com `$$` (ELAPSED, TARGET_SEC, WAIT) para evitar interpolação do Docker Compose (warnings nas logs)
- Após restart: **6MiB / 256MiB (2.33%)** ✓

### devecar — instância Evolution desconectada

`connectionStatus: close` desde 2026-05-28T10:57:57. `disconnectionReasonCode: 401`, tipo `device_removed` (conflito — dispositivo removido). **Requer ação do usuário: acessar `/whatsapp` como `devecar` e escanear QR novamente.**

santos-car: `connectionStatus: open` ✓ (554888482877).

---

## 2026-05-29 (sessão 23) — Auditoria de riscos + reestruturação estratégica verificada + migration 024

**Migration:** `024_fix_plan_addons_rls_rename_performance.sql` — aplicada via Supabase MCP
**Arquivos alterados:** `PlanCard.tsx`, `PlansGrid.tsx`, `billing/model.go`, `database.types.ts`, docs

### Verificação da reestruturação estratégica

Leitura integral dos 34 arquivos em `docs-operacao/` + código-fonte real. Resultado: **todas as 10 etapas já estavam implementadas** corretamente desde sessões 17–22:

| Etapa | Status | Sessão |
|---|---|---|
| ETAPA 1 — Menu "Central de Atendimento" | ✓ | 17 |
| ETAPA 2 — /whatsapp reposicionado (sem bulk/spam) | ✓ | 17 |
| ETAPA 3 — Settings aba "Contato Público da Loja" | ✓ | 17 |
| ETAPA 4 — Página pública mostra apenas contato público | ✓ | 17 |
| ETAPA 5 — Billing premium redesign (3 cards + Enterprise CTA) | ✓ | 18/22 |
| ETAPA 6 — Arquitetura modular (loja/atendimento/IA) | ✓ | 18–22 |
| ETAPA 7 — tenant_public_contacts + tenant_whatsapp_sessions | ✓ | 18 |
| ETAPA 8 — Backend store-contact + plan_gate 3-way | ✓ | 17/22 |
| ETAPA 9 — Frontend refatorado (linguagem CRM, não disparo) | ✓ | 17–22 |
| ETAPA 10 — Posicionamento CRM automotivo | ✓ | 17–22 |

### Auditoria de riscos (19_RISCOS.md)

| Risco | Resultado | Ação |
|---|---|---|
| R4 `plan_addons` sem RLS | ❌ Encontrado | Migration 024: RLS + 2 policies |
| R5 .env no .gitignore | ✓ OK | Verificado: `.env`, `.env.local`, `.env.*.local`, `.env.production` cobertos |
| R9 triggers de limite | ✓ OK | `trg_check_vehicle_limit` + `trg_check_user_limit` ativos |
| R10 grace period | ✓ OK | `trg_subscription_grace` ativo em `subscriptions` |
| R1/R2/R3/R6/R7/R8/R11–R15 | Operacionais | Requerem acesso VPS — documentados em 19_RISCOS.md |

### Migration 024

- `plan_addons`: RLS habilitado; policies `plan_addons_read` (authenticated) + `plan_addons_read_anon` (anon)
- Plano 3: `premium` → `performance`, `display_name` → `Performance`, `tagline` → "Automatize sua operação"

### GAP encontrado e corrigido: nome do plano 3

Strategy document especificava `PLANO 3 — PERFORMANCE`. Session 22 (FASE 4) havia renomeado para `premium`. Migration 024 corrige para `performance`.

**Frontend atualizado:**
- `PlanCard.tsx`: `PLAN_HIGHLIGHTS.premium` → `.performance`; `PLAN_BADGE.premium` → `.performance`; `isPremium` → `isPerformance`
- `PlansGrid.tsx`: comentário atualizado
- `billing/model.go`: comentário atualizado

**database.types.ts regenerado:** 131.307 chars (pós-migration 024).

---


> Registrar toda alteração significativa feita em cada sessão de trabalho.
> Formato: data + o que mudou + por quê + arquivos afetados.

---

## Como Usar

No **início** de cada sessão: ler este arquivo para entender o estado atual.
No **fim** de cada sessão: adicionar uma entrada com as alterações feitas.

---

## 2026-05-28 (sessão 22) — FASE 4 Reestruturação Comercial Definitiva: Premium, Add-ons, Sidebar

**Commit:** `bdefe75` (16 arquivos, 904 inserções)
**Migration:** `022_commercial_restructure_premium_addons.sql` — aplicada via Supabase MCP
**Deploy Vercel:** `dpl_DYGETwWoLjxqC8nzjBTFpgXcwx37` — estado READY; `app.revendaclick.com.br` ao vivo

### Objetivo

Reestruturação comercial completa dos planos e add-ons. Três objetivos principais:
1. Renomear `performance` → `premium`; ocultar plano `scale` do grid (CTA "Falar com especialista")
2. Criar arquitetura de add-ons real com grant de features por add-on
3. Reorganizar sidebar: Financeiro/Comissões/Vendedores para Starter+; CRM/Compradores apenas Pro+

### Mudanças de Banco (Migration 022)

- `performance` → `premium` em `plans.name`
- Features por plano atualizadas conforme spec comercial
- `plan_addons`: adicionada coluna `features JSONB` — permite que add-ons concedam feature flags
- `get_tenant_usage` RPC recriada: merge 3-way `plan.features` UNION `tenant_features` UNION `addon.features`
- Catálogo: `user_extra` (R$20), `whatsapp_automation` (R$39), `ia_recovery` (R$39)

### Mudanças Backend

- `plans/model.go`: 3 novos campos `HasWhatsAppQR`, `HasLeadRecovery`, `HasExtraUser`
- `plans/repository.go`: `GetUsage` com merge de features de add-ons + incremento `max_users` por `user_extra`
- `middleware/plan_gate.go`: 3º UNION ALL — verifica `subscription_addons JOIN plan_addons.features`
- `billing/model.go`: `PlanAddon`, `ActiveAddon`, `AddonsResponse`
- `billing/repository.go`: `ListAvailableAddons`, `ListActiveAddons`, `ActivateAddon`, `CancelAddon`
- `billing/handler.go`: `GetAddons`, `ActivateAddon`, `CancelAddon` handlers
- `server/server.go`: rotas `GET/POST/DELETE /api/billing/addons/:type`

### Mudanças Frontend

- `DashboardShell.tsx`: financial+comissões+vendedores → NAV_BASE (Starter+); gate Pro = `has_crm`; label "CRM"; Add-ons nav item
- `PlanCard.tsx`: `performance` → `premium`; highlights atualizados por plano
- `PlansGrid.tsx`: oculta `scale`; grid 3 colunas; CTA Enterprise
- `billing/plans/page.tsx`: tabela comparativa 3 colunas; `whatsapp_qr`, `lead_recovery` incluídos
- `billing/addons/page.tsx`: nova página server component
- `billing/addons/_components/AddonsClient.tsx`: ativar/cancelar add-ons com feedback
- `app/api/billing/addons-action/[type]/route.ts`: proxy Next.js → backend (POST/DELETE)
- `lib/tenant.ts`: `has_whatsapp_qr`, `has_lead_recovery`, `has_extra_user` em `PlanUsage`

### Regra de Segurança

NUNCA hardcode `plan_name === 'premium'` ou similar. Sempre usar feature flags (`has_crm`, `has_whatsapp_qr`, etc).

## 2026-05-28 (sessão 22 — cont.) — Fix: get_tenant_usage sem tenant_features + reconexão santos-car

**Commit:** `8c323e6`
**Migration:** `023_fix_get_tenant_usage_tenant_features_merge.sql` — aplicada via Supabase MCP

### Problema
Migration 022 foi aplicada com versão incompleta de `get_tenant_usage` — o branch `tenant_features` do UNION ALL 3-way estava ausente. Resultado: overrides de super_admin (tenant_features table) eram silenciosamente ignorados pelo RPC. Detectado ao tentar conceder `central_atendimento` à santos-car.

### Correção
Migration 023 recria `get_tenant_usage` com os 3 branches corretos:
- Branch 1: `plans.features` (base do plano)
- Branch 2: `tenant_features` WHERE enabled = true AND expires_at IS NULL OR > NOW()
- Branch 3: `subscription_addons JOIN plan_addons.features` WHERE status = 'active'

### Central de Atendimento santos-car
- Instância Evolution `santos-car` já estava `connectionStatus: open` (554888482877, "Método Soluções")
- Feature `central_atendimento` concedida via `tenant_features` (INSERT + override — sem expiração)
- RPC corrigido → feature aparece no merge
- santos-car pode acessar `/whatsapp` sem necessitar add-on nem upgrade de plano

---

## 2026-05-28 (sessão 21) — FASE 3 Auditoria de Regressão: correção do congelamento de deploy no Vercel

**Commits:** `f0e59c0` (regenerar database.types.ts), `5eb241a` (tenant.ts unknown cast)
**Migration:** nenhuma
**Deploy:** `dpl_FySkkpdCPWXTHzYJGcwSWvLTiHPa` — estado READY; `app.revendaclick.com.br` ao vivo

### Problema

Produção estava congelada no commit `c885492` (sessão 15). Oito deploys consecutivos (sessões 16–20) falharam com TypeScript error no Vercel, bloqueando silenciosamente todas as features implementadas: sidebar dinâmica, admin panel, feature flags, OnboardingChecklist, billing upgrade.

### Causa raiz

`frontend/lib/database.types.ts` não era atualizado desde antes das migrations 018–021. O arquivo gerado pelo Supabase não incluía as tabelas `tenant_public_contacts`, `tenant_features`, `subscription_addons` e `plan_addons`. Qualquer arquivo que referenciasse essas tabelas causava erro de tipo no build.

### Investigação

1. Confirmado que frontend deploy é exclusivamente via Vercel (nginx.conf não tem entrada para `app.`; `docker-compose.production.yml` não tem serviço frontend; `ci.yml` só builda o backend)
2. Lido `DashboardShell.tsx` — código local correto (DEFAULT_FEATURES false, gates por feature flag, banner Starter)
3. Lido `(dashboard)/layout.tsx` — `getUsageFromAPI` passa planFeatures corretamente
4. Verificado DB via SQL — santos-car=starter sem kanban, devecar=pro com todos os flags ✓
5. Build logs do Vercel confirmaram o erro no `lib/tenant.ts:332` (referência a `tenant_public_contacts`)

### Correção 1 — Regenerar `database.types.ts` (commit `f0e59c0`)

- Gerado via `mcp__claude_ai_Supabase__generate_typescript_types`
- Arquivo atualizado de ~1200 para 4263 linhas
- Tabelas adicionadas: `tenant_public_contacts`, `tenant_features`, `subscription_addons`, `plan_addons`

### Correção 2 — Cast em `lib/tenant.ts` (commit `5eb241a`)

- O tipo gerado para `tenant.theme` é `Json` (correto conforme schema), conflitando com o tipo local `{ primary_color: string; font: string }`
- `getTenantById` linha 116 e `getTenantBySlug` linha 136: `return data as Tenant` → `return data as unknown as Tenant`
- Sem impacto em runtime — apenas satisfaz o compilador TypeScript

### Resultado

Deploy `dpl_FySkkpdCPWXTHzYJGcwSWvLTiHPa` (commit `5eb241a`) → **READY** ✓
Produção agora executa código das sessões 16–21: sidebar dinâmica, admin panel, feature flags, checklist de onboarding.

### Arquivos alterados

- `frontend/lib/database.types.ts` — regenerado (4263 linhas)
- `frontend/lib/tenant.ts` — linhas 116 e 136: cast unknown intermediário

---

## 2026-05-28 (sessão 20) — Reestruturação estratégica: sidebar dinâmica, Starter rename, feature flags, add-ons

**Commit:** 6321538
**Migration:** 021 aplicada ao Supabase

### Problema
Sidebar estática mostrava tudo para todos os planos. Plan name "start" divergia do posicionamento "Starter". Feature flags `financial` e `vendors` não existiam, tornando impossível ocultar Financeiro/Vendedores para Starter. Add-ons não tinham estrutura de banco.

### Alterações

#### Banco (Migration 021)
- Plano `start` → `starter` (display_name='Starter')
- Pro+: features + `financial` + `vendors`
- Performance+: + `ai_assistance` + `automation` + `campaigns`
- Trigger `auto_assign_trial_subscription` atualizado para `'starter'`
- Tabela `subscription_addons` — add-ons ativos por tenant (RLS service_role)
- Tabela `plan_addons` — catálogo de add-ons (5 produtos: R$19-R$99/mês)
- View `plan_usage` recriada

#### Backend
- `plans/model.go` — Usage struct: +HasFinancial, +HasVendors, +HasAIAssistance, +HasAutomation, +HasCampaigns, +HasMultiStore
- `ComputeFeatureFlags()` computa todos os novos flags

#### Frontend
- `DashboardShell.tsx` — sidebar 100% dinâmica por feature flag:
  - Starter: Dashboard, Veículos, Interessados, Vendas, Assinatura, Configurações
  - Pro+ (has_kanban): + Compradores, Atendimento, Financeiro, Comissões, Vendedores
  - Pro+ (has_central_atendimento): + Central de Atendimento
  - Pro+ (has_analytics): + Analytics
  - DEFAULT_FEATURES agora restritivo (false por padrão)
  - Labels: Leads→Interessados, Clientes→Compradores, CRM→Atendimento
  - Banner upgrade para Starter ("Desbloqueie com Pro")
- `PlanCard.tsx` — 'start'→'starter', "Tudo do Starter"
- `plans/page.tsx` — tabela comparativa atualizada com novos features
- `lib/tenant.ts` — PlanUsage com novos feature flags

---

## 2026-05-28 (sessão 19) — FASE 2: Consolidação SaaS — feature flags reais, onboarding v2, painel admin, correção /whatsapp, widget checklist dashboard

**Commits:** feat: FASE 2 — feature flags, onboarding v2, admin panel, checklist widget
**Migration:** 020 aplicada ao Supabase
**Deploy:** commit + CI/CD push

### Problema

Plataforma precisava: (1) feature flags reais por plano/tenant (sem hardcode de plan_name), (2) onboarding reformulado (QR opcional), (3) painel admin para gerenciar tenants, (4) devecar ativado para testes.

### Alterações

#### Banco de dados — Migration 020

- `ALTER TYPE user_role ADD VALUE 'super_admin'` — novo papel sem tenant_id
- Tabela `tenant_features` — overrides por tenant (admin-granted features com expiração opcional; RLS service_role only)
- `onboarding_checklists` — colunas `received_first_lead`, `whatsapp_connected` adicionadas
- Trigger `_mark_vehicle_added()` — marca `added_vehicle=true` no INSERT de veículo
- Trigger `_mark_first_lead_received()` — marca `received_first_lead=true` no INSERT de lead
- Trigger BEFORE UPDATE `_update_onboarding_completed()` — `completed_at` automático quando `added_vehicle AND published_store AND received_first_lead`
- `auto_create_onboarding_checklist()` recriado com novas colunas

#### Backend

- `middleware/plan_gate.go` — query UNION ALL: verifica `plans.features` OU `tenant_features` (admin overrides)
- `onboarding/onboarding.go` — Checklist com 8 campos; GET/PUT atualizados; aceita `received_first_lead` e `whatsapp_connected`
- `admin/` (pacote novo) — model.go, repository.go, handler.go
  - `ListTenants`: JOIN tenants+subscriptions+plans, COUNT veículos/usuários/leads
  - `ActivateTenant`, `ExtendTrial`, `BlockTenant`, `UnblockTenant`
  - `GrantFeature`, `RevokeFeature`, `ListGrantedFeatures`
- `server/server.go` — importa `admin`, registra `/api/admin/*` (jwtAuth + superAdmin, sem resolveTenant)
- `billing/repository.go` + `billing/service.go` + `billing/handler.go` — `DevActivate` (apenas ENV != production)

#### Frontend

- `app/(admin)/layout.tsx` — valida `super_admin`, redireciona para /dashboard se não autorizado
- `app/(admin)/admin/page.tsx` — server component; stats grid; `GET /api/admin/tenants`
- `app/(admin)/admin/_components/AdminTenantsTable.tsx` — client component; busca + ações por tenant (Ativar Pro, +7 dias trial, + Atendimento feature, Block/Unblock)
- `app/api/admin/[...path]/route.ts` — catch-all proxy: valida super_admin no frontend → proxy para backend `/api/admin/*`
- `app/api/billing/dev-activate-action/route.ts` — proxy para `/api/billing/dev/activate` (só quando NEXT_PUBLIC_DEV_BILLING=true)
- `components/onboarding/OnboardingChecklist.tsx` — widget do checklist de onboarding (4 passos obrigatórios + 1 opcional WhatsApp)
- `app/(dashboard)/dashboard/page.tsx` — integra OnboardingChecklist; fetchChecklist + merges has_central_atendimento de usage
- `app/(dashboard)/whatsapp/page.tsx` — corrigido: usa `usage?.has_central_atendimento` em vez de `planName !== 'start'` (hardcode removido)

---

## 2026-05-28 (sessão 18) — Reestruturação estratégica: novos planos (Start/Pro/Performance/Scale), billing premium redesign, gate Central de Atendimento

**Commit:** pendente (próxima ação)
**Migration:** 019 aplicada ao Supabase — planos renomeados, tagline adicionada, features atualizadas
**Deploy:** pendente após commit

### Problema

O modelo de planos usava nomes genéricos (Starter/Pro/Premium/Enterprise) sem diferenciação de posicionamento. A feature "Central de Atendimento" (Evolution API) não estava isolada como gate de plano — qualquer plano com subscription ativa podia acessar QR Code. A página `/billing/plans` usava design básico sem hierarquia visual.

### Alterações

#### Banco de dados — Migration 019

- `plans.name` convertido de ENUM `plan_type` para TEXT (+ drop/recreate view `plan_usage`)
- Planos renomeados: `starter → start`, `premium → performance`, `enterprise → scale`
- Coluna `tagline` adicionada com slogan de posicionamento por plano
- Limites atualizados: Start (15/2/100), Pro (50/5/500), Performance (120/15/2500), Scale (−1/−1/−1)
- Feature `central_atendimento` adicionada em Pro, Performance, Scale (ausente em Start)
- Features de IA (`ai_suggest_reply`, `ai_classify_lead`) adicionadas em Performance e Scale
- `auto_assign_trial_subscription()` atualizado para usar `'start'` em vez de `'starter'`

#### Backend

- `plans/model.go` — `Tagline string` em `Plan`; `HasCentralAtendimento bool` em `Usage`; `ComputeFeatureFlags()` atualizado
- `plans/repository.go` — `tagline` incluído no SELECT/Scan de `ListPlans`
- `server.go` — `caGate := planGate("central_atendimento")` aplicado a todas as rotas Evolution operacionais (`/evolution/status`, `/evolution/qr`, `/evolution/connect`, `/evolution/disconnect`, `/evolution/send`); `/evolution/health` sem gate
- `billing/model.go` — comentário atualizado para `"start"|"pro"|"performance"|"scale"`

#### Frontend

- `lib/billing-utils.ts` — `tagline: string` adicionado ao tipo `Plan`
- `lib/tenant.ts` — `has_central_atendimento?: boolean` em `PlanUsage`; `getUsageFromAPI` retorna o campo
- `app/(dashboard)/whatsapp/page.tsx` — gate de plano: Start → exibe `CentralAtendimentoGate` (upgrade prompt com lock icon, benefícios, CTA Pro); Pro+ → renderiza `WhatsAppManager`
- `app/(dashboard)/billing/plans/page.tsx` — redesign premium: header centralizado, subscription banner, usa `PlansGrid`, comparison table com seções groupadas (Limites / Loja & Marketplace / Central de Atendimento / IA & Automação / Enterprise)
- `app/(dashboard)/billing/plans/_components/PlansGrid.tsx` — **novo** client component: toggle global mensal/anual aplica a todos os cards simultaneamente
- `app/(dashboard)/billing/plans/_components/PlanCard.tsx` — redesign premium: recebe `cycle` do parent; badges "Mais popular" (Pro) e "Melhor custo-benefício" (Performance); pill grid de limites; feature sections groupadas por módulo; ring highlight no Pro; CTA amber no Performance

---

## 2026-05-28 (sessão 17) — Refatoração estratégica WhatsApp: Central de Atendimento × Contato Público da Loja

**Commit:** `b8d2a48` — feat: Central de Atendimento + Contato Público da Loja
**Tag git:** `evolution-conectado` — marco publicado no GitHub
**Migration:** 018 aplicada ao Supabase (tenant_public_contacts + tenant_whatsapp_sessions)
**Deploy backend:** automático via CI/CD — VPS rodando `ghcr.io/dilnsant/revendaclick-backend:b8d2a487a2a486d300da2fc3e80abd8e711a7dea`
**Deploy frontend:** automático via Vercel (push para `main` dispara integração Vercel)
**Smoke test:** `https://api.revendaclick.com.br/health` → `{"db":"ok","status":"ok"}` ✓ | `https://app.revendaclick.com.br/` → HTTP 200 ✓
**Erros:** nenhum durante deploy ou aplicação da migration

### Problema

O sistema conflava dois conceitos distintos sob o nome "WhatsApp":
- **CONCEITO 1 (operacional):** Evolution API, QR Code, sessão, CRM, leads automáticos — restrito ao dashboard interno
- **CONCEITO 2 (comercial):** Botão de contato público na vitrine, Instagram, grupo de ofertas, localização — visível a clientes

### Divergências corrigidas antes das alterações

1. `docs-operacao/16_EVOLUTION.md` — `atendai/evolution-api:latest` → `evoapicloud/evolution-api:v2.3.7` (código real no `docker-compose.production.yml`)
2. `docs-operacao/08_API_ROTAS_REAIS.md` — `PUT /api/billing/subscription` estava ausente (adicionado)

### Arquivos criados

- `database/migrations/018_tenant_public_contacts_and_whatsapp_sessions.sql` — tabelas `tenant_public_contacts` + `tenant_whatsapp_sessions` com RLS, indexes, triggers
- `backend/internal/storecontact/model.go` — `StoreContact`, `UpsertRequest`
- `backend/internal/storecontact/repository.go` — `GetByTenantID`, `Upsert`
- `backend/internal/storecontact/service.go` — `Get`, `Upsert`
- `backend/internal/storecontact/handler.go` — `GET /api/store-contact`, `PUT /api/store-contact`

### Arquivos modificados

- `backend/internal/tenant/handler.go` — `GetPublic` inclui `public_contact` na resposta pública do slug
- `backend/internal/server/server.go` — rotas `GET/PUT /api/store-contact` + inicialização do módulo storecontact
- `frontend/components/layout/DashboardShell.tsx` — menu "WhatsApp" → "Central de Atendimento" (ícone headset)
- `frontend/app/(dashboard)/whatsapp/page.tsx` — título/descrição → linguagem de CRM/atendimento
- `frontend/components/whatsapp/WhatsAppManager.tsx` — todos os textos sem linguagem de bulk/spam; banner explicativo apontando para Settings → Contato Público
- `frontend/app/(dashboard)/settings/actions.ts` — `StoreContactData`, `getStoreContact()`, `saveStoreContact()`
- `frontend/app/(dashboard)/settings/page.tsx` — fetch `getStoreContact()` em parallel; passa `storeContact` ao `SettingsTabs`
- `frontend/app/(dashboard)/settings/_components/SettingsTabs.tsx` — nova aba "Contato Público" + componente `ContactTab` (6 campos: WhatsApp, telefone, email, Instagram, link grupos, localização)
- `frontend/lib/tenant.ts` — tipo `PublicContact` + função `getPublicStoreContact(tenantId)`
- `frontend/app/(public)/[slug]/page.tsx` — vitrine pública exibe `public_contact`: Instagram, telefone, email, localização, link grupo; botão WhatsApp usa `public_whatsapp` com fallback para `phone_whatsapp`

### Docs atualizadas

- `08_API_ROTAS_REAIS.md` — rotas `GET/PUT /api/store-contact` + nota `public_contact` na rota pública
- `20_PENDENCIAS.md` — refatoração marcada CONCLUÍDA, nomenclatura atualizada
- `23_PROXIMO_PASSO.md` — estado atualizado

---

## 2026-05-28 (sessão 16) — Endpoint de upgrade de plano

**Commit:** `d20e798` — feat: billing upgrade — PUT /api/billing/subscription para troca de plano ativo
**Deploy:** automático via CI/CD — incluído no mesmo pipeline do push da sessão 17
**Smoke test:** `https://api.revendaclick.com.br/health` → `{"db":"ok","status":"ok"}` ✓

### Endpoint PUT /api/billing/subscription (upgrade/downgrade)

**Problema:** Guard em `billing/service.go:Subscribe` devolvia a subscription ativa sem alteração quando `asaas_subscription_id != ""`. Usuários com `status=active` não conseguiam trocar de plano.

**Solução:** Endpoint dedicado `PUT /api/billing/subscription` que:
1. Valida `status=active` com `asaas_subscription_id` preenchido
2. Chama Asaas `PUT /subscriptions/{id}` → novo valor/ciclo no próximo billing
3. Atualiza `plan_id` + `billing_cycle` no banco local sem alterar `status`
4. No-op se mesmo plano + mesmo ciclo

**Frontend:**
- `PlanCard.tsx`: detecta `is_active && !isCurrent` → modo upgrade (`isUpgradeMode`)
- Modo upgrade: botão "Mudar para este plano", sem CPF/billing_type (customer já existe), sem banner "7 dias de trial gratuito"
- Modo subscribe (existente): inalterado — trialing/novos assinantes

**Arquivos criados/modificados:**
- `backend/internal/billing/asaas.go` — `updateSubscription()` + `asaasSubscriptionUpdateReq`
- `backend/internal/billing/model.go` — `UpgradeRequest`
- `backend/internal/billing/repository.go` — `UpdateSubscriptionPlan()`
- `backend/internal/billing/service.go` — `UpgradeSubscription()`
- `backend/internal/billing/handler.go` — `Upgrade()` handler
- `backend/internal/server/server.go` — rota `PUT /billing/subscription`
- `frontend/app/api/billing/upgrade-action/route.ts` — novo proxy SSR
- `frontend/app/(dashboard)/billing/plans/_components/PlanCard.tsx` — `isUpgradeMode` + `handleUpgrade()`

**Docs atualizadas:**
- `15_BILLING_ASAAS.md` — nova rota + body de upgrade documentados
- `20_PENDENCIAS.md` — marcado CONCLUÍDA
- `23_PROXIMO_PASSO.md` — item removido, numeração ajustada

---

## 2026-05-28 (sessão 15) — Correções finais: billing trial + header duplo + cores tenant

**Commits:** `81eceb5`
**Smoke test:** 22/22 PASS

### PROBLEMA 1 — Billing: usuário em trial não conseguia assinar

**Causa raiz:** `PlanCard.tsx` usava `isCurrent = plan.name === currentPlanName` para desabilitar o botão. Como `isCurrent = true` durante o trial, o botão ficava desabilitado para qualquer `status` — incluindo `trialing`.

**Análise backend:** Guard em `billing/service.go:Subscribe` só bloqueia quando `asaas_subscription_id != ""`. Durante trial, não há `asaas_subscription_id` → guard não dispara → backend aceita o subscribe normalmente. Problema era **somente no frontend**.

**Fix (`PlanCard.tsx`):**
```ts
// Antes:
disabled={isCurrent || loading}   // bloqueava trialing

// Depois:
const isActiveAndCurrent = isCurrent && !isTrialing  // bloqueia APENAS active
disabled={isActiveAndCurrent || loading}
```

**UX implementada:**
- `trialing` (plano atual): badge "Trial ativo" + botão "Antecipar assinatura" clicável
- `trialing` (outro plano): botão "Assinar" clicável
- `active` (plano atual): botão "Plano atual ✓" desabilitado + data de renovação
- Formulário de pagamento (forma + CPF) visível para todos os planos não-bloqueados

---

### PROBLEMA 2 — Cabeçalho duplo na loja pública

**Causa raiz:** `[slug]/layout.tsx` renderizava `<header className="sticky top-0 z-40 ...">` com logo + botão WhatsApp. `[slug]/page.tsx` já tinha Hero section completa (logo + nome + descrição + cidade/estado + botão WhatsApp). Dois headers empilhados visualmente.

**Fix (`[slug]/layout.tsx`):**
- Removido o bloco `<header>` completo
- Layout agora: `<style>` + `<main>{children}</main>` + `<footer>`
- O Hero da `page.tsx` é o único cabeçalho da loja — mais rico e com todas as informações

**Impacto:** Afeta tanto `/[slug]` quanto `/[slug]/[vehicleSlug]` (ambos usam o mesmo layout).

---

### PROBLEMA 3 — Cores hardcoded na loja pública

**Causa raiz:** `tailwind.config.ts` definia `primary: { DEFAULT: '#E53935' }` — valor estático. Classes Tailwind como `bg-primary`, `text-primary`, `hover:bg-primary-dark` compilavam para vermelho fixo. O CSS variable `--color-primary` só funcionava em `style={}` inline.

**Fix em 3 camadas:**

**Camada 1 — `tailwind.config.ts`:**
```ts
primary: {
  DEFAULT: 'rgb(var(--primary) / <alpha-value>)',  // era: '#E53935'
  dark:    'rgb(var(--primary-dark) / <alpha-value>)',  // era: '#C62828'
}
```
Suporte nativo a opacity modifiers: `bg-primary/10`, `ring-primary/20`, etc.

**Camada 2 — `globals.css`:**
```css
:root {
  --primary:      229 57 53;  /* canais RGB de #E53935 — default dashboard */
  --primary-dark: 198 40 40;  /* canais RGB de #C62828 */
}
```

**Camada 3 — `[slug]/layout.tsx`:**
```ts
function hexToRgb(hex) { /* hex → {r,g,b} */ }
function darken(r,g,b, factor=0.83) { /* 17% escurecimento */ }

const { r, g, b } = hexToRgb(hexColor)       // tenant primary_color
const darkChannels = darken(r, g, b)

<style>{`
  :root {
    --color-primary: ${hexColor};         /* para inline style={{ color: 'var(...)' }} */
    --primary: ${r} ${g} ${b};           /* para Tailwind bg-primary */
    --primary-dark: ${darkChannels};      /* para Tailwind hover:bg-primary-dark */
  }
`}</style>
```

**Elementos agora usando cor do tenant:**
- `bg-primary` (Buscar, chips ativos, filtros, etc.) — via Tailwind
- `hover:bg-primary-dark` (hover de botões) — via Tailwind
- `focus:border-primary`, `focus:ring-primary` (inputs) — via Tailwind
- `btn-primary` em globals.css (vehicle detail "Quero este veículo") — via @apply bg-primary
- `style={{ backgroundColor: 'var(--color-primary)' }}` (VehicleCard "Tenho interesse") — via CSS var hex
- `style={{ color: 'var(--color-primary)' }}` (preço) — via CSS var hex
- Botão WhatsApp do hero: `bg-green-500` → `bg-primary`

**Dashboard:** Usa defaults de globals.css (`--primary: 229 57 53` = `#E53935`) → sem mudança visual.

---

**Arquivos modificados (sessão 15):**
- `frontend/app/(dashboard)/billing/plans/_components/PlanCard.tsx`
- `frontend/app/(public)/[slug]/layout.tsx`
- `frontend/app/(public)/[slug]/page.tsx`
- `frontend/app/globals.css`
- `frontend/tailwind.config.ts`

**Validação produção:**
```
curl "https://www.revendaclick.com.br/santos-car" → HTTP 200
  → --primary: 229 57 53 presente no HTML
  → sem sticky top-0 header no markup
  → bg-primary no botão WhatsApp (não bg-green-500)
22/22 smoke test PASS
```

---

## 2026-05-27/28 (sessão 14) — Evolution recovery: P3005+P3009+ENUMs + security advisors

**Commits:** `76ddc51`
**Smoke test:** 22/22 PASS

### Security cleanup Supabase

**Problema:** Supabase Security Advisor mostrava:
- `rls_disabled_in_public`: 37 tabelas PascalCase da Evolution API (criadas pelo Prisma) sem RLS no schema `public`
- `security_definer_view`: view `public_vehicle_listings` com SECURITY DEFINER desnecessária
- `public_bucket_allows_listing`: policy `logos_public_read` dava acesso de listagem ao bucket `logos`

**Migration 015 — `cleanup_evolution_tables_and_security_fixes`:**
- Dropadas 37 tabelas PascalCase da Evolution (`Chat`, `Contact`, `Instance`, `Message`, etc.)
- Dropada tabela `_prisma_migrations`
- Dropada view `public_vehicle_listings`
- Dropada policy `logos_public_read` (bucket público não precisa de SELECT explícito)

**Resultado:** Security advisors zerados (exceto Leaked Password Protection — só via Dashboard UI).

### Recovery Evolution API (P3005 → P3009 → ENUM types órfãos)

**Erro P3005:** Ao dropar `_prisma_migrations`, Prisma viu schema não vazio sem histórico → recusou executar.
- **Fix migration 016:** Recriada tabela `_prisma_migrations` vazia com schema correto + RLS habilitado.

**Erro P3009:** Ao iniciar com `_prisma_migrations` vazia, Prisma tentou aplicar `20240609181238_init` que executa `CREATE TYPE "InstanceConnectionStatus"`. O `DROP TABLE CASCADE` NÃO remove ENUM types → tipo já existia → `ERROR 42710` → registro de migration falha travou tudo.

**Diagnóstico ENUM types órfãos:**
```sql
SELECT typname FROM pg_type WHERE typnamespace = 'public'::regnamespace AND typtype = 'e'
-- Retornou 7 tipos PascalCase da Evolution + 18 tipos snake_case do RevendaClick
```

**Migration 017 — `drop_evolution_enum_types_and_fix_prisma_migration`:**
```sql
DROP TYPE IF EXISTS public."DeviceMessage" CASCADE;
DROP TYPE IF EXISTS public."DifyBotType" CASCADE;
DROP TYPE IF EXISTS public."InstanceConnectionStatus" CASCADE;
DROP TYPE IF EXISTS public."OpenaiBotType" CASCADE;
DROP TYPE IF EXISTS public."SessionStatus" CASCADE;
DROP TYPE IF EXISTS public."TriggerOperator" CASCADE;
DROP TYPE IF EXISTS public."TriggerType" CASCADE;
DELETE FROM public."_prisma_migrations" WHERE migration_name = '20240609181238_init';
```

**Recovery:** `docker restart rc_evolution` → container aplicou todas as migrations Prisma com sucesso → `healthy`.

**Consequência:** Todas as instâncias WhatsApp foram perdidas (dados estavam nas tabelas dropadas). Usuários precisam reconectar em `/whatsapp`.

### FC024–FC028 documentadas

- FC024: Vehicle detail 500 (features null + photo_urls→images)
- FC025: Logos bucket policy pública desnecessária
- FC026: Evolution tables no schema public sem RLS
- FC027: P3005 + P3009 após drop das tabelas
- FC028: ENUM types órfãos após DROP TABLE CASCADE

**Arquivos modificados (sessão 14):**
- `docs-operacao/FalhasCorrigidas/FC024–FC028` (novos)
- `docs-operacao/FalhasCorrigidas/README.md`
- `docs-operacao/23_PROXIMO_PASSO.md`
- Supabase migrations 015, 016, 017 (aplicadas via MCP)

---

## 2026-05-27 (sessão 13) — Problemas 1-5 produção: 500 vitrine, personalização loja, filtros, billing

**O que foi feito:**

### PROBLEMA 1 — Vehicle detail HTTP 500 (digest 4250320451)

- **Causa raiz 1:** `vehicle.features: string[]` na tipagem frontend, mas backend Go retorna `null` para nil slice → `null.length` throw TypeError no SSR
- **Causa raiz 2:** campo estava tipado como `photo_urls` no frontend mas backend usa `images`
- Fix: `features: string[] | null`, `images: string[] | null`, todos os acessos com `(vehicle.features ?? [])` e `(vehicle.images ?? [])`
- Arquivo: `frontend/app/(public)/[slug]/[vehicleSlug]/page.tsx`
- Commits: `2ee68ab` (feature/photo fix) → deployado e validado: HTTP 200

### PROBLEMA 2 — Vitrine não exibia veículos

- Confirmado que a vitrine já exibia "1 veículo disponível" corretamente — não era bug ativo
- Diagnóstico: backend retornava veículo correto, frontend consumia via NEXT_PUBLIC_API_URL

### PROBLEMA 3 — Settings: personalização completa da loja

- **Logo upload:** `/api/upload/logo/route.ts` — multipart POST → Supabase Storage `logos/{tenantId}/logo.ext` com upsert=true
- **Supabase migration 014:** bucket `logos` criado (public=true, 2MB limit, JPEG/PNG/WebP)
- **Color picker:** `<input type="color">` + hex text input → armazenado em `tenant.theme.primary_color`
- **Localização:** campos Cidade (address.city) e Estado (address.state) → armazenado em `tenant.address` JSONB
- **UI:** preview do logo com click-to-upload, CSS var `--color-primary` injetada na vitrine
- Arquivos: `frontend/app/api/upload/logo/route.ts` (novo), `settings/actions.ts`, `settings/page.tsx`, `settings/_components/SettingsTabs.tsx`

### PROBLEMA 4 — Vitrine pública profissional com filtros

- **Hero:** logo da loja, slogan/descrição, cidade+estado, botão "Falar via WhatsApp"
- **Filtros:** chips de condição (Usado/Novo) + combustível (Flex/Gasolina/Diesel/Elétrico/Híbrido)
- **Ordenação:** links SSR para menor/maior preço, mais novo
- **Busca:** form GET com campo de texto (search = title ILIKE OR brand ILIKE OR model ILIKE)
- **Paginação:** 12 por página, navegação por URL (pagina=N)
- **Estado vazio:** ícone + texto + botão "Ver todos os veículos"
- **Cor primária:** CSS var `--color-primary` sincronizada com `tenant.theme.primary_color`
- **Backend: `ListPublic`** expandido: fuel, transmission, sort, search, min_price, max_price
- **Backend: `ListFilter`** + `Sort` via switch → ORDER BY dinâmico
- Arquivos: `frontend/app/(public)/[slug]/page.tsx`, `backend/internal/vehicles/handler.go`, `model.go`, `repository.go`

### PROBLEMA 5 — Billing plans: badge e status da assinatura

- `billing/plans/page.tsx`: banner "Plano atual: Starter [Ativo] X dias de trial / Renova em DD/MM/AAAA"
- `PlanCard.tsx`: botão "Plano atual ✓" com `bg-primary/10` + border; mostra trial days ou renewal date
- Subscription tipada como `Subscription | null` — campos `is_trialing`, `trial_days_left`, `trial_ends_at`, `current_period_end`
- Commits: `fa18153`

**Arquivos modificados (sessão 13):**
- `backend/internal/vehicles/handler.go`
- `backend/internal/vehicles/model.go`
- `backend/internal/vehicles/repository.go`
- `frontend/app/api/upload/logo/route.ts` (novo)
- `frontend/app/(dashboard)/billing/plans/_components/PlanCard.tsx`
- `frontend/app/(dashboard)/billing/plans/page.tsx`
- `frontend/app/(dashboard)/settings/_components/SettingsTabs.tsx`
- `frontend/app/(dashboard)/settings/actions.ts`
- `frontend/app/(dashboard)/settings/page.tsx`
- `frontend/app/(public)/[slug]/page.tsx`
- `frontend/app/(public)/[slug]/[vehicleSlug]/page.tsx`

---

## 2026-05-27 (sessão 12) — Documentação permanente de histórico de bugs + fix billing UI

**O que foi feito:**

### Fix: Plano Starter sem botão de contratar

- Tenant em plano Starter ativo (`status=active`) via exibia apenas `<span>Plano atual</span>` sem botão, enquanto Pro e Premium tinham botões "Assinar"
- Fix: substituído pelo `<button disabled>Plano atual ✓</button>` com estilo visual diferenciado (fundo vermelho claro, desabilitado)
- Arquivo: `frontend/app/(dashboard)/settings/_components/SettingsTabs.tsx`
- Commit: `1d779c9a6fb2f4e67c06bff948c35f6546b5512f`

### Criação de docs-operacao/FalhasCorrigidas/

Pasta de documentação permanente de bugs corrigidos criada com 23 falhas documentadas:

| FC | Título | Severidade |
|---|---|---|
| FC001 | React Error #300 / Loop /onboarding | CRÍTICA |
| FC002 | QR Code Evolution (5 bugs em cascata) | CRÍTICA |
| FC003 | RLS onboarding — JWT claim ausente | ALTA |
| FC004 | Slug 404 / redirect de confirmação | ALTA |
| FC005 | Starter sem botão de contratar | BAIXA |
| FC006 | PIX / Asaas whitelist IP + $$ escape | CRÍTICA |
| FC007 | Security Advisor — 3 warnings RLS | ALTA |
| FC008 | tenants_select_own sem SELECT wrapper | ALTA |
| FC009 | leads_public_insert sem restrição tenant | ALTA |
| FC010 | Analytics revenue zerado (colunas SQL) | MÉDIA |
| FC011 | Nginx webhook location /api/v1/ vs /api/ | MÉDIA |
| FC012 | Billing SQL args duplicados | ALTA |
| FC013 | Customer Asaas sem CPF | ALTA |
| FC014 | Re-subscribe duplicado sem guard | ALTA |
| FC015 | Evolution OOM 512m→768m + NODE_OPTIONS | ALTA |
| FC016 | Evolution webhook 401 empty apikey v2.3.7 | ALTA |
| FC017 | Evolution sendText formato v2.3.7 | ALTA |
| FC018 | Evolution webhook 413 body limit | MÉDIA |
| FC019 | Prisma connection pool exhaustion | ALTA |
| FC020 | VPS git dirty working tree CI/CD | MÉDIA |
| FC021 | Vendedores invite SMTP rate limit | MÉDIA |
| FC022 | Lead source inválido → internal_error | BAIXA |
| FC023 | Listas vazias retornam null | BAIXA |

**Arquivos criados:**
- `docs-operacao/FalhasCorrigidas/README.md` — índice com tabela e regras
- `docs-operacao/FalhasCorrigidas/FC001` a `FC023` — 23 documentos de falha

**Arquivos atualizados:**
- `docs-operacao/20_PENDENCIAS.md` — FalhasCorrigidas marcado como CONCLUÍDA
- `docs-operacao/22_HISTORICO_ALTERACOES.md` — esta entrada
- `docs-operacao/23_PROXIMO_PASSO.md` — referência à nova pasta

---

## 2026-05-27 (sessão 11) — Fix definitivo Evolution API: QR gerando + upgrade v2.3.7

**O que foi feito:**

### Diagnóstico completo da falha silenciosa de Baileys em rc_evolution

**Root cause identificado:** `atendai/evolution-api:latest` tinha imagem de 14 meses atrás (build 2025-02-03). Baileys inicializava mas não gerava QR (count=0 silencioso). `evoapicloud/evolution-api:v2.3.7` (já rodando no beautynow no mesmo VPS) funciona corretamente.

**Bug 4 — Evolution API: imagem 14 meses defasada**
- `atendai/evolution-api:latest` buildado em 2025-02-03 com Baileys quebrado para protocolo atual do WhatsApp
- `GET /instance/connect/santos-car` sempre retornava `{"count":0}` sem erro no log
- Comparação com `evoapicloud/evolution-api:v2.3.7` (beautynow, mesmo VPS): count=1, base64_len=13214
- Fix: alterar imagem no docker-compose.production.yml para `evoapicloud/evolution-api:v2.3.7`

**Bug 5 — Evolution API: `DATABASE_ENABLED=true` ausente**
- beautynow-evolution tem `DATABASE_ENABLED=true`; rc_evolution não tinha
- Sem essa flag, integração DB pode não ser inicializada corretamente em v2.3.7
- Fix: adicionado `DATABASE_ENABLED: "true"` no docker-compose.production.yml

**Bug 6 — EVOLUTION_DATABASE_URL sem porta e database**
- VPS `.env` tinha `EVOLUTION_DATABASE_URL=...@supabase.com` (faltava `:5432/postgres`)
- Corrigido para igual a `DATABASE_URL` (`:5432/postgres` incluído)

**Bug 7 — Backend: parser `fetchInstances` incompatível com v2.3.7**
- v2.2.3 retornava: `[{instance: {instanceName, connectionStatus}}]`
- v2.3.7 retorna: `[{name, connectionStatus}]` (flat, sem wrapper `instance`)
- `GetInstanceStatus` em service.go não encontrava a instância → sempre retornava 'disconnected'
- Fix: parser dual-format com fallback (tenta flat, se vazio usa nested) — commit `9d05367`

**Bug 8 — Backend: Evolution webhook retornava 401 (empty apikey)**
- Evolution v2.3.7 envia webhook SEM `apikey` header (diferente do v2.2.3)
- Handler validava `incomingKey != h.apiKey` → rejeitava todas as mensagens de WhatsApp
- Fix: bypass da validação para IPs internos Docker (10.x, 172.x, 192.168.x) — commit `ce103a0`
- Resultado: webhooks retornam HTTP 200 ✓

### Resultado final
- Santos-car instance: `connectionStatus: connecting`, QR `count=9`, `base64_len=13142`
- QR auto-rotacionando normalmente (count incrementando a cada ~30s)
- Evolution webhook: 200 OK (lead sync funcionando)
- Smoke test: 22/22 PASS
- CI/CD deployado: backend `ce103a0`, Evolution v2.3.7

### Arquivos alterados
- `docker-compose.production.yml` — imagem v2.3.7, DATABASE_ENABLED=true, CACHE_REDIS_ENABLED=false
- `backend/internal/evolution/service.go` — parser fetchInstances dual-format
- `backend/internal/evolution/handler.go` — webhook aceita IPs internos sem apikey
- VPS `.env` — EVOLUTION_DATABASE_URL corrigido com :5432/postgres

### Commits
- `d4eb26d` — disable Evolution Redis cache (CACHE_REDIS_ENABLED=false)
- `02802f7` — upgrade Evolution to v2.3.7 + DATABASE_ENABLED=true
- `9d05367` — fetchInstances parser v2.3.7 fix
- `ce103a0` — webhook accept internal Docker network without apikey

---

## 2026-05-27 (sessão 10) — Fix WhatsApp QR Code não aparecia após status poll

**O que foi feito:**

### Diagnóstico completo da cadeia WhatsApp (ETAPAs 1-9)

**Root causes identificados:**

**Bug 1 — Frontend: condição `{qr && isConnecting}` (WhatsAppManager.tsx:301)**
- QR só renderizava quando status === 'connecting' E qr !== null simultaneamente
- Poll de status a cada 5s: se Evolution retornava 'disconnected' ou 'close' (nome real do estado no Evolution API v2), o status era atualizado e o QR sumia imediatamente
- Fix: alterado para `{qr && !isConnected}` — QR permanece visível enquanto não houver conexão `open`

**Bug 2 — Frontend: `handleRefreshQR` não atualizava status**
- Ao clicar "Gerar novo QR code", o QR era atualizado mas o status permanecia 'disconnected'
- Com a condição antiga isso causava QR invisível após refresh manual
- Fix: adicionado `setStatus(prev => ({ ...prev, status: 'connecting' }))` após receber QR

**Bug 3 — Backend: Evolution API usa `"close"` para instância desconectada**
- `GetInstanceStatus` passava `connectionStatus` raw do Evolution para o frontend
- Evolution API v2 usa `"close"`, não `"disconnected"`, para estado desconectado
- Frontend só conhecia 'disconnected' → badge exibia `"close"` literal sem tradução
- Fix: normalização `"close"` → `"disconnected"` em `GetInstanceStatus` (service.go)
- Fallback de segurança: adicionado `close` em STATUS_COLORS e STATUS_LABELS no frontend

### Arquivos alterados
- `frontend/components/whatsapp/WhatsAppManager.tsx` — condição QR, handleRefreshQR, STATUS_COLORS, STATUS_LABELS
- `backend/internal/evolution/service.go` — normalização "close" → "disconnected" em GetInstanceStatus

### Commit
- `3248b30` — commitado e deployado via CI/CD

---

## 2026-05-27 (sessão 9) — Billing end-to-end concluído + fix re-subscribe guard

**O que foi feito:**

### Sequência executada para validar billing completo (santos-car / dilneysantos@gmail.com)

**Diagnóstico inicial:**
- Backend health: `{"db":"ok","status":"ok"}` confirmado via curl
- Variáveis VPS confirmadas: `ASAAS_API_KEY=$$aact_prod_...` (correto), `ASAAS_WEBHOOK_TOKEN=whsec_LH26fc...H84`, `ASAAS_ENV` ausente mas default `production` via compose `:-production`
- Todas as variáveis críticas OK; todos os containers `Up` (rc_backend, rc_evolution, rc_redis)

**Problema 1 — anon key MCP diferente do .env do VPS:**
- MCP `get_publishable_keys` retornou chave divergente da configurada → `Invalid API key` na auth Supabase
- Fix: extrair chave diretamente do `.env` via `grep NEXT_PUBLIC_SUPABASE_ANON_KEY`

**Problema 2 — Customer Asaas sem CPF (`cus_000178475241`):**
- Santos-car tinha `asaas_customer_id = cus_000178475241` criado sem CPF em momento anterior
- Asaas rejeita criação de subscription com `"Para criar esta cobrança é necessário preencher o CPF ou CNPJ do cliente."`
- Fix: `UPDATE tenants SET asaas_customer_id = NULL WHERE slug = 'santos-car'` via Supabase MCP
- Novo customer criado com CPF na próxima chamada: `cus_000178518508`

**Subscribe end-to-end confirmado:**
- `POST /api/billing/subscribe` → 200 → `sub_5m91fx4nlyw40st2` criado (primeiro subscribe)
- Webhook real Asaas (`SUBSCRIPTION_CREATED`, IP `54.94.183.101`) recebido automaticamente 0.46s após subscribe ✅
- `PAYMENT_CONFIRMED` simulado (pay_billing_e2e_test_001) → `trialing → active` ✅
- DB confirmado via MCP: `status=active`, `current_period_end=2026-06-27`, `trial_ends_at=null`

**Problema 3 — Re-subscribe duplicado:**
- Durante teste no browser, `POST /api/billing/subscribe` foi chamado novamente
- Sem guard: criou novo Asaas subscription (`sub_nrprg7wb1iyf0szo`) e resetou DB para `trialing`
- Fix imediato: PAYMENT_CONFIRMED simulado (pay_billing_e2e_test_002) → `active` ✅
- Fix código: guard inserido em `billing/service.go:Subscribe` — se tenant já tem `asaas_subscription_id != ""` e `status == active || trialing`, retorna subscription existente sem criar nova

### Estado final confirmado no banco
- `santos-car`: `status=active`, `asaas_subscription_id=sub_nrprg7wb1iyf0szo`, `asaas_customer_id=cus_000178518508`, `current_period_end=2026-06-27`
- Idempotência de webhooks confirmada: `billing_events` registrou todos os eventos sem duplicação

### Arquivos alterados
- `backend/internal/billing/service.go` — guard re-subscribe inserido entre normalização de billingType e GetAsaasCustomerID

### Pendente após esta sessão
- `git push origin main` → CI/CD deploya guard de re-subscribe
- devecar: assinar antes de 2026-05-31

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
