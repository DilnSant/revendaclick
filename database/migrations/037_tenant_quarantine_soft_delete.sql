-- Migration 037: Quarantine and soft-delete support for tenants
-- Applied via Supabase MCP (sessão 53 — FC049)

ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS quarantined_at     TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS quarantine_reason  TEXT,
  ADD COLUMN IF NOT EXISTS deleted_at         TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_reason     TEXT;

-- Index for common filter: active tenants (not deleted)
CREATE INDEX IF NOT EXISTS idx_tenants_deleted_at ON tenants (deleted_at) WHERE deleted_at IS NULL;
