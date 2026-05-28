-- ============================================================
-- 020 — tenant_features + super_admin + onboarding v2
-- 2026-05-28
-- ============================================================

-- ── 1. super_admin role ──────────────────────────────────────

ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'super_admin';

-- ── 2. tenant_features (per-tenant feature overrides) ────────
-- Allows admin to grant/revoke individual features to a tenant
-- regardless of their plan. PlanGate checks this as an OR.

CREATE TABLE IF NOT EXISTS tenant_features (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  feature     TEXT        NOT NULL,
  enabled     BOOLEAN     NOT NULL DEFAULT true,
  granted_by  UUID        REFERENCES users(id) ON DELETE SET NULL,
  expires_at  TIMESTAMPTZ,
  note        TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, feature)
);

CREATE INDEX IF NOT EXISTS idx_tenant_features_tenant_id
  ON tenant_features(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_features_active
  ON tenant_features(tenant_id, feature)
  WHERE enabled = true;

ALTER TABLE tenant_features ENABLE ROW LEVEL SECURITY;

-- Only service_role can manage tenant_features (admin-only table)
CREATE POLICY "service_role_all_tenant_features"
  ON tenant_features
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ── 3. onboarding_checklists v2 ──────────────────────────────
-- New steps: added_vehicle, published_store, received_first_lead (required)
-- whatsapp_connected (optional — Central de Atendimento)
-- Legacy columns kept for backwards compatibility

ALTER TABLE onboarding_checklists
  ADD COLUMN IF NOT EXISTS received_first_lead BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS whatsapp_connected   BOOLEAN NOT NULL DEFAULT false;

-- Backfill whatsapp_connected from configured_whatsapp for existing rows
UPDATE onboarding_checklists
SET whatsapp_connected = configured_whatsapp
WHERE whatsapp_connected = false AND configured_whatsapp = true;

-- ── 4. Auto-trigger: mark added_vehicle when first vehicle is inserted ──

CREATE OR REPLACE FUNCTION _mark_vehicle_added()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE onboarding_checklists
  SET added_vehicle = true, updated_at = NOW()
  WHERE tenant_id = NEW.tenant_id
    AND added_vehicle = false;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_mark_vehicle_added ON vehicles;
CREATE TRIGGER trg_mark_vehicle_added
  AFTER INSERT ON vehicles
  FOR EACH ROW EXECUTE FUNCTION _mark_vehicle_added();

-- ── 5. Auto-trigger: mark received_first_lead when first lead arrives ───

CREATE OR REPLACE FUNCTION _mark_first_lead_received()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE onboarding_checklists
  SET received_first_lead = true, updated_at = NOW()
  WHERE tenant_id = NEW.tenant_id
    AND received_first_lead = false;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_mark_first_lead_received ON leads;
CREATE TRIGGER trg_mark_first_lead_received
  AFTER INSERT ON leads
  FOR EACH ROW EXECUTE FUNCTION _mark_first_lead_received();

-- ── 6. Update completed_at condition ─────────────────────────
-- New: completed when added_vehicle + published_store + received_first_lead
-- (whatsapp_connected is optional, added_seller not required)

CREATE OR REPLACE FUNCTION _update_onboarding_completed()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NEW.added_vehicle AND NEW.published_store AND NEW.received_first_lead
     AND NEW.completed_at IS NULL THEN
    NEW.completed_at = NOW();
  END IF;
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_onboarding_completed ON onboarding_checklists;
CREATE TRIGGER trg_onboarding_completed
  BEFORE UPDATE ON onboarding_checklists
  FOR EACH ROW EXECUTE FUNCTION _update_onboarding_completed();

-- Backfill completed_at for tenants already meeting the new condition
UPDATE onboarding_checklists
SET completed_at = COALESCE(completed_at, NOW())
WHERE added_vehicle = true
  AND published_store = true
  AND received_first_lead = true
  AND completed_at IS NULL;

-- ── 7. tenant_features updated_at trigger ────────────────────

CREATE OR REPLACE FUNCTION _set_tenant_features_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_tenant_features_updated_at ON tenant_features;
CREATE TRIGGER trg_tenant_features_updated_at
  BEFORE UPDATE ON tenant_features
  FOR EACH ROW EXECUTE FUNCTION _set_tenant_features_updated_at();

-- ── 8. auto_create_onboarding_checklist: add new columns ─────

CREATE OR REPLACE FUNCTION auto_create_onboarding_checklist()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO onboarding_checklists
    (tenant_id, added_vehicle, configured_whatsapp, published_store,
     added_seller, received_first_lead, whatsapp_connected)
  VALUES
    (NEW.id, false, false, false, false, false, false)
  ON CONFLICT (tenant_id) DO NOTHING;
  RETURN NEW;
END;
$$;
