# 17 — FLUXOS DE NEGÓCIO

> Baseado em: `backend/internal/`, `frontend/app/`, `database/schema.sql`, `FLUTTERFLOW_MIGRATION.md`.

---

## Telas do Sistema

### Públicas (sem login)

| Tela | URL | Descrição |
|---|---|---|
| Landing Page | `/` | Apresentação do produto |
| Login | `/login` | Acesso com e-mail e senha |
| Registro | `/register` | Cria conta (só usuário, sem loja) |
| Recuperar Senha | `/forgot-password` | Envia e-mail de redefinição |
| Redefinir Senha | `/reset-password` | Formulário com nova senha |
| Vitrine da Loja | `/:slug` | Página pública da loja (SEO) |
| Veículo Público | `/:slug/veículos/:slug-veiculo` | Página do veículo com formulário de contato |
| Privacidade | `/privacy` | Política de privacidade |
| Termos | `/terms` | Termos de uso |

### Dashboard (requer login + tenant + subscription)

| Tela | URL | Módulo backend |
|---|---|---|
| Onboarding | `/onboarding` | `/api/onboarding` |
| Dashboard | `/dashboard` | `/api/analytics/summary`, `/api/usage` |
| Leads / CRM | `/leads` | `/api/leads` |
| CRM (Kanban) | `/crm` | `/api/leads` |
| Veículos | `/vehicles` | `/api/vehicles` |
| Clientes | `/customers` | `/api/customers` |
| Financeiro | `/financial` | `/api/financial/entries`, `/api/financial/cash-flow` |
| Comissões | `/financial/commissions` | `/api/commissions` |
| Vendas | `/sales` | `/api/sales` |
| Analytics | `/analytics` | `/api/analytics/summary` (gate `has_analytics` — Pro+) |
| Automações | `/automations` | — (placeholder — gate `has_api_access`) |
| Campanhas | `/campaigns` | — (placeholder — gate `has_api_access`) |
| Assinatura | `/billing` | `/api/billing/subscription` |
| Add-ons | `/billing/addons` | `/api/billing/addon` |
| Faturas | `/billing/history` | `/api/billing/invoices` |
| Planos | `/billing/plans` | `/api/plans` |
| Admin | `/admin` | `/api/admin/*` (super_admin apenas) |
| Configurações | `/settings` | `/api/tenants/me` |
| Vendedores | `/vendors` | `/api/users` (via Configurações → aba Usuários) |
| Central de Atendimento | `/whatsapp` | `/api/evolution/*` (add-on `whatsapp_automation`) |

---

## Fluxo 1: Registro e Onboarding

```
/register
  → POST Supabase Auth (cria usuário)
  → Confirmar e-mail (se habilitado no Supabase)
  → /auth/callback → /onboarding

/onboarding
  → Preenche: nome da loja, slug, e-mail, telefone
  → POST /api/onboarding/setup
      → INSERT tenants + INSERT users (transação)
      → PUT Supabase Admin API (app_metadata.tenant_id + user_role)
  → /dashboard
```

**Validações no setup:**
- Slug: regex `^[a-z0-9][a-z0-9\-]{1,48}[a-z0-9]$`
- Slug único (UNIQUE no banco)
- E-mail: formato válido
- Idempotente: segunda chamada retorna 200 com o tenant existente

---

## Fluxo 2: Login

```
/login
  → POST Supabase Auth (retorna JWT com tenant_id, user_role)
  → /dashboard

Dashboard layout verifica:
  → x-user-id no header (injetado pelo proxy.ts)
  → getTenantForUser() → carrega tenant
  → GET /api/usage + GET /api/billing/subscription (paralelo)
  → Se sub.is_blocked && não está em /billing → redirect /billing?reason=blocked
```

---

## Fluxo 3: Captura de Lead (Público)

```
Visitante na vitrine /:slug
  → Preenche formulário de contato (nome, telefone, mensagem)
  → POST /api/public/:slug/leads (sem autenticação)
      → SlugTenantResolver resolve tenant_id pelo slug
      → INSERT leads (source='site')
      → Verifica limite do plano (check_vehicle_limit trigger)
  → Lead aparece no /leads da loja
```

---

## Fluxo 4: Captura de Lead (WhatsApp)

```
Cliente manda mensagem no WhatsApp da loja
  → Evolution API recebe mensagem
  → POST /api/webhooks/evolution (apikey no header)
      → Evento "messages.upsert"
      → Filtra: não é fromMe, não é grupo
      → Normaliza telefone (apenas dígitos)
      → Resolve tenant_id pelo slug da instância
      → upsert leads (source='whatsapp')
      → INSERT lead_activities (type='whatsapp', description=mensagem)
  → Lead aparece no /leads com atividade WhatsApp
```

---

## Fluxo 5: Gestão de Veículos

```
POST /api/vehicles
  → Valida payload
  → check_vehicle_limit(): conta veículos do tenant vs plano
     → Excedeu → ErrLimitReached → 403 com mensagem de upgrade
  → INSERT vehicles
  → Veículo aparece na vitrine pública automaticamente (status=available)

DELETE /api/vehicles/:id
  → Roles: owner ou admin apenas
  → DELETE lógico ou físico (depende da implementação)
```

**Filtros disponíveis:** `status`, `brand`, `condition`, `min_price`, `max_price`, `limit`, `offset`

---

## Fluxo 6: Gestão de Leads

```
GET /api/leads
  → Sellers: veem apenas leads atribuídos a eles (SellerID = userID)
  → Owner/Admin: veem todos
  → Filtros: status, limit, offset

PUT /api/leads/:id
  → Atualiza status, vendedor responsável, observações

POST /api/leads/:id/activities
  → Registra interação: ligação, e-mail, WhatsApp, visita

GET /api/leads/follow-ups
  → Lista leads com follow-up pendente
```

---

## Fluxo 7: Vendas

```
POST /api/sales
  → Registra venda (veículo + cliente + valor + comissão)

POST /api/sales/:id/complete
  → Roles: owner, admin
  → Marca venda como concluída
  → Gera comissão para o vendedor

POST /api/sales/:id/cancel
  → Roles: owner, admin
  → Cancela a venda

GET /api/commissions
  → Lista comissões do período

PATCH /api/commissions/:id/pay
  → Roles: owner, admin
  → Marca comissão como paga
```

---

## Fluxo 8: Financeiro

```
POST /api/financial/entries
  → Registra entrada ou saída financeira

GET /api/financial/cash-flow
  → Retorna resumo mensal de entradas e saídas

GET /api/financial/entries
  → Lista lançamentos com filtros
```

---

## Fluxo 9: Assinatura e Billing

Ver `15_BILLING_ASAAS.md` para detalhes completos.

```
/billing → GET /api/billing/subscription
  → Se is_blocked: exibe aviso + botão para pagar

POST /api/billing/subscribe
  → Cria subscription no Asaas
  → Retorna payment link

Asaas webhook PAYMENT_CONFIRMED
  → Backend ativa subscription
  → Acesso liberado imediatamente
```

---

## Fluxo 10: WhatsApp

Ver `16_EVOLUTION.md` para detalhes completos.

```
/whatsapp → GET /api/evolution/status
  → Se disconnected: exibe botão Conectar

POST /api/evolution/connect
  → Cria instância no Evolution (slug como nome)
  → Retorna QR code base64
  → Usuário escaneia com WhatsApp

Após conexão: mensagens entram automaticamente via webhook
```

---

## Fluxo 11: IA

```
POST /api/ai/classify-lead
  Body: { "lead_message": "Olá, tenho interesse no carro" }
  → OpenRouter API → classifica: hot/warm/cold

POST /api/ai/suggest-reply
  Body: { "context": "lead interessado", "message": "..." }
  → OpenRouter API → sugere resposta

Ambos requerem: JWT + tenant + subscription ativa
OPENROUTER_API_KEY vazio → rota retorna erro 500
```

---

## Limites por Plano

Enforçados via triggers no banco (não no backend):

| Recurso | Trigger |
|---|---|
| Veículos | `check_vehicle_limit()` — bloqueia INSERT se acima do plano |
| Usuários | `check_user_limit()` — bloqueia INSERT se acima do plano |

**Resposta ao cliente:** `403` com mensagem de upgrade.

---

## Isolamento Multi-Tenant

Toda query de negócio filtra por `tenant_id`:
- Backend: sempre passa `tenantID` extraído do JWT
- Banco: RLS garante isolamento mesmo se backend falhar
- Público: SlugTenantResolver resolve tenant_id pelo slug da URL

Nunca é possível um tenant ver dados de outro (dupla proteção: backend + RLS).
