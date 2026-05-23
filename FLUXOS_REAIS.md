# FLUXOS REAIS — RevendaClick

> Baseado exclusivamente na leitura dos arquivos de código.
> Fonte: `onboarding/`, `middleware/`, `billing/`, `leads/`, `vehicles/`, `frontend/app/`, `frontend/lib/`.

---

## 1. Fluxo de Registro e Criação de Conta

```
Usuário acessa /register
    ↓
frontend/app/register/page.tsx
    → supabase.auth.signUp({ email, password })
    → Supabase envia email de confirmação (se habilitado)
    ↓
Usuário clica no link do email
    → GET /auth/callback?code=...&type=signup
    → frontend/app/auth/callback/route.ts
    → supabase.auth.exchangeCodeForSession(code)
    → redirect /dashboard (ou /onboarding se sem tenant)
```

**Se confirmação de email desabilitada no Supabase:**
- signUp retorna sessão diretamente
- redirect imediato para /onboarding

---

## 2. Fluxo de Login

```
Usuário acessa /login
    ↓
frontend/app/login/page.tsx
    → supabase.auth.signInWithPassword({ email, password })
    → salva session em cookies
    ↓
middleware.ts detecta usuário autenticado
    → injeta x-user-id no header
    ↓
redirect /dashboard (ou parâmetro ?redirect=...)
```

---

## 3. Fluxo de Onboarding (Setup da Loja)

```
Usuário autenticado sem tenant → redirect /onboarding
    ↓
frontend/app/onboarding/page.tsx
    Campos: user_name, tenant_name, tenant_slug, tenant_email, phone_whatsapp
    → auto-gera slug a partir do nome (slugify)
    ↓
frontend/app/onboarding/actions.ts: setupTenant()
    → apiCall('POST', '/api/onboarding/setup', form)
    ↓
backend: POST /api/onboarding/setup
    1. Valida JWT (jwtAuth)
    2. Valida campos (regex slug, email, tamanhos)
    3. Verifica idempotência (user já tem tenant?)
    4. Transação DB:
       a. INSERT tenants → triggers:
          - trg_create_onboarding → cria onboarding_checklists
          - trg_auto_trial_subscription → cria subscriptions (trialing, 14 dias)
       b. INSERT users (role=owner)
    5. PUT Supabase Admin API → app_metadata: {tenant_id, user_role: "owner"}
    ↓
Frontend: router.push('/dashboard')
```

**Resultado:** tenant criado, trial 14 dias ativo, checklist vazio, JWT atualizado.

---

## 4. Fluxo de Acesso ao Dashboard

```
Request para /dashboard (ou qualquer rota protegida)
    ↓
middleware.ts:
    1. getUser() → verifica sessão Supabase
    2. Se sem user → redirect /login?redirect=<path>
    3. Se com user → injeta x-user-id, x-pathname nos headers
    ↓
(dashboard)/layout.tsx:
    1. getTenantForUser(uid) → Supabase service role (tabela users + tenants)
    2. Se sem tenant → redirect /onboarding
    3. getSession() → access_token para chamadas ao backend
    4. getUsageFromAPI(token) + getSubscription() → GET /api/usage + /api/billing/subscription
    5. Se sub.is_blocked E pathname ≠ /billing → redirect /billing?reason=blocked
    6. Renderiza DashboardShell + banners + children
```

**Banners renderizados:**
- `SubscriptionBanner` — se `past_due` ou `trialing`
- `PlanAlertBanner` — se uso de veículos/usuários ≥ 80%

---

## 5. Fluxo de Captura de Lead (Público)

```
Visitante acessa /:slug (vitrine pública)
    ↓
frontend/app/(public)/[slug]/page.tsx
    → publicFetch('/api/public/:slug/vehicles') → lista veículos disponíveis
    ↓
Visitante clica em veículo → /:slug/:vehicleSlug
    → publicFetch('/api/public/:slug/vehicles/:vehicleSlug')
    → Renderiza com schema.org + Open Graph
    → Botão WhatsApp: buildWhatsAppUrl(phone, mensagem pré-preenchida)
    → Formulário de lead:
        POST /api/public/:slug/leads
        { name, phone, email, message, vehicle_id, source }
    ↓
backend: POST /api/public/:slug/leads
    1. SlugTenantResolver: resolve tenant_id via slug
    2. INSERT leads (sem auth — política RLS "leads_public_insert" permite)
    3. Trigger: trg_increment_leads_count → veículo.leads_count++
    ↓
Lead aparece no CRM da loja
```

---

## 6. Fluxo WhatsApp — Evolution API

```
Owner acessa /whatsapp
    ↓
frontend/app/(dashboard)/whatsapp/page.tsx
    → componente WhatsAppManager
    ↓
GET /api/evolution/status → frontend route handler → proxy → backend /evolution/status → Evolution API
    ↓
Se desconectado:
    POST /api/evolution/connect (owner/admin)
    → backend conecta instância Evolution
    GET /api/evolution/qr
    → retorna QR code para scanear com WhatsApp
    ↓
Após scan:
    Evolution API recebe mensagem
    POST /api/webhooks/evolution → backend
    → evolution/service.go processa
    → sincroniza lead (cria ou atualiza) na tabela leads
    → classifica via AI (POST /api/ai/classify-lead → OpenRouter)
```

---

## 7. Fluxo de Billing — Assinar Plano

```
Tenant em trial ou sem plano ativo
    ↓
Acessa /billing/plans
    → lista GET /api/plans (público)
    → mostra PlanCard para cada plano
    ↓
Clica em "Assinar"
    → frontend/app/(dashboard)/billing/plans/_components/PlanCard.tsx
    → POST /api/billing/subscribe (owner/admin + StrictRateLimit)
    → body: { plan_name: "pro", billing_cycle: "monthly" }
    ↓
backend/billing/service.go:
    1. Busca tenant (asaas_customer_id)
    2. Se sem customer_id → cria customer na Asaas API
       POST https://api.asaas.com/v3/customers
    3. Cria subscription na Asaas
       POST https://api.asaas.com/v3/subscriptions
    4. Atualiza subscriptions.status no DB
    ↓
Asaas processa pagamento
    POST /api/webhooks/asaas (validado por asaas-access-token header)
    → billing/handler.go → service.HandleWebhook()
    → Atualiza status: active | past_due | canceled
    → Trigger trg_subscription_grace se past_due
```

---

## 8. Fluxo de Subscription Bloqueada

```
Asaas webhook: status = canceled
    ↓
subscriptions.status = 'canceled'
    ↓
Próxima request do tenant ao backend (rota gated):
    SubscriptionGate → 402 { code: "subscription_inactive" }
    ↓
Dashboard layout:
    sub.is_blocked = true
    redirect /billing?reason=blocked
    ↓
Tenant vê apenas tela de billing (pode reativar)
    DELETE /api/billing/subscription → Cancel
    POST /api/billing/reactivate → Reativar
```

**Grace period (past_due):**
- Trigger DB seta `grace_until = NOW() + 3 days`
- Durante grace: SubscriptionGate passa com header `X-Subscription-Warning: payment_overdue`
- Após grace: 402

---

## 9. Fluxo de Upload de Foto de Veículo

```
Usuário adiciona foto no formulário de veículo
    ↓
frontend/components/vehicles/VehicleForm.tsx
    → POST /api/upload/vehicle-photo (route handler)
    ↓
frontend/app/api/upload/vehicle-photo/route.ts
    → createServiceClient() (bypassa RLS)
    → supabase.storage.from('vehicle-photos').upload(path, file)
    → retorna public URL
    ↓
URL salva no array vehicles.images ou thumbnail_url
```

---

## 10. Fluxo de Analytics

```
Tenant acessa /analytics
    ↓
frontend/app/(dashboard)/analytics/page.tsx
    → apiCall('GET', '/api/analytics/summary')
    ↓
backend: GET /api/analytics/summary
    1. jwtAuth + resolveTenant + subGate
    2. PlanGate("analytics") → verifica se plano inclui feature "analytics"
       (Planos Pro+, Premium, Enterprise)
    3. Se não incluído → 403 feature_not_available
    4. analytics/service.go → cache TTL in-memory
       → se cache válido: retorna cached
       → se expirado: SELECT do banco + atualiza cache
    ↓
frontend: renderiza gráficos/tabelas
```

---

## 11. Fluxo de AI — Suggest Reply e Classify Lead

```
Usuário abre lead no CRM
    ↓
POST /api/ai/classify-lead
    body: { lead_message: "..." }
    ↓
backend/ai/service.go
    POST https://openrouter.ai/api/v1/chat/completions
    Model: cfg.OpenRouterModel (default: openai/gpt-4o-mini)
    → retorna classificação do lead
    ↓
POST /api/ai/suggest-reply
    body: { context: "...", message: "..." }
    → retorna sugestão de resposta para o vendedor
```

---

## 12. Fluxo de Recuperação de Senha

```
Usuário acessa /forgot-password
    ↓
frontend/app/forgot-password/page.tsx
    → supabase.auth.resetPasswordForEmail(email, {
        redirectTo: '<APP_URL>/auth/callback?type=recovery&next=/reset-password'
      })
    ↓
Supabase envia email com link
    ↓
Usuário clica no link
    GET /auth/callback?code=...&type=recovery
    → exchangeCodeForSession(code)
    → redirect /reset-password
    ↓
frontend/app/reset-password/page.tsx
    → supabase.auth.updateUser({ password: newPassword })
```

---

## 13. Fluxo de Convite de Vendedor

```
Owner/admin acessa /vendors
    ↓
frontend/app/(dashboard)/vendors/page.tsx
    → Formulário de convite
    ↓
POST /api/users (owner/admin)
    body: { email, name, role: "seller" }
    ↓
backend/users/service.go
    → INSERT vendor_invitations (token único, expires 7 dias)
    → (ou INSERT direto em users se Supabase invite flow)
    ↓
Vendedor recebe email com link de convite
    → aceita → conta criada com tenant_id correto
```

---

## Resumo dos Pontos de Integração por Fluxo

| Fluxo | Supabase Auth | Backend Go | Supabase DB | Asaas | Evolution | OpenRouter |
|---|---|---|---|---|---|---|
| Registro | ✓ | — | — | — | — | — |
| Login | ✓ | — | — | — | — | — |
| Onboarding | ✓ (Admin API) | ✓ | ✓ | — | — | — |
| Dashboard | ✓ | ✓ (usage/sub) | ✓ | — | — | — |
| Lead público | — | ✓ | ✓ (RLS) | — | — | — |
| WhatsApp | ✓ | ✓ | ✓ | — | ✓ | ✓ (classify) |
| Billing | ✓ | ✓ | ✓ | ✓ | — | — |
| Upload foto | ✓ (Storage) | — | ✓ (Storage) | — | — | — |
| Analytics | ✓ | ✓ (PlanGate) | ✓ | — | — | — |
| AI | ✓ | ✓ | — | — | — | ✓ |
