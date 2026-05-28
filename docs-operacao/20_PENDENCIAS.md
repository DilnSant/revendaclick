# 20 — PENDÊNCIAS

> Atualizado em: 28/05/2026 (sessão 15)
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
| CONCLUÍDA | SSL Let's Encrypt | — | api + evolution com renovação automática |
| CONCLUÍDA | Nginx reverse proxy | — | rate limiting, cache, security headers |
| CONCLUÍDA | Fix nginx webhook location | — | `^/api/v1/webhooks/` → `^/api/webhooks/` — rate limit estava sendo ignorado (commit 39b5a38) |
| CONCLUÍDA | Self-hosted runner | — | Runner ativo no VPS |
| CONCLUÍDA | Evolution OOM fix | — | NODE_OPTIONS heap + 768m + Redis cache (commit d17025e) |
| PENDENTE | Backup S3 | Média | `BACKUP_S3_BUCKET` opcional — configurar bucket S3 e credenciais |

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
| PENDENTE | Reconectar Central de Atendimento santos-car | CRÍTICA | Instâncias Evolution foram resetadas na sessão 14. Acessar /whatsapp (Central de Atendimento) → "Conectar canal" → escanear QR |
| PENDENTE | devecar subscribe antes de 2026-05-31 | Alta | Trial expira 31/05 — fazer login com dilneysantos.developer@gmail.com e assinar starter |
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
| CONCLUÍDA | Módulo Veículos | — | CRUD + vitrine pública SEO |
| CONCLUÍDA | Módulo Clientes | — | CRUD |
| CONCLUÍDA | Módulo Financeiro | — | Entradas, saídas, fluxo de caixa |
| CONCLUÍDA | Módulo Vendas | — | Pipeline + comissões |
| CONCLUÍDA | Módulo Analytics | — | Plano Pro+ apenas |
| CONCLUÍDA | Settings e Equipe | — | Configurações da loja e vendedores |
| CONCLUÍDA | WhatsApp screen (Central de Atendimento) | — | QR code, status, envio — sem linguagem de bulk/spam |
| CONCLUÍDA | Refatoração estratégica WhatsApp (sessão 17) | — | Separação CONCEITO 1 (Central de Atendimento: Evolution/CRM) e CONCEITO 2 (Contato Público da Loja: vitrine). Menu → "Central de Atendimento". Settings → aba "Contato Público". Vitrine pública exibe contato público. Ver `22_HISTORICO_ALTERACOES.md` sessão 17 |
| CONCLUÍDA | Billing screens | — | Assinatura, planos, faturas |

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
| PENDENTE | Uptime monitoring | Baixa | Cadastrar monitor em UptimeRobot/BetterStack Uptime → URL: `https://api.revendaclick.com.br/health` → alerta por email |
| PENDENTE | Alertas automáticos | Baixa | BetterStack: criar alerta para status >= 500 nos logs do backend |

---

## Segurança

| Status | Tarefa | Prioridade | Detalhes |
|---|---|---|---|
| CONCLUÍDA | Security headers Nginx | — | HSTS, X-Frame-Options, etc. |
| CONCLUÍDA | Rate limiting Nginx | — | Por zona (api, evo, webhook) |
| CONCLUÍDA | Métricas protegidas | — | Bearer token + IP restriction |
| CONCLUÍDA | Input validation | — | MaxBodySize + slug/email regex |
| CONCLUÍDA | Supabase advisor warnings (WARN) | — | Todos 3 advisors: migration 011 (RLS), 012 (functions), 013 (leads insert + storage) |
| PENDENTE | Leaked password protection | Baixa | Ativar via Supabase Dashboard → Auth → Security Settings (não acessível via SQL/MCP) |
| PENDENTE | Rotação de secrets | Baixa | Política semestral: ASAAS_API_KEY, EVOLUTION_API_KEY, METRICS_TOKEN — atualizar no .env do VPS + no Asaas Dashboard + reiniciar containers |

---

## Documentação

| Status | Tarefa | Prioridade | Detalhes |
|---|---|---|---|
| CONCLUÍDA | docs-operacao/ (25 arquivos) | — | Memória viva do projeto |
| CONCLUÍDA | FLUTTERFLOW_MIGRATION.md | — | Guia completo de migração |
| CONCLUÍDA | Runbook de incidentes | — | `24_RUNBOOK_INCIDENTES.md` — 10 cenários com diagnóstico e solução |
| CONCLUÍDA | Sync docs ↔ código (sessão 5) | — | 11_DOCKER.md, 16_EVOLUTION.md, 19_RISCOS.md, 24_RUNBOOK atualizados para refletir commit d17025e (Redis + 768m + NODE_OPTIONS) |
| CONCLUÍDA | FalhasCorrigidas/ — histórico permanente de bugs | — | 28 falhas documentadas em `docs-operacao/FalhasCorrigidas/` (FC001–FC028) com causa raiz, correção, commits e prevenção |
