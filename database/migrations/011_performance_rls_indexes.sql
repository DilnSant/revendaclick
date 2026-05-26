-- =============================================================================
-- Migration 011 — Performance: missing indexes + RLS policy optimization
-- Applied: 2026-05-26
--
-- 1. Missing indexes from migration 009 (never applied via Supabase migration system)
-- 2. FK indexes missing on business tables (identified by Supabase advisor)
-- 3. RLS policy optimization: wrap auth.function() calls in (SELECT ...) to
--    prevent per-row re-evaluation (Supabase performance advisor recommendation)
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- PART 1 — Missing indexes from migration 009
-- (CREATE INDEX IF NOT EXISTS — idempotent)
-- ─────────────────────────────────────────────────────────────────────────────

-- Analytics: sales by sold_at (month aggregation) — analytics/repository.go filters on sold_at
CREATE INDEX IF NOT EXISTS idx_sales_sold_at_analytics
    ON sales(tenant_id, sold_at DESC)
    WHERE sold_at IS NOT NULL AND status = 'completed';

-- Analytics: leads follow-up filter (overdue + due-today)
CREATE INDEX IF NOT EXISTS idx_leads_followup_pending
    ON leads(tenant_id, follow_up_at)
    WHERE follow_up_at IS NOT NULL
      AND status NOT IN ('closed_won', 'closed_lost');

-- Public vehicle listing (SEO pages) — covers ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_vehicles_public_listing
    ON vehicles(tenant_id, created_at DESC)
    WHERE status = 'available';

-- Billing events deduplication — speeds up TryLockEvent ON CONFLICT lookup
CREATE UNIQUE INDEX IF NOT EXISTS idx_billing_events_key
    ON billing_events(event_key);

-- Users fast lookup by id (TenantResolver fallback)
CREATE INDEX IF NOT EXISTS idx_users_id_active
    ON users(id)
    WHERE is_active = TRUE;

-- ─────────────────────────────────────────────────────────────────────────────
-- PART 2 — Missing FK indexes
-- ─────────────────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_commissions_seller_id
    ON commissions(seller_id);

CREATE INDEX IF NOT EXISTS idx_financial_entries_created_by
    ON financial_entries(created_by)
    WHERE created_by IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_lead_activities_user_id
    ON lead_activities(user_id)
    WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_sales_customer_id
    ON sales(customer_id)
    WHERE customer_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_sales_lead_id
    ON sales(lead_id)
    WHERE lead_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_sales_seller_id
    ON sales(seller_id)
    WHERE seller_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_seller_commission_rules_seller_id
    ON seller_commission_rules(seller_id);

CREATE INDEX IF NOT EXISTS idx_subscriptions_plan_id
    ON subscriptions(plan_id);

CREATE INDEX IF NOT EXISTS idx_tenant_plan_history_changed_by
    ON tenant_plan_history(changed_by)
    WHERE changed_by IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_tenant_plan_history_from_plan_id
    ON tenant_plan_history(from_plan_id)
    WHERE from_plan_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_tenant_plan_history_to_plan_id
    ON tenant_plan_history(to_plan_id);

CREATE INDEX IF NOT EXISTS idx_vehicles_seller_id
    ON vehicles(seller_id)
    WHERE seller_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_vendor_invitations_invited_by
    ON vendor_invitations(invited_by)
    WHERE invited_by IS NOT NULL;

-- ─────────────────────────────────────────────────────────────────────────────
-- PART 3 — RLS policy optimization
-- Wrap auth.function() in (SELECT ...) to evaluate once per query, not per row.
-- Ref: https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select
-- ─────────────────────────────────────────────────────────────────────────────

-- ── audit_logs ───────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS audit_logs_tenant_isolation ON audit_logs;
CREATE POLICY audit_logs_tenant_isolation ON audit_logs
    FOR ALL
    USING ((tenant_id)::text = (SELECT auth.jwt() ->> 'tenant_id'));

-- ── billing_customers ────────────────────────────────────────────────────────
DROP POLICY IF EXISTS billing_customers_tenant_select ON billing_customers;
CREATE POLICY billing_customers_tenant_select ON billing_customers
    FOR SELECT
    USING ((tenant_id)::text = (SELECT auth.jwt() ->> 'tenant_id'));

-- ── billing_events ───────────────────────────────────────────────────────────
DROP POLICY IF EXISTS billing_events_tenant_select ON billing_events;
CREATE POLICY billing_events_tenant_select ON billing_events
    FOR SELECT
    USING ((tenant_id)::text = (SELECT auth.jwt() ->> 'tenant_id'));

-- ── billing_invoices ─────────────────────────────────────────────────────────
DROP POLICY IF EXISTS billing_invoices_tenant_select ON billing_invoices;
CREATE POLICY billing_invoices_tenant_select ON billing_invoices
    FOR SELECT
    USING ((tenant_id)::text = (SELECT auth.jwt() ->> 'tenant_id'));

-- ── commissions ──────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS commissions_tenant_isolation ON commissions;
CREATE POLICY commissions_tenant_isolation ON commissions
    FOR ALL
    USING      ((tenant_id)::text = (SELECT auth.jwt() ->> 'tenant_id'))
    WITH CHECK ((tenant_id)::text = (SELECT auth.jwt() ->> 'tenant_id'));

-- ── financial_entries ────────────────────────────────────────────────────────
DROP POLICY IF EXISTS financial_entries_tenant_isolation ON financial_entries;
CREATE POLICY financial_entries_tenant_isolation ON financial_entries
    FOR ALL
    USING      ((tenant_id)::text = (SELECT auth.jwt() ->> 'tenant_id'))
    WITH CHECK ((tenant_id)::text = (SELECT auth.jwt() ->> 'tenant_id'));

-- ── leads: leads_seller_read ─────────────────────────────────────────────────
DROP POLICY IF EXISTS leads_seller_read ON leads;
CREATE POLICY leads_seller_read ON leads
    FOR SELECT
    USING (
        (tenant_id = (SELECT auth_tenant_id()))
        AND (
            ((SELECT auth_user_role()) = ANY (ARRAY['owner'::user_role, 'admin'::user_role]))
            OR (seller_id IN (
                SELECT sellers.id FROM sellers WHERE sellers.user_id = (SELECT auth.uid())
            ))
        )
    );

-- ── leads: leads_update ──────────────────────────────────────────────────────
DROP POLICY IF EXISTS leads_update ON leads;
CREATE POLICY leads_update ON leads
    FOR UPDATE
    USING (
        (tenant_id = (SELECT auth_tenant_id()))
        AND (
            ((SELECT auth_user_role()) = ANY (ARRAY['owner'::user_role, 'admin'::user_role]))
            OR (seller_id IN (
                SELECT sellers.id FROM sellers WHERE sellers.user_id = (SELECT auth.uid())
            ))
        )
    )
    WITH CHECK (tenant_id = (SELECT auth_tenant_id()));

-- ── sales ────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS sales_tenant_isolation ON sales;
CREATE POLICY sales_tenant_isolation ON sales
    FOR ALL
    USING      ((tenant_id)::text = (SELECT auth.jwt() ->> 'tenant_id'))
    WITH CHECK ((tenant_id)::text = (SELECT auth.jwt() ->> 'tenant_id'));

-- ── seller_commission_rules ──────────────────────────────────────────────────
DROP POLICY IF EXISTS commission_rules_tenant_isolation ON seller_commission_rules;
CREATE POLICY commission_rules_tenant_isolation ON seller_commission_rules
    FOR ALL
    USING      ((tenant_id)::text = (SELECT auth.jwt() ->> 'tenant_id'))
    WITH CHECK ((tenant_id)::text = (SELECT auth.jwt() ->> 'tenant_id'));

-- ── tenant_plan_history ──────────────────────────────────────────────────────
DROP POLICY IF EXISTS plan_history_tenant_select ON tenant_plan_history;
CREATE POLICY plan_history_tenant_select ON tenant_plan_history
    FOR SELECT
    USING ((tenant_id)::text = (SELECT auth.jwt() ->> 'tenant_id'));

-- ── users: users_update_admin ────────────────────────────────────────────────
DROP POLICY IF EXISTS users_update_admin ON users;
CREATE POLICY users_update_admin ON users
    FOR UPDATE
    USING (
        (tenant_id = (SELECT auth_tenant_id()))
        AND (
            ((SELECT auth_user_role()) = ANY (ARRAY['owner'::user_role, 'admin'::user_role]))
            OR (id = (SELECT auth.uid()))
        )
    )
    WITH CHECK (tenant_id = (SELECT auth_tenant_id()));

-- ── users: users_delete_admin ────────────────────────────────────────────────
DROP POLICY IF EXISTS users_delete_admin ON users;
CREATE POLICY users_delete_admin ON users
    FOR DELETE
    USING (
        (tenant_id = (SELECT auth_tenant_id()))
        AND ((SELECT auth_user_role()) = ANY (ARRAY['owner'::user_role, 'admin'::user_role]))
        AND (id <> (SELECT auth.uid()))
    );

-- ── vehicles: vehicles_update ────────────────────────────────────────────────
DROP POLICY IF EXISTS vehicles_update ON vehicles;
CREATE POLICY vehicles_update ON vehicles
    FOR UPDATE
    USING (
        (tenant_id = (SELECT auth_tenant_id()))
        AND (
            ((SELECT auth_user_role()) = ANY (ARRAY['owner'::user_role, 'admin'::user_role]))
            OR (
                (SELECT auth_user_role()) = 'seller'::user_role
                AND seller_id IN (
                    SELECT sellers.id FROM sellers WHERE sellers.user_id = (SELECT auth.uid())
                )
            )
        )
    )
    WITH CHECK (tenant_id = (SELECT auth_tenant_id()));
