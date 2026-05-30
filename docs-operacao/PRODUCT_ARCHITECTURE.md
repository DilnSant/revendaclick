# PRODUCT ARCHITECTURE — RevendaClick

> Fonte única da arquitetura de negócio.
> Valores de referência rápida (IPs, IDs, URLs) → `REFERENCE.md`
> Decisões técnicas pontuais → `21_DECISOES_TECNICAS.md`

---

## VISÃO GERAL

RevendaClick é uma plataforma SaaS multi-tenant para revendas de veículos.

**Posicionamento:** "A plataforma que acelera sua revenda"

**Proposta de valor:**
- Loja pública com SEO automático (sem custo extra)
- CRM de leads integrado ao WhatsApp
- Controle financeiro e de comissões
- Assinatura recorrente com upgrade/downgrade flexível

**Usuários-alvo:** Revendas de veículos de pequeno e médio porte

---

## POSICIONAMENTO

| Dimensão | Descrição |
|---|---|
| **CRM automotivo** | Gestão de leads, funil kanban, atividades, clientes |
| **Marketplace automotivo** | Vitrine pública SEO por slug (`/nome-da-loja`) |
| **Centralização operacional** | Financeiro, vendas, comissões, equipe — em um único painel |
| **Comunicação** | WhatsApp via Evolution API (add-on) |
| **IA** | Classificação de leads e sugestão de resposta (OpenRouter) |

---

## ESTRUTURA MULTI-TENANT

### Hierarquia

```
SaaS (RevendaClick)
  └── Tenant (revenda)
        ├── Usuários (admin, gerente, vendedor, visualizador)
        ├── Veículos
        ├── Leads / Clientes
        ├── Vendas / Financeiro
        ├── Assinatura (plano + add-ons)
        └── Instância WhatsApp (Evolution)
```

### Tenant

- Identificado por `id` (UUID) e `slug` (URL-friendly)
- Isolamento via RLS — toda tabela de negócio tem `tenant_id`
- JWT claim `tenant_id` propaga isolamento ao backend Go
- `super_admin` tem `tenant_id = NULL` (acessa todos os tenants via admin panel)

### Usuários

| Role | Acesso |
|---|---|
| `super_admin` | Painel admin — todos os tenants; sem loja própria |
| `admin` | Tudo do próprio tenant |
| `manager` | Loja sem configurações de conta |
| `seller` | Leads e veículos próprios |
| `viewer` | Leitura apenas |

### Planos

| name | display_name | Gate principal |
|---|---|---|
| `starter` | Starter | Funcionalidades básicas |
| `pro` | Pro | Gate `has_crm` libera seção Pro na sidebar |
| `performance` | Performance (billing) / "Premium" (label sidebar) | Gate `has_api_access` libera seção Premium na sidebar |
| `scale` | Scale | Igual Performance + limites maiores; oculto do grid público |

> **ATENÇÃO:** O banco usa `performance` como `plan.name`. O label de UX da seção sidebar é "Premium". Nunca usar `plan_name === 'premium'` — não existe no banco.

### Feature Flags

Feature flags são calculadas por `get_tenant_usage()` — **3-way UNION**:

```
1. plan.features          (features padrão do plano)
2. tenant_features        (overrides por tenant — concessões admin)
3. addon.features         (features de add-ons ativos)
```

Flags disponíveis (nomes exatos):

| Flag | Plano mínimo |
|---|---|
| `has_financial` | Starter+ |
| `has_vendors` | Starter+ |
| `has_crm` | Pro+ |
| `has_analytics` | Pro+ |
| `has_whatsapp` | Pro+ |
| `has_kanban` | Pro+ |
| `has_api_access` | Premium+ |
| `has_white_label` | Premium+ |
| `has_central_atendimento` | add-on `whatsapp_automation` |
| `has_whatsapp_qr` | add-on |
| `has_lead_recovery` | add-on `ia_recovery` |

**Regra:** Nunca usar `plan_name === X` no frontend. Sempre usar feature flags.

---

## MÓDULOS

### Dashboard (`/dashboard`)
- KPIs: veículos, leads, receita do mês, taxa de conversão
- Widget OnboardingChecklist (4 obrigatórios + WhatsApp opcional)
- Requires: qualquer plano ativo

### Veículos (`/vehicles`)
- CRUD completo de veículos
- Fotos múltiplas (Supabase Storage)
- Publicação na vitrine pública SEO (`/:slug`)
- Requires: qualquer plano ativo

### Interessados / Leads (`/leads`)
- Lista de leads com filtros
- Requires: qualquer plano ativo

### CRM / Atendimento (`/crm`)
- Kanban de leads por estágio
- Atividades, anotações, histórico
- Requires: `has_crm` (Pro+)

### Clientes (`/customers`)
- Base de clientes que concluíram negócio
- Requires: qualquer plano ativo (Starter+)

### Financeiro (`/financial`)
- Entradas, saídas, fluxo de caixa
- Sub-nav: Resumo | Vendas | Comissões
- Requires: `has_financial` (Starter+)

### Analytics (`/analytics`)
- Métricas: revenue, vendas, ticket médio, conversão, funil de leads
- Histórico mensal
- Requires: `has_analytics` (Pro+)

### Automações (`/automations`) — Em desenvolvimento
- Automações de fluxo e integrações via API
- Requires: `has_api_access` (Premium+)
- WhatsApp automation disponível via add-on separado

### Campanhas (`/campaigns`) — Em desenvolvimento
- Campanhas de marketing segmentadas
- Requires: `has_api_access` (Premium+)

### Configurações (`/settings`)
- Abas: Loja | Contato Público | Usuários | Plano | WhatsApp
- WhatsApp tab: link para Central de Atendimento + CTA add-on

### Assinatura (`/billing`)
- Sub-nav: Assinatura | Add-ons | Cobranças | Planos
- Checkout via Asaas (Boleto/PIX/Cartão)
- Upgrade/downgrade de plano em tempo real

### Admin (`/admin`) — super_admin apenas
- Lista de todos os tenants
- Ações: ativar plano, bloquear, conceder feature, iniciar trial
- `POST /api/admin/billing/simulate-event` — injetar eventos Asaas fake

---

## ADD-ONS

| type (banco) | Nome | Preço | Feature concedida |
|---|---|---|---|
| `user_extra` | Usuário Extra | R$20/mês | `max_users +1` |
| `whatsapp_automation` | WhatsApp Automação | R$39/mês | `has_central_atendimento` |
| `ia_recovery` | IA Recovery | R$39/mês | `has_lead_recovery` |

**Central de Atendimento (WhatsApp):**
- Requer add-on `whatsapp_automation` ativo
- Conecta via QR Code ao WhatsApp do responsável pela loja
- Instância gerenciada pela Evolution API v2.3.7

**IA Recovery:**
- Requer add-on `ia_recovery` ativo
- Usa OpenRouter (`openai/gpt-4o-mini` por padrão)
- Funções: `classify-lead`, `suggest-reply`

---

## INTEGRAÇÕES

| Serviço | Uso | Docs |
|---|---|---|
| **Supabase** | PostgreSQL, Auth, Storage, RLS, PgBouncer | `05_SUPABASE.md` |
| **Asaas** | Billing — subscriptions, webhooks, PIX/Boleto/Cartão | `15_BILLING_ASAAS.md` |
| **Evolution API v2.3.7** | WhatsApp — QR, instâncias, envio/recebimento | `16_EVOLUTION.md` |
| **OpenRouter** | IA — classificação de leads, sugestão de resposta | `04_BACKEND.md` |
| **Vercel** | Frontend hosting — auto-deploy via GitHub push para `main` | `13_DEPLOY.md` |
| **GitHub Actions** | CI/CD backend — build → push GHCR → deploy VPS | `12_CICD.md` |
| **BetterStack** | Log shipping (backend Go) | `14_OBSERVABILIDADE.md` |
| **Prometheus** | Métricas do sistema | `14_OBSERVABILIDADE.md` |

---

## REGRAS DE NEGÓCIO

### Limites por plano

| Limite | Starter | Pro | Premium | Scale |
|---|---|---|---|---|
| Veículos | 50 | 200 | 500 | ilimitado |
| Usuários | 2 | 5 | 15 | ilimitado |
| Leads/mês | 100 | 500 | ilimitado | ilimitado |

Limites verificados em tempo real via `get_tenant_usage()`. Alertas: warning (80%) e critical (95%).

### Regras de upgrade

1. Usuário acessa `/billing/plans` → clica em plano superior
2. Frontend detecta `is_active && !isCurrent` → modo upgrade
3. `PUT /api/billing/subscription` → Asaas atualiza assinatura existente
4. Webhook `SUBSCRIPTION_UPDATED` → backend atualiza `plan_id` + `plan_name`
5. `get_tenant_usage()` retorna novas features imediatamente

### Regras de downgrade

1. Mesmo fluxo do upgrade, plano inferior
2. Downgrade aplica limites menores imediatamente
3. Se tenant excede novos limites → bloqueia adição (não remove dados existentes)

### Grace Period

- Status `past_due` → `grace_until = NOW() + 3 days` (trigger automático)
- Dentro do grace: acesso normal + header `X-Subscription-Warning`
- Após grace: acesso bloqueado (redirect para `/billing`)

### Add-ons

- Cobrados separadamente da assinatura principal
- Feature concedida imediatamente após webhook de pagamento confirmado
- Cancelamento remove feature na próxima verificação

### Idempotência

- `POST /api/billing/subscribe`: retorna assinatura existente se já ativa
- `POST /api/onboarding/setup`: retorna tenant existente se slug já registrado
- Webhooks Asaas: chave de idempotência `event:asaas_id` — duplicatas ignoradas

---

## SIDEBAR — ESTRUTURA DEFINITIVA

```
Dashboard
Veículos
Interessados
Clientes

─── Pro ──────────── gated has_crm
Atendimento (CRM)
Analytics

─── Premium ─────── gated has_api_access
Automações
Campanhas

─────────────────── sempre visível
Assinatura          ← sub-nav: Assinatura / Add-ons / Cobranças / Planos
Configurações       ← sub-nav tabs: Loja / Contato Público / Usuários / Plano / WhatsApp
```

Financeiro tem sub-nav: Resumo / Vendas / Comissões (acessível pelo nav base via `/financial`)
