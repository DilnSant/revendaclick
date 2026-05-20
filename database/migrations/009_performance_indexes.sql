-- =============================================================================
-- Migration 009: Performance Indexes
-- Idempotent (CREATE INDEX IF NOT EXISTS)
--
-- Covers gaps identified in analytics, public listing, and subscription lookups.
-- =============================================================================

-- ─── Analytics: sales by completed_at (month aggregation) ────────────────────
-- analytics/repository.go filters on completed_at, not sold_at.
-- Existing idx_sales_sold_at does not help these queries.
CREATE INDEX IF NOT EXISTS idx_sales_completed_at
    ON sales(tenant_id, completed_at DESC)
    WHERE completed_at IS NOT NULL;

-- ─── Analytics: leads follow-up filter (overdue + due-today) ─────────────────
-- Query: WHERE follow_up_at IS NOT NULL AND status NOT IN ('closed_won','closed_lost')
-- Partial index on pending leads with upcoming follow-ups.
CREATE INDEX IF NOT EXISTS idx_leads_followup_pending
    ON leads(tenant_id, follow_up_at)
    WHERE follow_up_at IS NOT NULL
      AND status NOT IN ('closed_won', 'closed_lost');

-- ─── Public vehicle listing (SEO pages) ──────────────────────────────────────
-- Covers: WHERE tenant_id = $1 AND status = 'available' ORDER BY created_at DESC
-- The existing idx_vehicles_tenant_status is (tenant_id, status); this adds
-- ordering column so Postgres can avoid a sort pass on public listings.
CREATE INDEX IF NOT EXISTS idx_vehicles_public_listing
    ON vehicles(tenant_id, created_at DESC)
    WHERE status = 'available';

-- ─── Subscription lookup by Asaas ID (webhook processing) ───────────────────
-- Already exists in 004_billing.sql but reproduced here idempotently to ensure
-- it is present if migrations are applied out of order.
CREATE INDEX IF NOT EXISTS idx_subscriptions_asaas
    ON subscriptions(asaas_subscription_id)
    WHERE asaas_subscription_id IS NOT NULL;

-- ─── Billing events deduplication (idempotency check) ───────────────────────
-- TryLockEvent does INSERT ... ON CONFLICT (event_key); primary constraint
-- already enforces uniqueness, but an explicit index speeds up the lookup
-- on large billing_events tables.
CREATE UNIQUE INDEX IF NOT EXISTS idx_billing_events_key
    ON billing_events(event_key);

-- ─── Users: fast lookup by id (used in TenantResolver fallback path) ─────────
CREATE INDEX IF NOT EXISTS idx_users_id_active
    ON users(id)
    WHERE is_active = TRUE;
