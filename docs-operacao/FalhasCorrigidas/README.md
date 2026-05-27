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

---

## Regras desta pasta

1. **Nunca corrigir bug sem registrar.** Todo bug corrigido deve ter um FC.
2. **Se o problema reincidir:** abrir o FC correspondente → seção "Como Diagnosticar" → comparar com o estado atual → registrar a regressão no documento.
3. **Numeração sequencial:** próximo número disponível é FC024.
4. **Atualizar este README** ao criar cada novo FC.
5. **Relacionar com outras docs:**
   - `22_HISTORICO_ALTERACOES.md` — contexto da sessão em que foi corrigido
   - `20_PENDENCIAS.md` — tarefa marcada como CONCLUÍDA
   - `24_RUNBOOK_INCIDENTES.md` — procedimento de diagnóstico em produção

---

## Template para novo FC

```bash
# Próximo número: FC024
# Nome do arquivo: FC024_DESCRICAO_CURTA.md
# Copiar o template de qualquer FC existente e preencher todas as seções
```

Seções obrigatórias:
- Data, Severidade, Sintoma, Contexto
- Causa Raiz, Arquivos Afetados, Banco/Migrations
- Correção Aplicada, Commit(s)
- Como Validar, Resultado Final
- Risco de Regressão, Prevenção Futura
