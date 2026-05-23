# BANCO REAL — RevendaClick

> Extraído exclusivamente de `database/schema.sql` e `database/migrations/001` a `010`.
> PostgreSQL via Supabase. RLS habilitado em todas as tabelas de negócio.

---

## Extensões

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
```

---

## ENUMs

| ENUM | Valores |
|---|---|
| `plan_type` | `starter`, `pro`, `premium`, `enterprise` |
| `subscription_status` | `active`, `trialing`, `past_due`, `canceled`, `paused` |
| `vehicle_status` | `available`, `reserved`, `sold`, `inactive` |
| `vehicle_condition` | `new`, `used`, `certified` |
| `fuel_type` | `flex`, `gasoline`, `diesel`, `electric`, `hybrid`, `ethanol` |
| `transmission_type` | `manual`, `automatic`, `cvt`, `automated` |
| `lead_status` | `new`, `in_progress`, `proposal`, `closed_won`, `closed_lost` |
| `lead_source` | `marketplace`, `whatsapp`, `referral`, `direct`, `social`, `other` |
| `user_role` | `owner`, `admin`, `seller`, `viewer` |

---

## Tabelas

### `plans` (referência — não tenant-scoped)

| Coluna | Tipo | Observação |
|---|---|---|
| id | UUID PK | uuid_generate_v4() |
| name | plan_type UNIQUE | starter/pro/premium/enterprise |
| display_name | TEXT | |
| max_vehicles | INT | -1 = ilimitado |
| max_users | INT | -1 = ilimitado |
| max_leads | INT | -1 = ilimitado |
| price_monthly | NUMERIC(10,2) | |
| price_yearly | NUMERIC(10,2) | |
| features | JSONB | Array de strings de features |
| is_active | BOOLEAN | DEFAULT TRUE |
| created_at | TIMESTAMPTZ | |

**Dados seed:**

| Plano | Veículos | Usuários | Leads/mês | Mensal | Features |
|---|---|---|---|---|---|
| Starter | 30 | 4 | 200 | R$97 | marketplace, whatsapp_button, lead_capture |
| Pro | 60 | 8 | 500 | R$197 | + crm, kanban, custom_domain |
| Premium | 120 | 20 | 2000 | R$397 | + analytics, priority_support |
| Enterprise | ∞ | ∞ | ∞ | R$797 | + api_access, white_label |

---

### `tenants`

| Coluna | Tipo | Observação |
|---|---|---|
| id | UUID PK | |
| slug | TEXT UNIQUE | formato: `^[a-z0-9][a-z0-9\-]{1,48}[a-z0-9]$` |
| name | TEXT | |
| email | TEXT UNIQUE | |
| phone_whatsapp | TEXT | |
| logo_url | TEXT | |
| description | TEXT | |
| address | JSONB | |
| social_links | JSONB | DEFAULT `{}` |
| custom_domain | TEXT UNIQUE | |
| seo_title | TEXT | |
| seo_description | TEXT | |
| theme | JSONB | DEFAULT `{"primary_color": "#E53935", "font": "inter"}` |
| is_active | BOOLEAN | DEFAULT TRUE |
| created_at / updated_at | TIMESTAMPTZ | trigger `set_updated_at()` |
| asaas_customer_id | TEXT | adicionado em migration 004 |

**Triggers automáticos ao INSERT:**
- `trg_create_onboarding` → cria `onboarding_checklists`
- `trg_auto_trial_subscription` → cria `subscriptions` com `status=trialing`, 14 dias

---

### `subscriptions`

| Coluna | Tipo | Observação |
|---|---|---|
| id | UUID PK | |
| tenant_id | UUID FK → tenants | UNIQUE (1 por tenant) |
| plan_id | UUID FK → plans | |
| status | subscription_status | DEFAULT `trialing` |
| billing_cycle | TEXT | `monthly` ou `yearly` |
| current_period_start / end | TIMESTAMPTZ | |
| trial_ends_at | TIMESTAMPTZ | |
| canceled_at | TIMESTAMPTZ | |
| external_id | TEXT | Legacy: Stripe/Hotmart |
| metadata | JSONB | |
| asaas_subscription_id | TEXT | migration 004 |
| asaas_payment_link | TEXT | migration 004 |
| grace_until | TIMESTAMPTZ | migration 004: 3 dias de grace após past_due |
| created_at / updated_at | TIMESTAMPTZ | |

**Trigger:** `trg_subscription_grace` — quando `status` muda para `past_due`, seta `grace_until = NOW() + 3 days`

---

### `users`

| Coluna | Tipo | Observação |
|---|---|---|
| id | UUID PK | → `auth.users(id)` ON DELETE CASCADE |
| tenant_id | UUID FK → tenants | |
| role | user_role | DEFAULT `seller` |
| name | TEXT | |
| email | TEXT | UNIQUE (tenant_id, email) |
| phone | TEXT | |
| avatar_url | TEXT | |
| is_active | BOOLEAN | DEFAULT TRUE |
| last_seen_at | TIMESTAMPTZ | |
| created_at / updated_at | TIMESTAMPTZ | |

**Trigger DB:** `check_user_limit()` — bloqueia INSERT se atingiu `max_users` do plano

---

### `sellers`

| Coluna | Tipo | Observação |
|---|---|---|
| id | UUID PK | |
| tenant_id | UUID FK → tenants | |
| user_id | UUID FK → users | UNIQUE (tenant_id, user_id) |
| display_name | TEXT | |
| phone_whatsapp | TEXT | |
| bio / photo_url | TEXT | |
| is_active | BOOLEAN | |
| created_at / updated_at | TIMESTAMPTZ | |

---

### `vehicles`

| Coluna | Tipo | Observação |
|---|---|---|
| id | UUID PK | |
| tenant_id | UUID FK → tenants | |
| seller_id | UUID FK → sellers | nullable |
| title / brand / model / version | TEXT | |
| year_model / year_manufacture | SMALLINT | CHECK range 1950 a ano+1 |
| color | TEXT | |
| mileage | INT | DEFAULT 0 |
| fuel | fuel_type | |
| transmission | transmission_type | |
| doors | SMALLINT | CHECK IN (2, 4) |
| engine / horsepower | TEXT / SMALLINT | |
| features | TEXT[] | |
| price | NUMERIC(12,2) | CHECK > 0 |
| price_negotiable | BOOLEAN | |
| fipe_price | NUMERIC(12,2) | |
| status | vehicle_status | DEFAULT `available` |
| condition | vehicle_condition | DEFAULT `used` |
| is_featured | BOOLEAN | |
| images | TEXT[] | |
| thumbnail_url / video_url | TEXT | |
| slug | TEXT | UNIQUE (tenant_id, slug) |
| description | TEXT | |
| plate_last_digits | TEXT | |
| views_count / leads_count | INT | DEFAULT 0 |
| created_at / updated_at | TIMESTAMPTZ | |

**Trigger DB:** `check_vehicle_limit()` — bloqueia INSERT se atingiu `max_vehicles` do plano
**Trigger DB:** `trg_increment_leads_count` — incrementa `leads_count` quando lead é criado para o veículo

---

### `leads`

| Coluna | Tipo | Observação |
|---|---|---|
| id | UUID PK | |
| tenant_id | UUID FK → tenants | |
| vehicle_id | UUID FK → vehicles | nullable (SET NULL) |
| seller_id | UUID FK → sellers | nullable |
| name / phone / email / message | TEXT | |
| status | lead_status | DEFAULT `new` |
| source | lead_source | DEFAULT `marketplace` |
| notes | TEXT | |
| utm_source / utm_medium / utm_campaign | TEXT | |
| ip_address | INET | |
| user_agent | TEXT | |
| kanban_position | INT | DEFAULT 0 |
| contacted_at / closed_at / created_at / updated_at | TIMESTAMPTZ | |

---

### `lead_activities`

| Coluna | Tipo | Observação |
|---|---|---|
| id | UUID PK | |
| tenant_id / lead_id / user_id | UUID FK | |
| type | TEXT | `status_change`, `note`, `call`, `whatsapp`, `email` |
| description | TEXT | |
| metadata | JSONB | |
| created_at | TIMESTAMPTZ | |

---

### `onboarding_checklists`

| Coluna | Tipo |
|---|---|
| id | UUID PK |
| tenant_id | UUID FK UNIQUE |
| added_vehicle | BOOLEAN |
| configured_whatsapp | BOOLEAN |
| published_store | BOOLEAN |
| added_seller | BOOLEAN |
| completed_at | TIMESTAMPTZ |
| created_at / updated_at | TIMESTAMPTZ |

Criado automaticamente via trigger `trg_create_onboarding` no INSERT de `tenants`.

---

### `usage_snapshots`

| Coluna | Tipo |
|---|---|
| id | UUID PK |
| tenant_id | UUID FK |
| vehicles_count / users_count / leads_count | INT |
| snapped_at | TIMESTAMPTZ |

---

### `vendor_invitations` (migration 008)

| Coluna | Tipo | Observação |
|---|---|---|
| id | UUID PK | |
| tenant_id | UUID FK → tenants | |
| invited_by | UUID FK → users | |
| email | TEXT | |
| role | user_role | DEFAULT `seller` |
| token | TEXT UNIQUE | hex(32 bytes) |
| accepted_at | TIMESTAMPTZ | |
| expires_at | TIMESTAMPTZ | DEFAULT NOW() + 7 days |
| created_at | TIMESTAMPTZ | |
| CONSTRAINT | UNIQUE(tenant_id, email) | Um convite pendente por email/tenant |

---

## Views

### `public_vehicle_listings`
- Join: `vehicles` + `tenants`
- WHERE: `v.status = 'available' AND t.is_active = TRUE`
- Expõe: dados do veículo + `store_name`, `store_slug`, `store_whatsapp`, `store_logo`

### `plan_usage` (migration 008)
- Join: `tenants` + `subscriptions` + `plans` + `vehicles` + `users` + `leads`
- Retorna: contagens, limites, features, status por tenant
- Usado: dashboard enforcement

---

## Funções

| Função | Tipo | Uso |
|---|---|---|
| `set_updated_at()` | TRIGGER | Atualiza `updated_at` automaticamente |
| `check_vehicle_limit()` | TRIGGER BEFORE INSERT | Bloqueia se acima do limite do plano |
| `check_user_limit()` | TRIGGER BEFORE INSERT | Bloqueia se acima do limite do plano |
| `increment_vehicle_leads_count()` | TRIGGER AFTER INSERT | Incrementa contador de leads no veículo |
| `create_onboarding_checklist()` | TRIGGER AFTER INSERT tenants | Auto-cria checklist |
| `auto_assign_trial_subscription()` | TRIGGER AFTER INSERT tenants | Auto-cria trial 14 dias |
| `set_subscription_grace()` | TRIGGER BEFORE UPDATE subscriptions | Grace 3 dias ao entrar em past_due |
| `get_tenant_usage(p_tenant_id)` | FUNCTION SECURITY DEFINER | Retorna contagens + % uso + limites |
| `auth_tenant_id()` | FUNCTION STABLE | Extrai tenant_id do JWT: `auth.jwt() ->> 'tenant_id'` |
| `auth_user_role()` | FUNCTION STABLE | Extrai user_role do JWT |

---

## RLS — Row Level Security

Habilitado em: `tenants`, `subscriptions`, `users`, `sellers`, `vehicles`, `leads`, `lead_activities`, `onboarding_checklists`, `usage_snapshots`, `vendor_invitations`, `plans`

### Padrão geral
```sql
-- Leitura: próprio tenant
USING (tenant_id = auth_tenant_id())

-- Escrita restrita: owner/admin
WITH CHECK (tenant_id = auth_tenant_id() AND auth_user_role() IN ('owner', 'admin'))
```

### Exceções notáveis
- `vehicles`: SELECT público para `status = 'available'` (marketplace)
- `sellers`: SELECT público para `is_active = TRUE`
- `leads`: INSERT público sem restrição (form de captação)
- `plans`: SELECT público TRUE (pricing page)
- Service Role key (backend Go + middleware Next.js) bypassa todas as políticas automaticamente

---

## Índices Principais

| Tabela | Índice | Colunas |
|---|---|---|
| tenants | idx_tenants_slug | slug |
| tenants | idx_tenants_custom_domain | custom_domain WHERE NOT NULL |
| subscriptions | idx_subscriptions_tenant | tenant_id |
| subscriptions | idx_subscriptions_status | status |
| subscriptions | idx_subscriptions_asaas | asaas_subscription_id |
| users | idx_users_tenant | tenant_id |
| users | idx_users_email | email |
| vehicles | idx_vehicles_tenant_status | (tenant_id, status) |
| vehicles | idx_vehicles_tenant_featured | (tenant_id, is_featured) WHERE is_featured |
| vehicles | idx_vehicles_slug | (tenant_id, slug) |
| vehicles | idx_vehicles_brand_model | (tenant_id, brand, model) |
| vehicles | idx_vehicles_price | (tenant_id, price) |
| vehicles | idx_vehicles_created | (tenant_id, created_at DESC) |
| leads | idx_leads_tenant_status | (tenant_id, status) |
| leads | idx_leads_created | (tenant_id, created_at DESC) |

---

## Migrations — Ordem Aplicada

| # | Arquivo | O que faz |
|---|---|---|
| 001 | `001_initial_schema.sql` | Inclui `schema.sql` completo via `\i` |
| 002 | `002_customers.sql` | Tabela customers |
| 003 | `003_financial.sql` | financial_entries, sales, commissions |
| 004 | `004_billing.sql` | asaas_customer_id, asaas_subscription_id, grace_until, trigger grace |
| 005 | `005_billing_extended.sql` | Extensões de billing |
| 006 | `006_followups_audit.sql` | follow-ups e audit_log |
| 007 | `007_storage.sql` | Supabase Storage buckets e políticas |
| 008 | `008_users_vendors.sql` | vendor_invitations, view plan_usage |
| 009 | `009_performance_indexes.sql` | Índices adicionais |
| 010 | `010_security_hardening.sql` | Políticas RLS endurecidas |

---

## Riscos ao Alterar Banco

| Mudança | Risco |
|---|---|
| Renomear `tenant_id` em qualquer tabela | Quebra todas as políticas RLS e queries backend |
| Remover `auth_tenant_id()` | Quebra todas as políticas RLS |
| Alterar tipo de `subscription_status` ENUM | Requer ALTER TYPE — cuidado com dados existentes |
| Remover trigger `auto_assign_trial_subscription` | Novos tenants ficam sem subscription |
| Mudar `plans.features` de JSONB para outro tipo | Quebra `PlanGate` no backend e `FeatureGate` no frontend |
| Desabilitar RLS | Vazamento de dados cross-tenant |
