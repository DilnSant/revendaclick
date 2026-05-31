-- ─── migration 027 — Add-on Billing Integration ──────────────────────────────
-- Habilita billing real de add-ons via Asaas (Etapa 5):
--
--   grace_until        → grace period após PAYMENT_OVERDUE (mesmo padrão de subscriptions)
--   asaas_payment_link → link de pagamento para status='pending_payment'
--   idx_asaas_id       → lookup O(log n) no webhook routing
--   idx_grandfathered  → relatório administrativo add-ons sem billing (FC032/FC033)
--
-- Novos status (application-level, sem CHECK constraint para compatibilidade):
--   'pending_payment' → aguardando PAYMENT_CONFIRMED
--   'past_due'        → PAYMENT_OVERDUE + grace_until ativo
--   Existentes: 'active' | 'canceled' | 'paused'
--
-- ROLLBACK:
--   BEGIN;
--   ALTER TABLE public.subscription_addons
--     DROP COLUMN IF EXISTS grace_until,
--     DROP COLUMN IF EXISTS asaas_payment_link;
--   DROP INDEX IF EXISTS idx_subscription_addons_asaas_id;
--   DROP INDEX IF EXISTS idx_subscription_addons_grandfathered;
--   COMMIT;

BEGIN;

ALTER TABLE public.subscription_addons
  ADD COLUMN IF NOT EXISTS grace_until        TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS asaas_payment_link TEXT;

-- Webhook routing: encontrar tenant por asaas_addon_id em O(log n)
CREATE INDEX IF NOT EXISTS idx_subscription_addons_asaas_id
  ON public.subscription_addons (asaas_addon_id)
  WHERE asaas_addon_id IS NOT NULL;

-- FC033/D3: relatório de add-ons grandfathered (ativos sem billing Asaas)
CREATE INDEX IF NOT EXISTS idx_subscription_addons_grandfathered
  ON public.subscription_addons (tenant_id, addon_type, started_at)
  WHERE asaas_addon_id IS NULL AND status = 'active';

COMMIT;
