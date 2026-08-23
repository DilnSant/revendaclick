-- 041 — Atualização de preços e limites (estratégia "Atratividade Máxima")
--
-- CONTEXTO
-- Nova grade comercial decidida pelo usuário: limites bem maiores nos planos
-- iniciais/intermediários para se diferenciar da concorrência, e o plano
-- `scale` (já existente, já oculto do grid público, já com limites -1/-1/-1)
-- reaproveitado como "Enterprise" — só troca de nome de exibição, o `name`
-- interno continua `scale` (referenciado em SubscriptionsTable.tsx,
-- billing/plans/page.tsx e PlansGrid.tsx como filtro do grid público).
--
-- price_yearly é o valor TOTAL cobrado no ano (não o "por mês"); os
-- valores abaixo batem com price_yearly/12 = mensal-equivalente combinado
-- com o usuário: 970/12=80.83, 1970/12=164.17, 3970/12=330.83, 5964/12=497.
--
-- Sem mudança de schema — apenas dados. Não requer regenerar
-- frontend/lib/database.types.ts (FC029 é só para mudança de colunas/tabelas).
--
-- REVERSÍVEL: os valores anteriores estão no histórico de deploy do
-- REFERENCE.md (starter 97/970/15/2/100, pro 197/1970/50/5/500,
-- premium 397/3970/120/15/2500, scale 797/7970/-1/-1/-1).

BEGIN;

UPDATE public.plans SET
  price_monthly = 97,
  price_yearly  = 970,
  max_vehicles  = 20,
  max_users     = 2,
  max_leads     = 200
WHERE name = 'starter';

UPDATE public.plans SET
  price_monthly = 197,
  price_yearly  = 1970,
  max_vehicles  = 60,
  max_users     = 5,
  max_leads     = 1000
WHERE name = 'pro';

UPDATE public.plans SET
  price_monthly = 397,
  price_yearly  = 3970,
  max_vehicles  = 150,
  max_users     = 15,
  max_leads     = 3000
WHERE name = 'premium';

-- 'scale' → rebranded to "Enterprise" (display_name only; name stays 'scale')
UPDATE public.plans SET
  display_name  = 'Enterprise',
  tagline       = 'Ilimitado para sua rede',
  price_monthly = 597,
  price_yearly  = 5964,
  max_vehicles  = -1,
  max_users     = -1,
  max_leads     = -1
WHERE name = 'scale';

COMMIT;
