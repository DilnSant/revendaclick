-- Migration 006: Follow-ups + Audit trail
-- Run in Supabase SQL editor

BEGIN;

-- ── Follow-up column on leads ────────────────────────────────────────────────

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS follow_up_at   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS follow_up_note TEXT;

CREATE INDEX IF NOT EXISTS idx_leads_follow_up_at
  ON leads (tenant_id, follow_up_at)
  WHERE follow_up_at IS NOT NULL;

-- ── Audit logs ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS audit_logs (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id     UUID,
  action      TEXT        NOT NULL,   -- e.g. "lead.status_changed", "vehicle.created"
  entity_type TEXT        NOT NULL,   -- "lead", "vehicle", "user", etc.
  entity_id   UUID,
  old_data    JSONB,
  new_data    JSONB,
  ip_address  INET,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant ON audit_logs (tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs (tenant_id, entity_type, entity_id);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "audit_logs_tenant_isolation" ON audit_logs;
CREATE POLICY "audit_logs_tenant_isolation"
  ON audit_logs FOR ALL
  USING (tenant_id::text = auth.jwt() ->> 'tenant_id');

COMMIT;
