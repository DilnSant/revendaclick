# FalhasCorrigidas — Índice de Bugs Resolvidos

> Fonte oficial de consulta para problemas já diagnosticados e corrigidos no RevendaClick.
> **Regra:** Nunca corrigir bug sem registrar nesta pasta.
> **Uso:** Antes de diagnosticar um problema, verificar se já existe um FC correspondente.

---

## Como usar

1. Identifique o sintoma ou área afetada na tabela abaixo
2. Abra o FC correspondente
3. Siga a seção **"Como Validar"** para confirmar se é regressão
4. Se for regressão, siga **"Correção Aplicada"** e atualize o documento com a data

---

## Índice

| ID | Título | Área | Severidade | Data |
|---|---|---|---|---|
| [FC001](FC001_REACT_ERROR_300_LOOP_ONBOARDING.md) | React Error #300 / Loop infinito /onboarding | Auth / Frontend | CRÍTICA | 2026-05-23 |
| [FC002](FC002_QRCODE_EVOLUTION.md) | QR Code Evolution não gerava / sumia / formato incompatível | WhatsApp / Evolution | CRÍTICA | 2026-05-27 |
| [FC003](FC003_RLS_ONBOARDING_JWT_CLAIM.md) | RLS onboarding — JWT claim ausente / getTenantForUser retorna null | Auth / RLS | ALTA | 2026-05-23 |
| [FC004](FC004_SLUG_404_ONBOARDING_REDIRECT.md) | Slug 404 / Redirect onboarding após confirmação de email | Auth / Registro | ALTA | 2026-05-21 |
| [FC005](FC005_ASSINATURA_DARK_UI.md) | Plano Starter sem botão de contratar (UI billing) | Billing / Frontend | BAIXA | 2026-05-27 |
| [FC006](FC006_PIX_ASAAS_WHITELIST_IP.md) | PIX / Asaas — Whitelist de IP sandbox vs produção + API key $$ | Billing / Asaas | CRÍTICA | 2026-05-26 |
| [FC007](FC007_SECURITY_ADVISOR_RLS.md) | Security Advisor — 3 warnings RLS críticos no Supabase | Segurança / RLS | ALTA | 2026-05-26 |
| [FC008](FC008_TENANTS_SELECT_ALL_RLS.md) | tenants_select_all — RLS policy sem SELECT wrapper | Segurança / RLS | ALTA | 2026-05-23 |
| [FC009](FC009_EVOLUTION_SEM_RLS_LEADS.md) | Evolution sem RLS — leads_public_insert sem restrição de tenant | Segurança / RLS | ALTA | 2026-05-26 |
| [FC010](FC010_ANALYTICS_REVENUE_ZERO.md) | Analytics revenue zerado (colunas SQL inexistentes) | Analytics / Backend | MÉDIA | 2026-05-26 |
| [FC011](FC011_NGINX_WEBHOOK_LOCATION.md) | Nginx webhook location incorreta — rate limiting ignorado | Infra / Nginx | MÉDIA | 2026-05-26 |
| [FC012](FC012_BILLING_SQL_ARGS_DUPLICADO.md) | Billing SQL args duplicado / $2 nunca referenciado | Billing / Backend | ALTA | 2026-05-26 |
| [FC013](FC013_BILLING_CUSTOMER_SEM_CPF.md) | Billing customer Asaas sem CPF — subscription rejeitada | Billing / Asaas | ALTA | 2026-05-27 |
| [FC014](FC014_BILLING_RESUBSCRIBE_DUPLICADO.md) | Billing re-subscribe duplicado sem guard | Billing / Backend | ALTA | 2026-05-27 |
| [FC015](FC015_EVOLUTION_OOM_BAILEYS.md) | Evolution OOM / Baileys sem heap limit (512m → 768m) | Infra / Evolution | ALTA | 2026-05-25 |
| [FC016](FC016_EVOLUTION_WEBHOOK_401_APIKEY.md) | Evolution webhook 401 — empty apikey no v2.3.7 | WhatsApp / Backend | ALTA | 2026-05-27 |
| [FC017](FC017_EVOLUTION_SENDTEXT_FORMATO.md) | Evolution sendText formato incompatível com v2.3.7 | WhatsApp / Backend | ALTA | 2026-05-27 |
| [FC018](FC018_EVOLUTION_WEBHOOK_413_BODY.md) | Evolution webhook 413 — body limit 512KB insuficiente | WhatsApp / Backend | MÉDIA | 2026-05-27 |
| [FC019](FC019_EVOLUTION_PRISMA_POOL.md) | Evolution Prisma connection pool exhaustion — sessão WhatsApp cai | WhatsApp / Evolution | ALTA | 2026-05-27 |
| [FC020](FC020_VPS_GIT_DIRTY_CICD.md) | VPS git dirty working tree bloqueando CI/CD deploy | CI/CD / DevOps | MÉDIA | 2026-05-27 |
| [FC021](FC021_VENDEDORES_INVITE_SMTP.md) | Vendedores invite — "Error sending invite email" (SMTP rate limit) | Equipe / Frontend | MÉDIA | 2026-05-25 |
| [FC022](FC022_LEAD_SOURCE_VALIDACAO.md) | Lead source inválido retornava internal_error opaco | CRM / Backend | BAIXA | 2026-05-26 |
| [FC023](FC023_LISTAS_VAZIAS_NULL.md) | Listas vazias retornavam null em vez de [] | API / Backend | BAIXA | 2026-05-26 |
| [FC024](FC024_VEHICLE_DETAIL_500_FEATURES_NULL.md) | Vehicle detail 500 — features null + photo_urls→images | Frontend / Público | CRÍTICA | 2026-05-27 |
| [FC025](FC025_LOGOS_BUCKET_POLICY_BROAD.md) | Logos bucket: policy pública desnecessária (listing exposto) | Storage / Segurança | BAIXA | 2026-05-27 |
| [FC026](FC026_EVOLUTION_TABLES_SUPABASE_ADVISORS.md) | Evolution tables no schema public — RLS desabilitado em 37 tabelas | Segurança / Evolution | ALTA | 2026-05-27 |
| [FC027](FC027_EVOLUTION_P3005_P3009_PRISMA.md) | Evolution P3005 + P3009 — crash loop após drop das tabelas | WhatsApp / Evolution | CRÍTICA | 2026-05-27 |
| [FC028](FC028_EVOLUTION_ENUM_TYPES_ORFAOS.md) | Evolution ENUM types órfãos após DROP TABLE CASCADE | WhatsApp / Evolution | CRÍTICA | 2026-05-27 |
| [FC029](FC029_VERCEL_BUILD_FREEZE_STALE_SUPABASE_TYPES.md) | Vercel build freeze — database.types.ts desatualizado bloqueou 8 deploys | Deploy / TypeScript | CRÍTICA | 2026-05-28 |
| [FC030](FC030_SettingsTabs_plan_name_premium_vs_performance.md) | SettingsTabs: plan.name 'premium' vs DB 'performance' — aba Plano não aparecia | Frontend / Billing | MÉDIA | 2026-05-30 |
| [FC031](FC031_ACTIVATE_CANCELED_AT_NULL.md) | ActivateByAsaasSubID não limpava canceled_at — tenant ativo com canceled_at preenchido | Billing / Backend | ALTA | 2026-05-31 |
| [FC032](FC032_ADDONS_SEM_BILLING_ASAAS.md) | Add-ons ativados sem cobrança Asaas — asaas_addon_id sempre NULL | Billing / Add-ons | ALTA | 2026-05-31 |
| [FC033](FC033_CANCEL_SUBSCRIPTION_NAO_CANCELA_ADDONS.md) | CancelSubscription não cancela subscription_addons — add-ons continuam cobrando | Billing / Add-ons | MÉDIA | 2026-05-31 |
| [FC034](FC034_ASAAS_INVALID_ACTION_DELETED_SUBSCRIPTION.md) | Asaas `invalid_action` em upgrade/downgrade — assinatura deletada não pode ser atualizada via PUT | Billing / Asaas | ALTA | 02/06/2026 |
| [FC035](FC035_FORGOT_PASSWORD_APPURL_LOCALHOST.md) | forgot-password: appUrl fallback `localhost:3000` — links de recovery apontavam para localhost em produção | Auth / Frontend | ALTA | 03/06/2026 |
| [FC036](FC036_VEHICLE_DETAIL_SEM_PRIMARY_VAR.md) | Página de detalhe do veículo sem `--primary` CSS var — CTA usava cor da plataforma em vez da cor do tenant | Frontend / Branding | ALTA | 04/06/2026 |
| [FC037](FC037_ASAAS_CPF_CNPJ_AUSENTE.md) | Asaas HTTP 400 `invalid_object` — CPF/CNPJ ausente ao contratar plano (coluna inexistente, frontend nunca enviava) | Billing / Asaas | CRÍTICO | 05/06/2026 |
| [FC038](FC038_ESLINT_13_ERROS_ACUMULADOS.md) | ESLint 13 erros acumulados — `<a>`→`<Link>`, react-hooks/purity, entities, eslint-disable, comentário obsoleto | Frontend / Code Quality | MÉDIA | 08/06/2026 |
| [FC039](FC039_HARDENING_FINAL_AUDITORIA_OPERACIONAL.md) | Hardening final — 500 ListTenants (enum cast), NavItem `<a>`→`<Link>`, proxy.ts protection, sitemap, REVOKE trigger functions, landing_leads RLS | Full Stack | ALTA | 09/06/2026 |
| [FC040](FC040_SUPABASE_SEARCH_PATH_E_REVOKE_PUBLIC.md) | Supabase: `SET search_path = public` em 8 funções + `REVOKE FROM PUBLIC` em 6 trigger functions (herança PUBLIC não coberta por FC039) | Supabase / Segurança | WARN | 09/06/2026 |
| [FC041](FC041_SANEAMENTO_DOCUMENTAL_FINAL.md) | Saneamento documental: count FC desatualizado (38→40) em 4 arquivos; seção duplicada em memory/project_status.md removida | Documentação | BAIXA | 11/06/2026 |
| [FC042](FC042_E2E_PLAYWRIGHT_SELECTORS_SKIPS.md) | E2E Playwright: `getByLabel(/e-mail/i)` não batia; skip guards sem verificação de senha; tabs `<a>` vs `role="tab"`; display_names dinâmicos incorretos | Frontend / E2E | MÉDIA | 11/06/2026 |
| [FC043](FC043_BACKUP_S3.md) | Backup S3: aws-cli instalado por backup (lento/frágil); sem AWS_REGION; path sem YYYY/MM; sem verify pós-upload; sem lifecycle S3 | Infra / Backup | MÉDIA | 13/06/2026 |
| [FC044](FC044_RECLASSIFICACAO_PENDENCIAS_INFRA.md) | Reclassificação documental: Backup S3 config + BetterStack Alerts + Leaked Password Protection → Backlog de Infraestrutura | Documentação | BAIXA | 13/06/2026 |
| [FC045](FC045_CONTAGEM_DOCUMENTAL_FC_DESATUALIZADA.md) | Contagem documental de FCs desatualizada: 23_PROXIMO_PASSO + README (count 43→44, próximo FC044→FC045, FC044 ausente do índice) | Documentação | BAIXA | 14/06/2026 |

---

## Por área

### Auth / Onboarding
- FC001 — Loop /onboarding (React Error #300)
- FC003 — JWT claim ausente / getTenantForUser null
- FC004 — Slug 404 / redirect de confirmação de email

### Billing / Asaas
- FC005 — Starter sem botão (UI)
- FC006 — IP whitelist sandbox vs produção + $$ escape
- FC012 — SQL args duplicados no UpdateSubscriptionAsaas
- FC013 — Customer sem CPF bloqueando subscription
- FC014 — Re-subscribe sem guard de idempotência
- FC030 — SettingsTabs plan.name 'premium' vs 'performance'
- FC031 — ActivateByAsaasSubID não limpava canceled_at
- FC032 — Add-ons sem cobrança Asaas (gap documentado — Etapa 5, corrigido)
- FC033 — CancelSubscription não cancela add-ons (gap — aguarda decisão de negócio)
- FC037 — CPF/CNPJ ausente: coluna inexistente em tenants; Subscribe() lia do body HTTP nunca enviado

### WhatsApp / Evolution API
- FC002 — QR Code não gerava / sumia (5 bugs em cascata)
- FC015 — OOM Baileys (512m → 768m + NODE_OPTIONS)
- FC016 — Webhook 401 (empty apikey v2.3.7)
- FC017 — sendText formato incompatível v2.3.7
- FC018 — Webhook 413 (body limit 512KB)
- FC019 — Prisma connection pool exhaustion

### Segurança / RLS
- FC007 — Security Advisor: 3 warnings (RLS, SECURITY DEFINER, leads_public_insert)
- FC008 — tenants_select_own sem SELECT wrapper
- FC009 — leads_public_insert sem restrição de tenant

### Backend / API
- FC010 — Analytics revenue zerado (colunas SQL erradas)
- FC022 — Lead source inválido → internal_error opaco
- FC023 — Listas vazias retornam null

### Infra / DevOps
- FC011 — Nginx webhook location /api/v1/ vs /api/
- FC020 — VPS git dirty working tree bloqueando CI/CD

### Frontend / UX
- FC021 — Vendedores invite SMTP rate limit
- FC024 — Vehicle detail 500 (features null + photo_urls→images)

### Storage / Supabase
- FC025 — Logos bucket: policy pública permite listing
- FC026 — Evolution tables no schema public (37 tabelas sem RLS)
- FC027 — Evolution P3005 + P3009 após drop das tabelas
- FC028 — Evolution ENUM types órfãos após DROP TABLE CASCADE

### Deploy / CI-CD
- FC029 — Vercel build freeze: database.types.ts desatualizado (8 deploys falhando)

### Documentação
- FC041 — Saneamento documental final: count FC desatualizado (38→40) em 4 arquivos
- FC044 — Reclassificação de pendências não prioritárias → Backlog de Infraestrutura
- FC045 — Contagem documental de FCs desatualizada: count 43→44, próximo FC044→FC045, FC044 ausente do índice

---

## Regras desta pasta

1. **Nunca corrigir bug sem registrar.** Todo bug corrigido deve ter um FC.
2. **Se o problema reincidir:** abrir o FC correspondente → seção "Como Diagnosticar" → comparar com o estado atual → registrar a regressão no documento.
3. **Numeração sequencial:** próximo número disponível é FC046.
4. **Atualizar este README** ao criar cada novo FC.
5. **Relacionar com outras docs:**
   - `22_HISTORICO_ALTERACOES.md` — contexto da sessão em que foi corrigido
   - `20_PENDENCIAS.md` — tarefa marcada como CONCLUÍDA
   - `24_RUNBOOK_INCIDENTES.md` — procedimento de diagnóstico em produção

---

## Template para novo FC

```bash
# Próximo número: FC046
# Nome do arquivo: FC046_DESCRICAO_CURTA.md
# Copiar o template de qualquer FC existente e preencher todas as seções
```

Seções obrigatórias:
- Data, Severidade, Sintoma, Contexto
- Causa Raiz, Arquivos Afetados, Banco/Migrations
- Correção Aplicada, Commit(s)
- Como Validar, Resultado Final
- Risco de Regressão, Prevenção Futura
