# 20 — PENDÊNCIAS

> Atualizado em: 01/08/2026 (sessão 61 — FC065: SSL crítico corrigido; novas pendências de backlog registradas)
> Atualizar este arquivo ao iniciar ou concluir cada tarefa.

---

## Como Usar Este Arquivo

- **PENDENTE** → tarefa não iniciada
- **EM ANDAMENTO** → iniciada nesta sessão
- **CONCLUÍDA** → mover para `22_HISTORICO_ALTERACOES.md`

---

## Infraestrutura

| Status | Tarefa | Prioridade | Detalhes |
|---|---|---|---|
| CONCLUÍDA | VPS Hostinger | — | Contratada e configurada |
| CONCLUÍDA | Docker Compose produção | — | `docker-compose.production.yml` ativo |
| CONCLUÍDA | CI/CD GitHub Actions | — | test → build → deploy → smoke-test |
| CONCLUÍDA | SSL Let's Encrypt | — | api + evolution com renovação automática. **Nota (01/08/2026, FC065):** a renovação estava de fato quebrada há semanas (`authenticator = standalone` conflitando com Nginx na porta 80) — certificado chegou a 10 dias de expirar sem ninguém perceber, até o smoke test do CI acusar. Corrigido para `webroot`, `--dry-run` validado. Ver `FalhasCorrigidas/FC065`. |
| CONCLUÍDA | Nginx reverse proxy | — | rate limiting, cache, security headers |
| CONCLUÍDA | Fix nginx webhook location | — | `^/api/v1/webhooks/` → `^/api/webhooks/` — rate limit estava sendo ignorado (commit 39b5a38) |
| CONCLUÍDA | Self-hosted runner | — | Runner ativo no VPS |
| CONCLUÍDA | Evolution OOM fix | — | NODE_OPTIONS heap + 768m + Redis cache (commit d17025e) |
| CONCLUÍDA | Backup S3 | — | FC043: aws-cli no startup, path YYYY/MM, verify pós-upload, lifecycle 30d, restore-from-s3.sh (sessão 49) |

---

## Backend

| Status | Tarefa | Prioridade | Detalhes |
|---|---|---|---|
| CONCLUÍDA | Go REST API | — | Todos os módulos implementados |
| CONCLUÍDA | Multi-tenant isolamento | — | RLS + JWT + tenant middleware |
| CONCLUÍDA | Billing Asaas | — | Subscribe, webhooks, grace period |
| CONCLUÍDA | Evolution API | — | Webhook receiver, instâncias, envio |
| CONCLUÍDA | OpenRouter AI | — | classify-lead, suggest-reply |
| CONCLUÍDA | Prometheus metrics | — | Custom registry, coleta DB+negócio |
| CONCLUÍDA | BetterStack logging | — | Tee zap → stdout + HTTP |
| CONCLUÍDA | Onboarding setup | — | Transação + idempotência |
| CONCLUÍDA | Fix analytics revenue zero | — | Colunas erradas no SQL: `final_value`→`sale_price`, `completed_at`→`sold_at` (commit 0b32a6d) |
| CONCLUÍDA | Fix lead source validation | — | `source` inválido causava `internal_error` opaco; validação adicionada (commit 43c65ee) |
| CONCLUÍDA | Endpoint receptor webhook landing lead | — | `POST /api/webhooks/landing-lead` — deployado e operacional; Evolution/WA opcionais (sessão 31) |
| CONCLUÍDA | Fix nil slice → null em respostas | — | `response.normalizeSlice()` + remove omitempty de Data; listas vazias retornam `[]` (commit 43c65ee) |
| CONCLUÍDA | Endpoint upgrade de plano | — | `PUT /api/billing/subscription` — troca plano de assinatura ativa via Asaas PUT; frontend detecta `is_active && !isCurrent` e usa modo upgrade (sessão 16) |

---

## Frontend

| Status | Tarefa | Prioridade | Detalhes |
|---|---|---|---|
| CONCLUÍDA | Next.js 16 SSR | — | App Router, Server Components |
| CONCLUÍDA | Auth flow completo | — | Registro → confirmação → onboarding → dashboard |
| CONCLUÍDA | Fix: login → /onboarding incorreto | — | getTenantForUser reescrito com 2 queries explícitas (sem embedded join) |
| CONCLUÍDA | Fix: dashboard loop /onboarding (service role key) | — | getTenantForUser migrado para session client; middleware.ts → proxy.ts |
| CONCLUÍDA | Configurar SUPABASE_SERVICE_ROLE_KEY no Vercel | — | Configurado; getTenantForUser agora tem fallback service role |
| CONCLUÍDA | Corrigir loop /onboarding para usuários com JWT sem claim | — | SQL patch + getTenantForUser com service role fallback (commit b5685c2) |
| CONCLUÍDA | Fix updateSupabaseAppMetadata no backend | — | Retry 3x + logging estruturado (zap) + leitura do body de erro (sessão 3) |
| PENDENTE | Testar login + dashboard em produção (browser) | Baixa | Validado via API; confirmar no browser que dilneysantos@gmail.com acessa /dashboard sem loop |
| CONCLUÍDA | Fix BUG 1: Vendedores invite | — | inviteUserByEmail → generateLink; UX "Novo vendedor"; roles só Vendedor/Visualizador |
| CONCLUÍDA | Fix BUG 2 (código): Billing Asaas 403 mensagem | — | asaasUserErr() em billing/service.go |
| CONCLUÍDA | Fix BUG 2 (config): Asaas IP Whitelist | — | 2.24.67.84 adicionado em www.asaas.com (production) — sessão 8 |
| CONCLUÍDA | Fix billing: API key `$$` Docker Compose | — | Restaurado `$$aact_prod_` no .env do VPS — escape correto para dupla interpolação |
| CONCLUÍDA | Fix billing: UpdateSubscriptionAsaas SQL bug | — | tenantID duplicado nos args, $2 nunca usado — commit 71d6ba6 |
| CONCLUÍDA | Confirmar billing subscribe end-to-end | — | Confirmado sessão 9: santos-car subscribe → cus_000178518508 (com CPF) → sub_nrprg7wb1iyf0szo → PAYMENT_CONFIRMED webhook → status active (2026-05-27) |
| CONCLUÍDA | Fix re-subscribe duplicado (guard service.go) | — | Guard inserido em billing/service.go:Subscribe — retorna subscription existente se status active/trialing com asaas_subscription_id preenchido |
| CONCLUÍDA | Deploy guard re-subscribe | — | commit 4cd5dee deployado via CI/CD |
| CONCLUÍDA | Fix WhatsApp QR Code não aparecia | — | 3 bugs corrigidos: condição frontend + handleRefreshQR + normalização "close"→"disconnected" backend (commit 3248b30) |
| CONCLUÍDA | Fix Evolution API não gerava QR (Baileys silent failure) | — | 8 bugs: imagem 14m defasada → upgrade v2.3.7, DATABASE_ENABLED, CACHE_REDIS desabilitado, parser fetchInstances, webhook internal IP (commits d4eb26d→ce103a0) |
| CONCLUÍDA | Reconectar Central de Atendimento santos-car | — | Instância `santos-car` open (554888482877); feature `has_central_atendimento` concedida via tenant_features — sessão 22 |
| CONCLUÍDA | devecar subscribe antes de 2026-05-31 | — | Assinatura ativada via Supabase MCP (sessão 19): status=active, plano Pro, period_end=2026-06-27 |
| CONCLUÍDA | Fix vehicle detail 500 (digest 4250320451) | — | features null + photo_urls→images — commit 2ee68ab |
| CONCLUÍDA | Fix billing trial — botão bloqueado durante trialing | — | isActiveAndCurrent = isCurrent && !isTrialing — commit 81eceb5 |
| CONCLUÍDA | Fix cabeçalho duplo na loja pública | — | Removido header sticky do layout.tsx — commit 81eceb5 |
| CONCLUÍDA | Fix cores hardcoded na loja pública | — | Tailwind primary usa rgb(var(--primary)/α), store layout injeta canais RGB do tenant — commit 81eceb5 |
| CONCLUÍDA | Settings: logo upload + cor + localização | — | /api/upload/logo, logos bucket, theme.primary_color, address.city/state — commit fa18153 |
| CONCLUÍDA | Vitrine pública profissional com filtros | — | Hero c/ logo/slogan/cidade, filtros chip, ordenação, busca, paginação — commit fa18153 |
| CONCLUÍDA | Billing plans: badge + status + trial/renovação | — | Banner summary + PlanCard "Plano atual ✓" + trial days/renewal date — commit fa18153 |
| CONCLUÍDA | Fix BUG 3 (código): WhatsApp refreshStatus silencioso | — | handleRefreshStatusManual com toast |
| CONCLUÍDA | Diagnosticar Evolution API no VPS pós-OOM fix | — | Evolution respondendo 200 + 401 sem key — confirmado sessão 7 |
| CONCLUÍDA | Fix BUG 4: Settings/Plan botões mortos | — | planError/planSuccess states; banner trial |
| CONCLUÍDA | Fix BUG 5: Settings/Users invite modal | — | + Convidar Membro com roles Administrador/Gerente |
| CONCLUÍDA | Dashboard com KPIs | — | Métricas principais |
| CONCLUÍDA | Módulo Leads/CRM | — | Lista, kanban, atividades |
| CONCLUÍDA | Landing page — fluxo completo (sessões 31) | — | Formulário + API + Supabase + /admin/leads + /admin/leads/[id]; migrations 028-031; backend CONGELADO |
| CONCLUÍDA | Landing page — hero reformulado (sessão 38) | — | Formulário → CTA direto /register; logo tipográfico; copy novo; fluxo de leads backend inalterado |
| CONCLUÍDA | Auth — auditoria e correções (sessão 38) | — | FC035 forgot-password appUrl; login "Email not confirmed" msg; email confirmation ON; password "No requirements"; AUTH APROVADO |
| CONCLUÍDA | UX ativação lojista (sessão 39) | — | 9 problemas corrigidos no fluxo cadastro→onboarding: /vehicles/new→/vehicles; tab=contact; pré-fill; erros amigáveis; logo 80px; aviso spam — commit `ee85f9c` |
| CONCLUÍDA | Navegação dark theme (sessão 40) | — | Sidebar `bg-gray-900`; topbars `bg-gray-900/90 backdrop-blur`; logo sidebar/mobile com frame `border-primary/30` — commit `cb03ab2` |
| CONCLUÍDA | Auditoria branding fluxo Landing→Lead (sessão 40) | — | 3 correções: focus ring onboarding; bg-primary/8→/10; `--primary` em vehicle detail — commit `1dc7460` |
| CONCLUÍDA | Admin leads — pipeline comercial (sessão 31) | — | Filtros, paginação, status 5-estados, alerta 4h, notas, próxima ação, último contato |
| CONCLUÍDA | Módulo Veículos | — | CRUD + vitrine pública SEO |
| CONCLUÍDA | Módulo Clientes | — | CRUD |
| CONCLUÍDA | Módulo Financeiro | — | Entradas, saídas, fluxo de caixa |
| CONCLUÍDA | Módulo Vendas | — | Pipeline + comissões |
| CONCLUÍDA | Módulo Analytics | — | Plano Pro+ apenas |
| CONCLUÍDA | Settings e Equipe | — | Configurações da loja e vendedores |
| CONCLUÍDA | WhatsApp screen (Central de Atendimento) | — | QR code, status, envio — sem linguagem de bulk/spam |
| CONCLUÍDA | Refatoração estratégica WhatsApp (sessão 17) | — | Separação CONCEITO 1 (Central de Atendimento: Evolution/CRM) e CONCEITO 2 (Contato Público da Loja: vitrine). Menu → "Central de Atendimento". Settings → aba "Contato Público". Vitrine pública exibe contato público. Ver `22_HISTORICO_ALTERACOES.md` sessão 17 |
| CONCLUÍDA | Billing screens | — | Assinatura, planos, faturas |
| CONCLUÍDA | Reestruturação planos Start/Pro/Performance/Scale (sessão 18) | — | Migration 019: renomear planos, tagline, limites, features, gate central_atendimento; backend gate + tagline; billing plans premium redesign |
| CONCLUÍDA | FASE 2: feature flags reais + tenant_features (sessão 19) | — | Migration 020: tenant_features table, PlanGate UNION ALL, super_admin role, onboarding v2 triggers |
| CONCLUÍDA | FASE 2: painel admin super_admin (sessão 19) | — | /admin com layout protegido, tabela de tenants, ações admin (ativar/bloquear/feature/trial), API proxy catch-all |
| CONCLUÍDA | FASE 2: OnboardingChecklist widget no dashboard (sessão 19) | — | 4 passos obrigatórios + WhatsApp opcional; integrado no /dashboard; triggers DB automáticos |
| CONCLUÍDA | FASE 2: fix hardcode plan_name em /whatsapp (sessão 19) | — | Substituído `planName !== 'start'` por `usage?.has_central_atendimento` |
| CONCLUÍDA | FASE 3 auditoria regressão: fix deploy freeze Vercel (sessão 21) | — | `database.types.ts` regenerado (migrations 018–021); `tenant.ts` cast unknown; 8 deploys consecutivos falhando desde sessão 15 — FC029 |
| CONCLUÍDA | FASE 4: reestruturação comercial Premium + Add-ons (sessão 22) | — | Migration 022: performance→premium, features por plano, features em plan_addons, get_tenant_usage 3-way merge; plan_gate 3º UNION ALL; billing add-ons endpoints; /billing/addons page; sidebar reorganizada; /billing/plans 3 cards — commit `bdefe75` |
| CONCLUÍDA | Sidebar refactor definitivo (sessão 23 cont. 2) | — | NAV_BASE: Clientes incluído, Vendas/Comissões/Vendedores removidos; NAV_PRO: Atendimento+Analytics (has_crm); NAV_PREMIUM: Automações+Campanhas (has_api_access); Sub-navs Financeiro/Billing; WhatsApp em Configurações — commits `b22fb2a` `51def30` |

---

## Banco de Dados

| Status | Tarefa | Prioridade | Detalhes |
|---|---|---|---|
| CONCLUÍDA | Schema completo | — | Todas as tabelas com RLS |
| CONCLUÍDA | Migrations 001-008 | — | Billing, vendors, auditoria |
| CONCLUÍDA | Triggers | — | Grace period, limites de plano, trial automático |
| CONCLUÍDA | Indexes de performance | — | Migration 011: 14 indexes + RLS policy optimization (SELECT auth.function()) aplicados (26/05/2026) |
| CONCLUÍDA | Migration 012: SECURITY DEFINER revoke | — | REVOKE de PUBLIC/anon/authenticated; GRANT só para service_role (26/05/2026) |
| CONCLUÍDA | Migration 013: leads insert + storage | — | leads_public_insert restrito a anon + tenant ativo; vehicles_public_read removida (26/05/2026) |
| CONCLUÍDA | Migration 018: tenant_public_contacts + tenant_whatsapp_sessions | — | Tabelas separadas para contato público da vitrine e sessão da Central de Atendimento — RLS, indexes, triggers (28/05/2026 — sessão 17) |
| CONCLUÍDA | Migration 019: reestruturação de planos | — | Planos renomeados (start/pro/performance/scale), tagline, limites, features, gate central_atendimento, ENUM→TEXT, plan_usage view recriada (28/05/2026 — sessão 18) |
| CONCLUÍDA | Migration 020: feature flags + super_admin + onboarding v2 | — | tenant_features table, super_admin role, onboarding received_first_lead/whatsapp_connected + triggers (28/05/2026 — sessão 19) |
| CONCLUÍDA | Migration 022: reestruturação comercial Premium + add-ons features | — | performance→premium, features por plano, features JSONB em plan_addons, get_tenant_usage 3-way merge (28/05/2026 — sessão 22) |
| CONCLUÍDA | Migration 023: fix get_tenant_usage — branch tenant_features ausente | — | Migration 022 foi aplicada sem o UNION ALL de tenant_features; corrida aplicada e verificada (28/05/2026 — sessão 22) |
| CONCLUÍDA | Reconectar Central de Atendimento santos-car | — | Instância Evolution `santos-car` já estava `open` (554888482877). Feature `central_atendimento` concedida via tenant_features. Merge RPC corrigido (migration 023) — sessão 22 |
| CONCLUÍDA | Regenerar database.types.ts após Migration 022 | — | plan_addons.features + get_tenant_usage.features + plan_name/sub_status TEXT; commit `b34e188` — sessão 22 |
| CONCLUÍDA | Migration 024: RLS plan_addons + rename premium→performance | — | plan_addons sem RLS (risco R4 parcial); plano 3 renomeado para performance/Performance; database.types.ts regenerado — sessão 23 |
| CONCLUÍDA | Auditoria de riscos conhecidos (sessão 23) | — | R4 parcial corrigido; R9/R10/R5 verificados e OK; riscos operacionais documentados em 19_RISCOS.md |
| CONCLUÍDA | Verificação reestruturação estratégica completa (sessão 23) | — | Todas as 10 etapas da reestruturação confirmadas como implementadas — ver 22_HISTORICO_ALTERACOES.md |

---

## FlutterFlow

**CANCELADO em 22/05/2026** — Migração para FlutterFlow descartada. Ver D12 em `21_DECISOES_TECNICAS.md`.
Frontend Next.js continua como stack oficial.

---

## Observabilidade

| Status | Tarefa | Prioridade | Detalhes |
|---|---|---|---|
| CONCLUÍDA | Prometheus metrics | — | endpoint /metrics |
| CONCLUÍDA | BetterStack logs | — | Tee zap |
| CONCLUÍDA | Uptime monitoring | — | Cron job `/opt/revendaclick/scripts/health-check.sh` rodando a cada 5 min no VPS; checa api+evolution+frontend; falhas logadas em `/var/log/rc_health.log` e enviadas ao BetterStack via HTTP Bearer (sessão 37) |
| BACKLOG | Alertas automáticos | — | FC044: reclassificado — não bloqueia operação comercial. BetterStack: alerta para status >= 500. Retomar quando definido. |

---

## Segurança

| Status | Tarefa | Prioridade | Detalhes |
|---|---|---|---|
| CONCLUÍDA | Security headers Nginx | — | HSTS, X-Frame-Options, etc. |
| CONCLUÍDA | Rate limiting Nginx | — | Por zona (api, evo, webhook) |
| CONCLUÍDA | Métricas protegidas | — | Bearer token + IP restriction |
| CONCLUÍDA | Input validation | — | MaxBodySize + slug/email regex |
| CONCLUÍDA | Supabase advisor warnings (WARN) | — | Todos 3 advisors: migration 011 (RLS), 012 (functions), 013 (leads insert + storage) |
| BACKLOG | Leaked password protection | — | FC044: reclassificado — não bloqueia operação. Requer Supabase Pro (HaveIBeenPwned.org). Retomar quando upgrade Supabase for justificado comercialmente. |
| PENDENTE | Rotação de secrets | Baixa | Política semestral: ASAAS_API_KEY, EVOLUTION_API_KEY, METRICS_TOKEN — atualizar no .env do VPS + no Asaas Dashboard + reiniciar containers |

---

## Documentação

| Status | Tarefa | Prioridade | Detalhes |
|---|---|---|---|
| CONCLUÍDA | docs-operacao/ (25 arquivos) | — | Memória viva do projeto |
| CONCLUÍDA | FLUTTERFLOW_MIGRATION.md | — | Guia completo de migração |
| CONCLUÍDA | Runbook de incidentes | — | `24_RUNBOOK_INCIDENTES.md` — 10 cenários com diagnóstico e solução |
| CONCLUÍDA | Sync docs ↔ código (sessão 5) | — | 11_DOCKER.md, 16_EVOLUTION.md, 19_RISCOS.md, 24_RUNBOOK atualizados para refletir commit d17025e (Redis + 768m + NODE_OPTIONS) |
| CONCLUÍDA | FalhasCorrigidas/ — histórico permanente de bugs | — | 42 falhas documentadas em `docs-operacao/FalhasCorrigidas/` (FC001–FC042) com causa raiz, correção, commits e prevenção |
| CONCLUÍDA | FC038 — ESLint 13 erros acumulados (sessão 46) | — | 5x `<a>→<Link>`, react-hooks/purity server component, unescaped entities, eslint-disable não utilizados, comentário "Performance"→"Premium" — commit `4ff2d3e` |
| CONCLUÍDA | FC039 — Hardening Final e Auditoria Operacional (sessão 47) | — | 500 ListTenants enum cast; NavItem `<a>`→`<Link>`; proxy.ts +/automations +/campaigns; sitemap /privacidade; REVOKE EXECUTE 6 trigger functions; landing_leads RLS WITH CHECK (false) — commit `0be8b4e` |
| CONCLUÍDA | FC040 — Supabase search_path + REVOKE FROM PUBLIC (sessão 47) | — | `SET search_path = public` em 8 funções; REVOKE FROM PUBLIC em 6 trigger functions (herança PUBLIC não coberta por FC039); advisor limpo de todos warnings de funções |
| CONCLUÍDA | FC042 — E2E Playwright: seletores e skip guards (sessão 48) | — | 7 arquivos corrigidos: `getByLabel` → `locator('#id')`; `isCredentialReady()`; spec 01 skip `E2E_EMAIL_CONFIRMATION_DISABLED`; tabs `a[href]`; display_names reais; 9/9 aprovados em produção |
| CONCLUÍDA | FC041 — Saneamento documental final (sessão 48) | — | 4 arquivos corrigidos: count FC 38→40 (e depois 41), próximo FC039→FC042, seção duplicada em memory removida — exclusivamente documental |
| CONCLUÍDA | FC033 — CancelSubscription cancela subscription_addons em cascata | — | Opção A implementada (sessão 30): cancelTenantAddons + ListActiveAddonIDs + CancelAllAddonsByTenantID — commit `529efb2` |
| CONCLUÍDA | Saneamento documental (sessão 26) | — | 4 divergências corrigidas; Coolify→Vercel em 03_FRONTEND + 06_AUTH + 10_INFRA + 02_MAPA; middleware.ts→proxy.ts; docs-operacao/prompts/ removido; MEMORY/PRODUCT_ARCH plan.name corrigidos |
| CONCLUÍDA | Tenant sandbox-revendaclick | — | Criado via SQL: slug `sandbox-revendaclick`, plano Pro active, period_end 2026-06-30. tenant_id: `e72eb104-98b7-4a71-946d-15e680496fc3` |
| CONCLUÍDA | E2E .env.e2e template | — | `frontend/.env.e2e` criado com variáveis para santos-car, sandbox e super_admin; `.env.e2e` adicionado ao .gitignore |
| CONCLUÍDA | METRICS_TOKEN confirmado | — | Token presente no VPS .env e no container; /metrics retorna 200 via localhost com Bearer token; nginx bloqueia acesso externo (correto) |
| CONCLUÍDA | FC044 — Reclassificação de pendências não prioritárias (sessão 50) | — | Backup S3 config, BetterStack Alerts, Leaked Password Protection movidos para Backlog de Infraestrutura — decisão de negócio: foco em comercialização |
| CONCLUÍDA | FC045 — Contagem documental de FCs desatualizada (sessão 51) | — | `23_PROXIMO_PASSO.md` (count 43→44, próximo FC044→FC045) + `FalhasCorrigidas/README.md` (FC044 no índice; seção Documentação; próximo FC045) — exclusivamente documental |

---

## Backlog de Infraestrutura

> Itens abaixo foram avaliados e deliberadamente adiados (FC044 — 13/06/2026).
> Decisão de negócio: não bloqueiam operação comercial, vendas, onboarding, billing, CRM ou estabilidade do produto.
> Retomar quando fizer sentido comercial ou técnico — sem data definida.

| Item | O que é | Quando retomar |
|---|---|---|
| **Backup S3** | Configurar vars `BACKUP_S3_BUCKET`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION` no `/opt/revendaclick/.env`. Container `rc_backup` e scripts já existem e estão prontos. | Quando crescimento de dados justificar redundância offsite |
| **BetterStack Alerts HTTP 500** | Criar alerta no BetterStack para logs backend com status >= 500 | Quando volume de usuários reais justificar monitoramento ativo |
| **Leaked Password Protection** | Supabase Dashboard → Authentication → Settings → Security → ON. Requer upgrade para Supabase Pro (HaveIBeenPwned.org) | Quando upgrade Supabase Pro for justificado por outros motivos (ex.: volume, SLA, compliance) |
| **Certificado SSL `api.beautynow.app.br`** | ~~Mesmo problema do FC065~~ — **corrigido também** (mesma sessão, a pedido): `evo.beautynow.app.br` estava sem DNS (NXDOMAIN), removido do certificado; reemitido só com `api.beautynow.app.br` via webroot (`api.beautynow.app.br-0001`, válido até 2026-10-30). **Achado durante a correção:** o tráfego público de `api.beautynow.app.br` passa pela Cloudflare, que serve seu próprio certificado (Google Trust Services) — o Let's Encrypt desta VPS pode não ser o que protege o usuário final; não foi possível confirmar se o Nginx desta VPS está de fato no caminho de servir esse domínio (`nginx -T` não mostra nenhum `server_name` para beautynow). | Investigar a arquitetura real de serving do beautynow (Coolify? Cloudflare Tunnel?) se for prioridade — fora do escopo do RevendaClick |
| **Regra de cálculo de comissão de vendedores** | `Regra de Comissão` existe no schema (`seller_commission_rules`: percentual ou valor fixo por vendedor), mas a fórmula de cálculo automático (percentual fixo/por faixa/por vendedor) nunca foi documentada como regra de negócio. MVP atual usa só valor previsto + status pago/não pago, sem depender disso. | Quando o cálculo automático de comissão for priorizado |
| **"Roadmap Finalização RevendaClick.docx"** | Documento antigo nunca analisado em detalhe — pode conter itens de roadmap não cobertos pela documentação atual (herdado do repositório de planejamento descontinuado). | Baixa prioridade — analisar se surgir dúvida sobre itens de roadmap não descritos em `docs-produto/07-roadmap.md` |
