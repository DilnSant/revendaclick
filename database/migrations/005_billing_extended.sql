-- =============================================================================
-- Migration 005: Extended Billing Tables
-- Multi-tenant | RLS enabled | Idempotent
--
-- Adds: billing_customers, billing_events, billing_invoices, tenant_plan_history
-- Requires: 001_initial_schema.sql + 004_billing.sql already applied.
-- =============================================================================

-- ─── billing_customers ────────────────────────────────────────────────────────
-- Mirrors Asaas customer record alongside tenants.asaas_customer_id

CREATE TABLE IF NOT EXISTS billing_customers (
    id               UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id        UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    asaas_id         TEXT        NOT NULL UNIQUE,
    name             TEXT        NOT NULL,
    email            TEXT        NOT NULL,
    cpf_cnpj         TEXT,
    phone            TEXT,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT billing_customers_one_per_tenant UNIQUE (tenant_id)
);

CREATE INDEX IF NOT EXISTS idx_billing_customers_tenant
    ON billing_customers(tenant_id);

-- ─── billing_events ───────────────────────────────────────────────────────────
-- Idempotency store: every Asaas webhook event is persisted here.
-- event_id is the Asaas payment/subscription ID + event type, preventing replay.

CREATE TABLE IF NOT EXISTS billing_events (
    id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID        REFERENCES tenants(id) ON DELETE SET NULL,
    event_key       TEXT        NOT NULL UNIQUE,   -- "{event_type}:{asaas_id}"
    event_type      TEXT        NOT NULL,           -- PAYMENT_RECEIVED, PAYMENT_OVERDUE…
    asaas_id        TEXT,                           -- payment or subscription Asaas ID
    payload         JSONB       NOT NULL DEFAULT '{}',
    processed_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT billing_events_event_key_unique UNIQUE (event_key)
);

CREATE INDEX IF NOT EXISTS idx_billing_events_tenant
    ON billing_events(tenant_id);

CREATE INDEX IF NOT EXISTS idx_billing_events_type
    ON billing_events(event_type);

-- ─── billing_invoices ─────────────────────────────────────────────────────────
-- One row per Asaas payment (synchronized via webhook or polling).

DO $$ BEGIN
    CREATE TYPE invoice_status AS ENUM (
        'pending', 'confirmed', 'received', 'overdue', 'refunded', 'canceled'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS billing_invoices (
    id                  UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id           UUID            NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    asaas_payment_id    TEXT            NOT NULL UNIQUE,
    asaas_subscription  TEXT,
    value               NUMERIC(10,2)   NOT NULL,
    status              invoice_status  NOT NULL DEFAULT 'pending',
    billing_type        TEXT,           -- BOLETO, PIX, CREDIT_CARD
    due_date            DATE,
    paid_at             TIMESTAMPTZ,
    invoice_url         TEXT,
    bank_slip_url       TEXT,
    pix_qr_code         TEXT,
    pix_copy_paste      TEXT,
    description         TEXT,
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_billing_invoices_tenant
    ON billing_invoices(tenant_id);

CREATE INDEX IF NOT EXISTS idx_billing_invoices_asaas_sub
    ON billing_invoices(asaas_subscription)
    WHERE asaas_subscription IS NOT NULL;

ALTER TABLE billing_invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "billing_invoices_tenant_select" ON billing_invoices;
CREATE POLICY "billing_invoices_tenant_select"
    ON billing_invoices FOR SELECT
    USING (tenant_id::text = (auth.jwt() ->> 'tenant_id'));

-- ─── tenant_plan_history ──────────────────────────────────────────────────────
-- Immutable audit log of every plan change.

CREATE TABLE IF NOT EXISTS tenant_plan_history (
    id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    from_plan_id    UUID        REFERENCES plans(id),
    to_plan_id      UUID        NOT NULL REFERENCES plans(id),
    from_status     TEXT,
    to_status       TEXT        NOT NULL,
    billing_cycle   TEXT,
    changed_by      UUID        REFERENCES auth.users(id),
    reason          TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_plan_history_tenant
    ON tenant_plan_history(tenant_id);

ALTER TABLE tenant_plan_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "plan_history_tenant_select" ON tenant_plan_history;
CREATE POLICY "plan_history_tenant_select"
    ON tenant_plan_history FOR SELECT
    USING (tenant_id::text = (auth.jwt() ->> 'tenant_id'));

-- ─── billing_customers RLS ───────────────────────────────────────────────────
ALTER TABLE billing_customers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "billing_customers_tenant_select" ON billing_customers;
CREATE POLICY "billing_customers_tenant_select"
    ON billing_customers FOR SELECT
    USING (tenant_id::text = (auth.jwt() ->> 'tenant_id'));

-- ─── billing_events RLS ──────────────────────────────────────────────────────
ALTER TABLE billing_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "billing_events_tenant_select" ON billing_events;
CREATE POLICY "billing_events_tenant_select"
    ON billing_events FOR SELECT
    USING (tenant_id::text = (auth.jwt() ->> 'tenant_id'));

-- ─── Updated_at triggers ─────────────────────────────────────────────────────
CREATE TRIGGER IF NOT EXISTS trg_billing_customers_updated_at
    BEFORE UPDATE ON billing_customers
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER IF NOT EXISTS trg_billing_invoices_updated_at
    BEFORE UPDATE ON billing_invoices
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── Fix trial period: 7 days instead of 14 ──────────────────────────────────
CREATE OR REPLACE FUNCTION auto_assign_trial_subscription()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
    v_starter_plan_id UUID;
BEGIN
    SELECT id INTO v_starter_plan_id FROM plans WHERE name = 'starter';

    INSERT INTO subscriptions (
        tenant_id,
        plan_id,
        status,
        billing_cycle,
        current_period_start,
        current_period_end,
        trial_ends_at
    ) VALUES (
        NEW.id,
        v_starter_plan_id,
        'trialing',
        'monthly',
        NOW(),
        NOW() + INTERVAL '7 days',
        NOW() + INTERVAL '7 days'
    )
    ON CONFLICT (tenant_id) DO NOTHING;

    RETURN NEW;
END;
$$;

-- ─── get_invoice_list helper ─────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_tenant_invoices(p_tenant_id UUID, p_limit INT DEFAULT 20)
RETURNS TABLE (
    invoice_id          UUID,
    asaas_payment_id    TEXT,
    value               NUMERIC,
    status              invoice_status,
    billing_type        TEXT,
    due_date            DATE,
    paid_at             TIMESTAMPTZ,
    invoice_url         TEXT,
    description         TEXT
) LANGUAGE sql SECURITY DEFINER AS $$
    SELECT id, asaas_payment_id, value, status, billing_type,
           due_date, paid_at, invoice_url, description
    FROM billing_invoices
    WHERE tenant_id = p_tenant_id
    ORDER BY due_date DESC NULLS LAST
    LIMIT p_limit;
$$;
