-- Migration 023: corrige get_tenant_usage — adiciona tenant_features ao merge 3-way
-- Causa: migration 022 foi aplicada sem o branch tenant_features no UNION ALL
-- A função existia com apenas 2 branches (plan + addons); tenant_features era ignorado
-- Fix: recriar com os 3 branches corretos

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
    -- Merge 3-way: plan features + tenant_features overrides + active add-on features
    (
      SELECT COALESCE(jsonb_agg(DISTINCT f), '[]'::jsonb)
      FROM (
        -- Branch 1: features base do plano contratado
        SELECT jsonb_array_elements_text(pl.features) AS f
        UNION ALL
        -- Branch 2: overrides manuais pelo super_admin via tenant_features
        SELECT tf.feature AS f
        FROM public.tenant_features tf
        WHERE tf.tenant_id = p_tenant_id
          AND tf.enabled = true
          AND (tf.expires_at IS NULL OR tf.expires_at > NOW())
        UNION ALL
        -- Branch 3: features concedidas por add-ons ativos
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

-- Permissões
REVOKE ALL ON FUNCTION public.get_tenant_usage(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_tenant_usage(uuid) TO service_role;
