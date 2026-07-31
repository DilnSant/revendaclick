-- Atualiza período de trial de 7 para 30 dias e carência (grace period) de 3 para 7 dias.
-- Aplica-se apenas a novas assinaturas (novo tenant) e novas transições para 'past_due' —
-- assinaturas já em trial/carência no momento do deploy mantêm as datas já calculadas.
-- Aplicado diretamente em produção (projeto ibgaywezfcbbiiziaoac) em 2026-07-31;
-- este arquivo mantém o histórico de migrations consistente para deploys futuros.

CREATE OR REPLACE FUNCTION public.auto_assign_trial_subscription()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
    NOW() + INTERVAL '30 days',
    NOW(),
    NOW() + INTERVAL '30 days'
  )
  ON CONFLICT (tenant_id) DO NOTHING;

  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.set_subscription_grace()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  IF NEW.status = 'past_due' AND OLD.status != 'past_due' THEN
    NEW.grace_until = NOW() + INTERVAL '7 days';
  END IF;
  RETURN NEW;
END;
$function$;
