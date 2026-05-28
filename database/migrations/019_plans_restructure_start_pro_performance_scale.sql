-- Migration 019: Reestruturação estratégica dos planos
-- start | pro | performance | scale
-- WhatsApp público = padrão (todos os planos) | Central de Atendimento = Pro+

-- 1. Adiciona coluna tagline
ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS tagline TEXT;

-- 2. Drop view dependente para poder alterar o tipo da coluna
DROP VIEW IF EXISTS public.plan_usage;

-- 3. Converte plans.name de enum para TEXT (permite nomes livres)
ALTER TABLE public.plans
  ALTER COLUMN name TYPE TEXT USING name::TEXT;

-- 4. Start (era starter) — loja online básica, sem Evolution/QR
UPDATE public.plans SET
  name          = 'start',
  display_name  = 'Start',
  tagline       = 'Comece sua revenda online',
  max_vehicles  = 15,
  max_users     = 2,
  max_leads     = 100,
  price_monthly = 97.00,
  price_yearly  = 970.00,
  features      = '["marketplace","whatsapp_button","lead_capture","crm"]'::jsonb
WHERE name = 'starter';

-- 5. Pro — Central de Atendimento + CRM + Analytics + Kanban
UPDATE public.plans SET
  display_name  = 'Pro',
  tagline       = 'Centralize seus atendimentos',
  max_vehicles  = 50,
  max_users     = 5,
  max_leads     = 500,
  price_monthly = 197.00,
  price_yearly  = 1970.00,
  features      = '["marketplace","whatsapp_button","lead_capture","crm","kanban","analytics","central_atendimento"]'::jsonb
WHERE name = 'pro';

-- 6. Performance (era premium) — IA + Automação + Campanhas
UPDATE public.plans SET
  name          = 'performance',
  display_name  = 'Performance',
  tagline       = 'Automatize sua operação',
  max_vehicles  = 120,
  max_users     = 15,
  max_leads     = 2500,
  price_monthly = 397.00,
  price_yearly  = 3970.00,
  features      = '["marketplace","whatsapp_button","lead_capture","crm","kanban","analytics","central_atendimento","ai_assistance","automation","campaigns"]'::jsonb
WHERE name = 'premium';

-- 7. Scale (era enterprise) — tudo liberado
UPDATE public.plans SET
  name          = 'scale',
  display_name  = 'Scale',
  tagline       = 'Escale sua revenda',
  max_vehicles  = -1,
  max_users     = -1,
  max_leads     = -1,
  price_monthly = 797.00,
  price_yearly  = 7970.00,
  features      = '["marketplace","whatsapp_button","lead_capture","crm","kanban","analytics","central_atendimento","ai_assistance","automation","campaigns","multi_store","api_access","white_label","priority_support"]'::jsonb
WHERE name = 'enterprise';

-- 8. Recria view plan_usage (name agora é TEXT, sem cast necessário)
CREATE VIEW public.plan_usage AS
  SELECT
    t.id AS tenant_id,
    p.name AS plan_name,
    p.display_name AS plan_display,
    s.status::TEXT AS subscription_status,
    COUNT(DISTINCT v.id) FILTER (WHERE v.status != 'inactive') AS vehicles_count,
    COUNT(DISTINCT u.id) FILTER (WHERE u.is_active) AS users_count,
    COUNT(DISTINCT l.id) AS leads_count,
    p.max_vehicles,
    p.max_users,
    p.max_leads,
    p.features
  FROM tenants t
  JOIN subscriptions s ON s.tenant_id = t.id
  JOIN plans p ON p.id = s.plan_id
  LEFT JOIN vehicles v ON v.tenant_id = t.id
  LEFT JOIN users u ON u.tenant_id = t.id
  LEFT JOIN leads l ON l.tenant_id = t.id
    AND l.created_at >= date_trunc('month', NOW())
  GROUP BY t.id, p.name, p.display_name, s.status, p.max_vehicles, p.max_users, p.max_leads, p.features;

-- 9. Atualiza trigger de trial automático para usar 'start'
CREATE OR REPLACE FUNCTION auto_assign_trial_subscription()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
    v_start_plan_id UUID;
BEGIN
    SELECT id INTO v_start_plan_id FROM plans WHERE name = 'start';

    INSERT INTO subscriptions (
        tenant_id, plan_id, status, billing_cycle,
        current_period_start, current_period_end, trial_ends_at
    ) VALUES (
        NEW.id, v_start_plan_id, 'trialing', 'monthly',
        NOW(), NOW() + INTERVAL '7 days', NOW() + INTERVAL '7 days'
    )
    ON CONFLICT (tenant_id) DO NOTHING;

    RETURN NEW;
END;
$$;
