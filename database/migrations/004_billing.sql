-- Migration 004: Asaas Billing Fields
-- Safe to re-apply (all idempotent)

ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS asaas_customer_id TEXT;

ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS asaas_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS asaas_payment_link    TEXT,
  ADD COLUMN IF NOT EXISTS grace_until            TIMESTAMPTZ;

-- Index for webhook lookup by asaas subscription id
CREATE INDEX IF NOT EXISTS idx_subscriptions_asaas
  ON subscriptions(asaas_subscription_id)
  WHERE asaas_subscription_id IS NOT NULL;

-- Function to mark subscription grace period (3-day grace on past_due)
CREATE OR REPLACE FUNCTION set_subscription_grace()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status = 'past_due' AND OLD.status != 'past_due' THEN
    NEW.grace_until = NOW() + INTERVAL '3 days';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_subscription_grace ON subscriptions;
CREATE TRIGGER trg_subscription_grace
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION set_subscription_grace();
