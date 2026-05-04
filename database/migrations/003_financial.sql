-- =============================================================================
-- Migration 003: Financial Module
-- Multi-tenant | RLS enabled | All tables tenant-scoped
--
-- IDEMPOTENT — safe to re-apply on any environment.
-- Apply: psql $DATABASE_URL -f database/migrations/003_financial.sql
--        or paste in Supabase Dashboard → SQL Editor
--
-- Requires: 001_initial_schema.sql + 002_customers.sql already applied.
-- =============================================================================

-- ─── Enums ────────────────────────────────────────────────────────────────────
-- PostgreSQL has no CREATE TYPE IF NOT EXISTS, so we use a DO block that
-- catches the duplicate_object exception and continues silently.

DO $$ BEGIN
  CREATE TYPE financial_entry_type AS ENUM ('income', 'expense');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE financial_category AS ENUM (
    'vehicle_sale', 'commission', 'service', 'financing',
    'operational', 'marketing', 'salary', 'rent', 'tax', 'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_method AS ENUM (
    'cash', 'pix', 'bank_transfer', 'credit_card', 'debit_card',
    'financing', 'check', 'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'overdue', 'canceled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE sale_status AS ENUM ('pending', 'completed', 'canceled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE financing_type AS ENUM ('none', 'own', 'bank', 'consortium');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE commission_type AS ENUM ('percentage', 'fixed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE commission_status AS ENUM ('pending', 'approved', 'paid', 'canceled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─── financial_entries ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS financial_entries (
  id              UUID                  PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID                  NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  type            financial_entry_type  NOT NULL,
  category        financial_category    NOT NULL,
  description     TEXT                  NOT NULL,
  amount          NUMERIC(12, 2)        NOT NULL CHECK (amount > 0),
  payment_method  payment_method        NOT NULL DEFAULT 'other',
  status          payment_status        NOT NULL DEFAULT 'paid',
  due_date        DATE,
  paid_at         TIMESTAMPTZ,
  reference_id    UUID,
  reference_type  TEXT,
  notes           TEXT,
  created_by      UUID                  REFERENCES users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ           NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ           NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_financial_entries_tenant
  ON financial_entries(tenant_id);

CREATE INDEX IF NOT EXISTS idx_financial_entries_type
  ON financial_entries(tenant_id, type);

CREATE INDEX IF NOT EXISTS idx_financial_entries_status
  ON financial_entries(tenant_id, status);

CREATE INDEX IF NOT EXISTS idx_financial_entries_due_date
  ON financial_entries(tenant_id, due_date);

CREATE INDEX IF NOT EXISTS idx_financial_entries_reference
  ON financial_entries(reference_id)
  WHERE reference_id IS NOT NULL;

-- ─── sales ────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS sales (
  id                UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id         UUID            NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  vehicle_id        UUID            NOT NULL REFERENCES vehicles(id),
  lead_id           UUID            REFERENCES leads(id) ON DELETE SET NULL,
  seller_id         UUID            REFERENCES users(id) ON DELETE SET NULL,
  customer_id       UUID            REFERENCES customers(id) ON DELETE SET NULL,
  sale_price        NUMERIC(12, 2)  NOT NULL CHECK (sale_price > 0),
  list_price        NUMERIC(12, 2)  NOT NULL,
  discount          NUMERIC(12, 2)  NOT NULL DEFAULT 0,
  financing_type    financing_type  NOT NULL DEFAULT 'none',
  financing_amount  NUMERIC(12, 2),
  payment_method    payment_method  NOT NULL DEFAULT 'other',
  status            sale_status     NOT NULL DEFAULT 'pending',
  sold_at           TIMESTAMPTZ,
  notes             TEXT,
  created_at        TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sales_tenant
  ON sales(tenant_id);

CREATE INDEX IF NOT EXISTS idx_sales_vehicle
  ON sales(vehicle_id);

CREATE INDEX IF NOT EXISTS idx_sales_seller
  ON sales(tenant_id, seller_id);

CREATE INDEX IF NOT EXISTS idx_sales_status
  ON sales(tenant_id, status);

CREATE INDEX IF NOT EXISTS idx_sales_sold_at
  ON sales(tenant_id, sold_at);

-- ─── commissions ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS commissions (
  id          UUID               PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id   UUID               NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  sale_id     UUID               NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  seller_id   UUID               NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type        commission_type    NOT NULL DEFAULT 'percentage',
  rate        NUMERIC(5, 2),
  amount      NUMERIC(12, 2)     NOT NULL CHECK (amount >= 0),
  status      commission_status  NOT NULL DEFAULT 'pending',
  paid_at     TIMESTAMPTZ,
  notes       TEXT,
  created_at  TIMESTAMPTZ        NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ        NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_commissions_tenant
  ON commissions(tenant_id);

CREATE INDEX IF NOT EXISTS idx_commissions_seller
  ON commissions(tenant_id, seller_id);

CREATE INDEX IF NOT EXISTS idx_commissions_status
  ON commissions(tenant_id, status);

CREATE INDEX IF NOT EXISTS idx_commissions_sale
  ON commissions(sale_id);

-- ─── seller_commission_rules ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS seller_commission_rules (
  id            UUID             PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id     UUID             NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  seller_id     UUID             NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type          commission_type  NOT NULL DEFAULT 'percentage',
  rate          NUMERIC(5, 2),
  fixed_amount  NUMERIC(12, 2),
  is_active     BOOLEAN          NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, seller_id)
);

CREATE INDEX IF NOT EXISTS idx_commission_rules_tenant
  ON seller_commission_rules(tenant_id);

-- ─── updated_at trigger function ─────────────────────────────────────────────
-- CREATE OR REPLACE is always idempotent for functions.

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Triggers: DROP IF EXISTS + CREATE is the safest pattern across all PG versions.
-- CREATE OR REPLACE TRIGGER is available in PostgreSQL 14+ (Supabase uses PG 15).

CREATE OR REPLACE TRIGGER trg_financial_entries_updated_at
  BEFORE UPDATE ON financial_entries
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE OR REPLACE TRIGGER trg_sales_updated_at
  BEFORE UPDATE ON sales
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE OR REPLACE TRIGGER trg_commissions_updated_at
  BEFORE UPDATE ON commissions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE OR REPLACE TRIGGER trg_commission_rules_updated_at
  BEFORE UPDATE ON seller_commission_rules
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── RLS ─────────────────────────────────────────────────────────────────────
-- ALTER TABLE ... ENABLE ROW LEVEL SECURITY is a no-op if already enabled.

ALTER TABLE financial_entries       ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE commissions             ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_commission_rules ENABLE ROW LEVEL SECURITY;

-- Policies: DROP IF EXISTS before CREATE avoids duplicate_object errors.

DROP POLICY IF EXISTS "financial_entries_tenant_isolation" ON financial_entries;
CREATE POLICY "financial_entries_tenant_isolation"
  ON financial_entries FOR ALL
  USING       (tenant_id::text = (auth.jwt() ->> 'tenant_id'))
  WITH CHECK  (tenant_id::text = (auth.jwt() ->> 'tenant_id'));

DROP POLICY IF EXISTS "sales_tenant_isolation" ON sales;
CREATE POLICY "sales_tenant_isolation"
  ON sales FOR ALL
  USING       (tenant_id::text = (auth.jwt() ->> 'tenant_id'))
  WITH CHECK  (tenant_id::text = (auth.jwt() ->> 'tenant_id'));

DROP POLICY IF EXISTS "commissions_tenant_isolation" ON commissions;
CREATE POLICY "commissions_tenant_isolation"
  ON commissions FOR ALL
  USING       (tenant_id::text = (auth.jwt() ->> 'tenant_id'))
  WITH CHECK  (tenant_id::text = (auth.jwt() ->> 'tenant_id'));

DROP POLICY IF EXISTS "commission_rules_tenant_isolation" ON seller_commission_rules;
CREATE POLICY "commission_rules_tenant_isolation"
  ON seller_commission_rules FOR ALL
  USING       (tenant_id::text = (auth.jwt() ->> 'tenant_id'))
  WITH CHECK  (tenant_id::text = (auth.jwt() ->> 'tenant_id'));

-- ─── View: cash flow monthly summary ─────────────────────────────────────────
-- CREATE OR REPLACE VIEW is always idempotent.

CREATE OR REPLACE VIEW v_cash_flow_monthly AS
SELECT
  tenant_id,
  DATE_TRUNC('month', COALESCE(paid_at, due_date, created_at))::DATE AS month,
  SUM(CASE WHEN type = 'income'  AND status = 'paid' THEN amount ELSE 0 END) AS total_income,
  SUM(CASE WHEN type = 'expense' AND status = 'paid' THEN amount ELSE 0 END) AS total_expense,
  SUM(
    CASE
      WHEN type = 'income'  AND status = 'paid' THEN  amount
      WHEN type = 'expense' AND status = 'paid' THEN -amount
      ELSE 0
    END
  ) AS net_balance
FROM financial_entries
GROUP BY
  tenant_id,
  DATE_TRUNC('month', COALESCE(paid_at, due_date, created_at))::DATE;

-- ─── Trigger: auto-complete sale workflow ─────────────────────────────────────
-- When a sale transitions to 'completed':
--   1. Mark the vehicle as 'sold'
--   2. Create a financial_entry income record
--   3. Create a commission record if a rule exists for the seller

CREATE OR REPLACE FUNCTION complete_sale()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_rule       seller_commission_rules%ROWTYPE;
  v_commission NUMERIC(12, 2) := 0;
BEGIN
  IF NEW.status = 'completed' AND OLD.status <> 'completed' THEN

    -- 1. Mark vehicle as sold
    UPDATE vehicles
    SET status = 'sold', updated_at = NOW()
    WHERE id = NEW.vehicle_id AND tenant_id = NEW.tenant_id;

    -- 2. Income entry
    INSERT INTO financial_entries (
      tenant_id, type, category, description,
      amount, payment_method, status, paid_at,
      reference_id, reference_type, created_by
    ) VALUES (
      NEW.tenant_id,
      'income',
      'vehicle_sale',
      'Venda de veículo #' || NEW.id::text,
      NEW.sale_price,
      NEW.payment_method,
      'paid',
      NOW(),
      NEW.id,
      'sale',
      NEW.seller_id
    );

    -- 3. Commission (only if a rule exists for this seller)
    IF NEW.seller_id IS NOT NULL THEN
      SELECT * INTO v_rule
      FROM seller_commission_rules
      WHERE tenant_id = NEW.tenant_id
        AND seller_id = NEW.seller_id
        AND is_active = TRUE
      LIMIT 1;

      IF FOUND THEN
        IF v_rule.type = 'percentage' THEN
          v_commission := ROUND(NEW.sale_price * v_rule.rate / 100, 2);
        ELSE
          v_commission := COALESCE(v_rule.fixed_amount, 0);
        END IF;

        INSERT INTO commissions (
          tenant_id, sale_id, seller_id,
          type, rate, amount, status
        ) VALUES (
          NEW.tenant_id, NEW.id, NEW.seller_id,
          v_rule.type, v_rule.rate, v_commission, 'pending'
        );
      END IF;
    END IF;

    NEW.sold_at := COALESCE(NEW.sold_at, NOW());
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_complete_sale
  BEFORE UPDATE ON sales
  FOR EACH ROW EXECUTE FUNCTION complete_sale();
