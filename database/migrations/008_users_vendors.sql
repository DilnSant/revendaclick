-- Migration 008: Users & Vendors management
-- Adds RLS for vendor invitation flow + usage view for plan enforcement
-- Run in Supabase SQL editor

BEGIN;

-- ── vendor_invitations table ─────────────────────────────────────────────────
-- Tracks pending invitations sent by owner/admin to new team members.

CREATE TABLE IF NOT EXISTS vendor_invitations (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  invited_by  UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email       TEXT        NOT NULL,
  role        user_role   NOT NULL DEFAULT 'seller',
  token       TEXT        NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  accepted_at TIMESTAMPTZ,
  expires_at  TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '7 days',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT vendor_invitations_one_pending UNIQUE (tenant_id, email)
);

CREATE INDEX IF NOT EXISTS idx_vendor_invitations_tenant
  ON vendor_invitations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_vendor_invitations_token
  ON vendor_invitations(token)
  WHERE accepted_at IS NULL;

ALTER TABLE vendor_invitations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "vendor_invitations_tenant_select" ON vendor_invitations;
CREATE POLICY "vendor_invitations_tenant_select"
  ON vendor_invitations FOR SELECT
  USING (tenant_id = auth_tenant_id());

DROP POLICY IF EXISTS "vendor_invitations_insert" ON vendor_invitations;
CREATE POLICY "vendor_invitations_insert"
  ON vendor_invitations FOR INSERT
  WITH CHECK (
    tenant_id = auth_tenant_id()
    AND auth_user_role() IN ('owner', 'admin')
  );

DROP POLICY IF EXISTS "vendor_invitations_delete" ON vendor_invitations;
CREATE POLICY "vendor_invitations_delete"
  ON vendor_invitations FOR DELETE
  USING (
    tenant_id = auth_tenant_id()
    AND auth_user_role() IN ('owner', 'admin')
  );

-- ── plan_usage view ──────────────────────────────────────────────────────────
-- Consolidated view: counts + limits for dashboard enforcement.
-- RLS applies via underlying tables (service role bypasses).

CREATE OR REPLACE VIEW plan_usage AS
SELECT
  t.id                                        AS tenant_id,
  p.name::text                                AS plan_name,
  p.display_name                              AS plan_display,
  s.status::text                              AS subscription_status,
  COUNT(DISTINCT v.id) FILTER (WHERE v.status != 'inactive')  AS vehicles_count,
  COUNT(DISTINCT u.id) FILTER (WHERE u.is_active)             AS users_count,
  COUNT(DISTINCT l.id)                                        AS leads_count,
  p.max_vehicles,
  p.max_users,
  p.max_leads,
  p.features
FROM tenants t
JOIN subscriptions s ON s.tenant_id = t.id
JOIN plans p         ON p.id = s.plan_id
LEFT JOIN vehicles v ON v.tenant_id = t.id
LEFT JOIN users u    ON u.tenant_id = t.id
LEFT JOIN leads l    ON l.tenant_id = t.id
  AND l.created_at >= DATE_TRUNC('month', NOW())
GROUP BY t.id, p.name, p.display_name, s.status, p.max_vehicles, p.max_users, p.max_leads, p.features;

COMMIT;
