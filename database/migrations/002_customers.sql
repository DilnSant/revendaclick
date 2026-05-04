-- Migration 002: Customers table
-- Apply: psql $DATABASE_URL -f database/migrations/002_customers.sql

CREATE TABLE customers (
  id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id    UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name         TEXT        NOT NULL,
  email        TEXT,
  phone        TEXT,
  cpf_cnpj     TEXT,
  address_city TEXT,
  address_state CHAR(2),
  notes        TEXT,
  is_active    BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_customers_tenant    ON customers(tenant_id);
CREATE INDEX idx_customers_search    ON customers USING gin(
  to_tsvector('portuguese', coalesce(name,'') || ' ' || coalesce(email,'') || ' ' || coalesce(phone,'') || ' ' || coalesce(cpf_cnpj,''))
);
CREATE INDEX idx_customers_active    ON customers(tenant_id, is_active);
CREATE INDEX idx_customers_state     ON customers(tenant_id, address_state);

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY customers_select ON customers FOR SELECT
  USING (tenant_id = auth_tenant_id());
CREATE POLICY customers_insert ON customers FOR INSERT
  WITH CHECK (tenant_id = auth_tenant_id() AND auth_user_role() IN ('owner', 'admin', 'seller'));
CREATE POLICY customers_update ON customers FOR UPDATE
  USING (tenant_id = auth_tenant_id() AND auth_user_role() IN ('owner', 'admin', 'seller'))
  WITH CHECK (tenant_id = auth_tenant_id());
CREATE POLICY customers_delete ON customers FOR DELETE
  USING (tenant_id = auth_tenant_id() AND auth_user_role() IN ('owner', 'admin'));

CREATE TRIGGER set_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
