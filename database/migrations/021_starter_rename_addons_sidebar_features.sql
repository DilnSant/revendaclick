-- Migration 021: Rename start → starter + subscription_addons table + sidebar feature flags
-- Sessão 20 — Reestruturação estratégica SaaS

-- ─── 1. Rename plan 'start' → 'starter' ──────────────────────────────────────

UPDATE public.plans SET
  name         = 'starter',
  display_name = 'Starter',
  tagline      = 'Comece sua revenda online'
WHERE name = 'start';

-- ─── 2. Update features: add 'financial' and 'vendors' to Pro+ only ──────────
-- Starter keeps: marketplace, whatsapp_button, lead_capture, crm
-- Pro+ gains: financial, vendors (in addition to kanban, analytics, central_atendimento)

UPDATE public.plans SET
  features = '["marketplace","whatsapp_button","lead_capture","crm","kanban","analytics","central_atendimento","financial","vendors"]'::jsonb
WHERE name = 'pro';

UPDATE public.plans SET
  features = '["marketplace","whatsapp_button","lead_capture","crm","kanban","analytics","central_atendimento","financial","vendors","ai_assistance","automation","campaigns"]'::jsonb
WHERE name = 'performance';

UPDATE public.plans SET
  features = '["marketplace","whatsapp_button","lead_capture","crm","kanban","analytics","central_atendimento","financial","vendors","ai_assistance","automation","campaigns","multi_store","api_access","white_label","priority_support"]'::jsonb
WHERE name = 'scale';

-- ─── 3. Update auto_assign_trial_subscription trigger to use 'starter' ───────

CREATE OR REPLACE FUNCTION public.auto_assign_trial_subscription()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  starter_plan_id UUID;
BEGIN
  SELECT id INTO starter_plan_id
  FROM public.plans
  WHERE name = 'starter' AND is_active = TRUE
  LIMIT 1;

  IF starter_plan_id IS NULL THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.subscriptions (
    tenant_id,
    plan_id,
    status,
    trial_ends_at,
    current_period_start,
    current_period_end
  )
  VALUES (
    NEW.id,
    starter_plan_id,
    'trialing',
    NOW() + INTERVAL '7 days',
    NOW(),
    NOW() + INTERVAL '7 days'
  )
  ON CONFLICT (tenant_id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- ─── 4. Update plan_usage view to use new plan name ──────────────────────────

DROP VIEW IF EXISTS public.plan_usage;

CREATE VIEW public.plan_usage AS
SELECT
  t.id                                                               AS tenant_id,
  t.slug,
  t.name                                                             AS tenant_name,
  p.name                                                             AS plan_name,
  p.display_name                                                     AS plan_display,
  p.max_vehicles,
  p.max_users,
  p.max_leads,
  p.features,
  s.status                                                           AS subscription_status,
  s.trial_ends_at,
  s.current_period_end,
  (SELECT COUNT(*) FROM public.vehicles v
   WHERE v.tenant_id = t.id AND v.status != 'inactive')             AS vehicle_count,
  (SELECT COUNT(*) FROM public.users u
   WHERE u.tenant_id = t.id AND u.is_active = TRUE)                 AS user_count,
  (SELECT COUNT(*) FROM public.leads l
   WHERE l.tenant_id = t.id)                                        AS lead_count
FROM public.tenants t
LEFT JOIN public.subscriptions s ON s.tenant_id = t.id
LEFT JOIN public.plans p         ON p.id = s.plan_id;

-- ─── 5. subscription_addons — add-ons ativos por tenant ──────────────────────

CREATE TABLE IF NOT EXISTS public.subscription_addons (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  subscription_id UUID        REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  addon_type      TEXT        NOT NULL,
  -- 'whatsapp_extra' | 'ia_recovery' | 'leads_extra' | 'user_extra' | 'multi_store'
  quantity        INT         NOT NULL DEFAULT 1,
  price_monthly   NUMERIC(10,2) NOT NULL,
  asaas_addon_id  TEXT,
  status          TEXT        NOT NULL DEFAULT 'active',
  -- 'active' | 'canceled' | 'paused'
  started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  canceled_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, addon_type)
);

-- RLS: only service_role can manage add-ons (same pattern as tenant_features)
ALTER TABLE public.subscription_addons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_manage_addons"
  ON public.subscription_addons
  FOR ALL
  TO service_role
  USING (TRUE)
  WITH CHECK (TRUE);

CREATE INDEX IF NOT EXISTS idx_subscription_addons_tenant
  ON public.subscription_addons (tenant_id);

CREATE INDEX IF NOT EXISTS idx_subscription_addons_status
  ON public.subscription_addons (status)
  WHERE status = 'active';

-- ─── 6. plan_addons catalog — produtos de add-on disponíveis ─────────────────

CREATE TABLE IF NOT EXISTS public.plan_addons (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  addon_type      TEXT        NOT NULL UNIQUE,
  display_name    TEXT        NOT NULL,
  description     TEXT,
  price_monthly   NUMERIC(10,2) NOT NULL,
  unit            TEXT        NOT NULL DEFAULT 'month',
  -- 'month' | 'seat' | 'pack'
  is_active       BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.plan_addons (addon_type, display_name, description, price_monthly) VALUES
  ('whatsapp_extra', 'WhatsApp Extra',   'Instância WhatsApp adicional + QR',            39.00),
  ('ia_recovery',    'IA Recovery',      'Recuperação automática de leads via IA',        49.00),
  ('leads_extra',    'Leads Extra',      '+ 500 leads/mês adicionais',                    29.00),
  ('user_extra',     'Usuário Extra',    'Usuário adicional na equipe',                    19.00),
  ('multi_store',    'Multi-Loja',       'Gerenciamento de múltiplas revendas',           99.00)
ON CONFLICT (addon_type) DO NOTHING;
