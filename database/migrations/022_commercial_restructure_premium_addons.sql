-- Migration 022: Reestruturação comercial definitiva
-- Sessão 22 — FASE 4
-- Planos públicos: Starter / Pro / Premium (era Performance) / Scale (oculto/Enterprise)
-- Add-ons: user_extra / whatsapp_automation (era whatsapp_extra) / ia_recovery

-- ─── 1. Rename performance → premium ─────────────────────────────────────────

UPDATE public.plans SET
  name         = 'premium',
  display_name = 'Premium',
  tagline      = 'Automatize sua operação'
WHERE name = 'performance';

-- ─── 2. Atualizar features por plano ─────────────────────────────────────────

-- Starter: marketplace + loja + leads + financeiro básico + vendedores
-- SEM: crm, kanban, analytics, central_atendimento, IA
UPDATE public.plans SET
  features = '["marketplace","whatsapp_button","lead_capture","financial","vendors"]'::jsonb
WHERE name = 'starter';

-- Pro: tudo Starter + CRM/Atendimento + kanban + analytics
-- SEM: central_atendimento (agora é add-on ou Premium), SEM IA
UPDATE public.plans SET
  features = '["marketplace","whatsapp_button","lead_capture","financial","vendors","crm","kanban","analytics"]'::jsonb
WHERE name = 'pro';

-- Premium: tudo Pro + Evolution/QR + IA + automação + campanhas + recuperação de leads
UPDATE public.plans SET
  features = '["marketplace","whatsapp_button","lead_capture","financial","vendors","crm","kanban","analytics","central_atendimento","whatsapp_qr","ai_assistance","automation","campaigns","lead_recovery"]'::jsonb
WHERE name = 'premium';

-- Scale (Enterprise oculto): mantém tudo Premium + enterprise features
UPDATE public.plans SET
  features = '["marketplace","whatsapp_button","lead_capture","financial","vendors","crm","kanban","analytics","central_atendimento","whatsapp_qr","ai_assistance","automation","campaigns","lead_recovery","multi_store","api_access","white_label","priority_support"]'::jsonb
WHERE name = 'scale';

-- ─── 3. Coluna features na tabela plan_addons ─────────────────────────────────

ALTER TABLE public.plan_addons
  ADD COLUMN IF NOT EXISTS features JSONB NOT NULL DEFAULT '[]'::jsonb;

-- ─── 4. Atualizar catálogo de add-ons ─────────────────────────────────────────

-- Renomear whatsapp_extra → whatsapp_automation
UPDATE public.plan_addons SET
  addon_type    = 'whatsapp_automation',
  display_name  = 'WhatsApp Automação',
  description   = 'QR Code, Evolution API, notificações e lembretes automáticos',
  price_monthly = 39.00,
  features      = '["central_atendimento","automation","whatsapp_qr"]'::jsonb
WHERE addon_type = 'whatsapp_extra';

-- ia_recovery: R$49 → R$39, adicionar features
UPDATE public.plan_addons SET
  price_monthly = 39.00,
  description   = 'Recuperação automática de leads com IA e follow-up inteligente',
  features      = '["ai_assistance","lead_recovery"]'::jsonb
WHERE addon_type = 'ia_recovery';

-- user_extra: R$19 → R$20, adicionar features
UPDATE public.plan_addons SET
  price_monthly = 20.00,
  description   = '+1 usuário adicional na equipe',
  features      = '["extra_user"]'::jsonb
WHERE addon_type = 'user_extra';

-- Desativar add-ons não implementados no produto atual
UPDATE public.plan_addons SET is_active = FALSE
WHERE addon_type IN ('leads_extra', 'multi_store');

-- ─── 5. Recriar view plan_usage ───────────────────────────────────────────────

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

-- ─── 6. get_tenant_usage RPC — merge plan features + add-on features ──────────

DROP FUNCTION IF EXISTS public.get_tenant_usage(uuid);

CREATE OR REPLACE FUNCTION public.get_tenant_usage(p_tenant_id UUID)
RETURNS TABLE (
  vehicles_count  BIGINT,
  users_count     BIGINT,
  leads_count     BIGINT,
  max_vehicles    INT,
  max_users       INT,
  max_leads       INT,
  vehicles_pct    NUMERIC,
  users_pct       NUMERIC,
  plan_name       TEXT,
  plan_display    TEXT,
  sub_status      TEXT,
  features        JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*)::BIGINT FROM public.vehicles v
      WHERE v.tenant_id = p_tenant_id AND v.status != 'inactive'),
    (SELECT COUNT(*)::BIGINT FROM public.users u
      WHERE u.tenant_id = p_tenant_id AND u.is_active = TRUE),
    (SELECT COUNT(*)::BIGINT FROM public.leads l
      WHERE l.tenant_id = p_tenant_id),
    pl.max_vehicles,
    pl.max_users,
    pl.max_leads,
    CASE WHEN pl.max_vehicles = -1 THEN 0::NUMERIC
         ELSE ROUND(
           (SELECT COUNT(*)::NUMERIC FROM public.vehicles v
             WHERE v.tenant_id = p_tenant_id AND v.status != 'inactive')
           / NULLIF(pl.max_vehicles, 0) * 100, 1)
    END,
    CASE WHEN pl.max_users = -1 THEN 0::NUMERIC
         ELSE ROUND(
           (SELECT COUNT(*)::NUMERIC FROM public.users u
             WHERE u.tenant_id = p_tenant_id AND u.is_active = TRUE)
           / NULLIF(pl.max_users, 0) * 100, 1)
    END,
    pl.name::TEXT,
    pl.display_name,
    s.status::TEXT,
    -- Merge plan features + tenant_features overrides + active add-on features
    (
      SELECT COALESCE(jsonb_agg(DISTINCT f), '[]'::jsonb)
      FROM (
        -- Base plan features
        SELECT jsonb_array_elements_text(pl.features) AS f
        UNION ALL
        -- Admin-granted tenant feature overrides
        SELECT tf.feature AS f
        FROM public.tenant_features tf
        WHERE tf.tenant_id = p_tenant_id
          AND tf.enabled = true
          AND (tf.expires_at IS NULL OR tf.expires_at > NOW())
        UNION ALL
        -- Active add-on features
        SELECT jsonb_array_elements_text(pa.features) AS f
        FROM public.subscription_addons sa
        JOIN public.plan_addons pa ON pa.addon_type = sa.addon_type
        WHERE sa.tenant_id = p_tenant_id
          AND sa.status = 'active'
          AND jsonb_array_length(pa.features) > 0
      ) merged
    )
  FROM public.subscriptions s
  JOIN public.plans pl ON pl.id = s.plan_id
  WHERE s.tenant_id = p_tenant_id
    AND s.status IN ('active', 'trialing', 'past_due');
END;
$$;

REVOKE ALL ON FUNCTION public.get_tenant_usage(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_tenant_usage(uuid) TO service_role;
