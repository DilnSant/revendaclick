-- =============================================================================
-- RevendaClick — Complete Database Schema
-- Multi-tenant SaaS | Supabase PostgreSQL + RLS
-- =============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- ENUMS
-- =============================================================================

CREATE TYPE plan_type AS ENUM ('starter', 'pro', 'premium', 'enterprise');
CREATE TYPE subscription_status AS ENUM ('active', 'trialing', 'past_due', 'canceled', 'paused');
CREATE TYPE vehicle_status AS ENUM ('available', 'reserved', 'sold', 'inactive');
CREATE TYPE vehicle_condition AS ENUM ('new', 'used', 'certified');
CREATE TYPE fuel_type AS ENUM ('flex', 'gasoline', 'diesel', 'electric', 'hybrid', 'ethanol');
CREATE TYPE transmission_type AS ENUM ('manual', 'automatic', 'cvt', 'automated');
CREATE TYPE lead_status AS ENUM ('new', 'in_progress', 'proposal', 'closed_won', 'closed_lost');
CREATE TYPE lead_source AS ENUM ('marketplace', 'whatsapp', 'referral', 'direct', 'social', 'other');
CREATE TYPE user_role AS ENUM ('owner', 'admin', 'seller', 'viewer');

-- =============================================================================
-- PLANS (reference table, not tenant-scoped)
-- =============================================================================

CREATE TABLE plans (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            plan_type        NOT NULL UNIQUE,
    display_name    TEXT             NOT NULL,
    max_vehicles    INT              NOT NULL,  -- -1 = unlimited
    max_users       INT              NOT NULL,  -- -1 = unlimited
    max_leads       INT              NOT NULL,  -- -1 = unlimited
    price_monthly   NUMERIC(10, 2)   NOT NULL DEFAULT 0,
    price_yearly    NUMERIC(10, 2)   NOT NULL DEFAULT 0,
    features        JSONB            NOT NULL DEFAULT '[]',
    is_active       BOOLEAN          NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ      NOT NULL DEFAULT NOW()
);

INSERT INTO plans (name, display_name, max_vehicles, max_users, max_leads, price_monthly, price_yearly, features) VALUES
    ('starter',    'Starter',    30,  4,  200,  97.00,   970.00,  '["marketplace", "whatsapp_button", "lead_capture"]'),
    ('pro',        'Pro',        60,  8,  500,  197.00,  1970.00, '["marketplace", "whatsapp_button", "lead_capture", "crm", "kanban", "custom_domain"]'),
    ('premium',    'Premium',    120, 20, 2000, 397.00,  3970.00, '["marketplace", "whatsapp_button", "lead_capture", "crm", "kanban", "custom_domain", "analytics", "priority_support"]'),
    ('enterprise', 'Enterprise', -1,  -1, -1,   797.00,  7970.00, '["marketplace", "whatsapp_button", "lead_capture", "crm", "kanban", "custom_domain", "analytics", "priority_support", "api_access", "white_label"]');

-- =============================================================================
-- TENANTS
-- =============================================================================

CREATE TABLE tenants (
    id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug            TEXT        NOT NULL UNIQUE,
    name            TEXT        NOT NULL,
    email           TEXT        NOT NULL UNIQUE,
    phone_whatsapp  TEXT        NOT NULL,
    logo_url        TEXT,
    description     TEXT,
    address         JSONB,
    social_links    JSONB        DEFAULT '{}',
    custom_domain   TEXT        UNIQUE,
    seo_title       TEXT,
    seo_description TEXT,
    theme           JSONB        DEFAULT '{"primary_color": "#E53935", "font": "inter"}',
    is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT tenants_slug_format CHECK (slug ~ '^[a-z0-9][a-z0-9\-]{1,48}[a-z0-9]$')
);

-- =============================================================================
-- SUBSCRIPTIONS
-- =============================================================================

CREATE TABLE subscriptions (
    id                  UUID                PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id           UUID                NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    plan_id             UUID                NOT NULL REFERENCES plans(id),
    status              subscription_status NOT NULL DEFAULT 'trialing',
    billing_cycle       TEXT                NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),
    current_period_start TIMESTAMPTZ        NOT NULL DEFAULT NOW(),
    current_period_end   TIMESTAMPTZ        NOT NULL DEFAULT NOW() + INTERVAL '14 days',
    trial_ends_at        TIMESTAMPTZ,
    canceled_at          TIMESTAMPTZ,
    external_id          TEXT,               -- Stripe/Hotmart subscription ID
    metadata             JSONB              DEFAULT '{}',
    created_at           TIMESTAMPTZ        NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ        NOT NULL DEFAULT NOW(),

    CONSTRAINT subscriptions_one_active_per_tenant UNIQUE (tenant_id)
);

-- =============================================================================
-- USERS (linked to Supabase auth.users)
-- =============================================================================

CREATE TABLE users (
    id              UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    tenant_id       UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    role            user_role   NOT NULL DEFAULT 'seller',
    name            TEXT        NOT NULL,
    email           TEXT        NOT NULL,
    phone           TEXT,
    avatar_url      TEXT,
    is_active       BOOLEAN     NOT NULL DEFAULT TRUE,
    last_seen_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT users_unique_email_per_tenant UNIQUE (tenant_id, email)
);

-- =============================================================================
-- SELLERS (sales profile, extends users)
-- =============================================================================

CREATE TABLE sellers (
    id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id         UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    display_name    TEXT        NOT NULL,
    phone_whatsapp  TEXT        NOT NULL,
    bio             TEXT,
    photo_url       TEXT,
    is_active       BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT sellers_unique_user UNIQUE (tenant_id, user_id)
);

-- =============================================================================
-- VEHICLES
-- =============================================================================

CREATE TABLE vehicles (
    id              UUID                PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID                NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    seller_id       UUID                REFERENCES sellers(id) ON DELETE SET NULL,

    -- Basic info
    title           TEXT                NOT NULL,
    brand           TEXT                NOT NULL,
    model           TEXT                NOT NULL,
    version         TEXT,
    year_model      SMALLINT            NOT NULL,
    year_manufacture SMALLINT           NOT NULL,

    -- Specs
    color           TEXT,
    mileage         INT                 NOT NULL DEFAULT 0,
    fuel            fuel_type           NOT NULL DEFAULT 'flex',
    transmission    transmission_type   NOT NULL DEFAULT 'manual',
    doors           SMALLINT            CHECK (doors IN (2, 4)),
    engine          TEXT,
    horsepower      SMALLINT,
    features        TEXT[]              DEFAULT '{}',

    -- Pricing
    price           NUMERIC(12, 2)      NOT NULL,
    price_negotiable BOOLEAN            NOT NULL DEFAULT TRUE,
    fipe_price      NUMERIC(12, 2),

    -- Status
    status          vehicle_status      NOT NULL DEFAULT 'available',
    condition       vehicle_condition   NOT NULL DEFAULT 'used',
    is_featured     BOOLEAN             NOT NULL DEFAULT FALSE,

    -- Media
    images          TEXT[]              DEFAULT '{}',
    thumbnail_url   TEXT,
    video_url       TEXT,

    -- SEO / public
    slug            TEXT                NOT NULL,
    description     TEXT,
    plate_last_digits TEXT,

    -- Metadata
    views_count     INT                 NOT NULL DEFAULT 0,
    leads_count     INT                 NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ         NOT NULL DEFAULT NOW(),

    CONSTRAINT vehicles_unique_slug_per_tenant UNIQUE (tenant_id, slug),
    CONSTRAINT vehicles_year_range CHECK (year_model >= 1950 AND year_model <= EXTRACT(YEAR FROM NOW()) + 1),
    CONSTRAINT vehicles_price_positive CHECK (price > 0)
);

-- =============================================================================
-- LEADS
-- =============================================================================

CREATE TABLE leads (
    id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    vehicle_id      UUID        REFERENCES vehicles(id) ON DELETE SET NULL,
    seller_id       UUID        REFERENCES sellers(id) ON DELETE SET NULL,

    -- Contact info
    name            TEXT        NOT NULL,
    phone           TEXT        NOT NULL,
    email           TEXT,
    message         TEXT,

    -- CRM
    status          lead_status NOT NULL DEFAULT 'new',
    source          lead_source NOT NULL DEFAULT 'marketplace',
    notes           TEXT,

    -- Tracking
    utm_source      TEXT,
    utm_medium      TEXT,
    utm_campaign    TEXT,
    ip_address      INET,
    user_agent      TEXT,

    -- Kanban position
    kanban_position INT         NOT NULL DEFAULT 0,

    -- Timestamps
    contacted_at    TIMESTAMPTZ,
    closed_at       TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- LEAD ACTIVITIES (audit trail)
-- =============================================================================

CREATE TABLE lead_activities (
    id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    lead_id         UUID        NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    user_id         UUID        REFERENCES users(id) ON DELETE SET NULL,
    type            TEXT        NOT NULL, -- 'status_change', 'note', 'call', 'whatsapp', 'email'
    description     TEXT        NOT NULL,
    metadata        JSONB       DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- ONBOARDING CHECKLISTS
-- =============================================================================

CREATE TABLE onboarding_checklists (
    id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE UNIQUE,
    added_vehicle   BOOLEAN     NOT NULL DEFAULT FALSE,
    configured_whatsapp BOOLEAN NOT NULL DEFAULT FALSE,
    published_store BOOLEAN     NOT NULL DEFAULT FALSE,
    added_seller    BOOLEAN     NOT NULL DEFAULT FALSE,
    completed_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- USAGE SNAPSHOTS (for billing / alerting)
-- =============================================================================

CREATE TABLE usage_snapshots (
    id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    vehicles_count  INT         NOT NULL DEFAULT 0,
    users_count     INT         NOT NULL DEFAULT 0,
    leads_count     INT         NOT NULL DEFAULT 0,
    snapped_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- INDEXES
-- =============================================================================

-- tenants
CREATE INDEX idx_tenants_slug        ON tenants(slug);
CREATE INDEX idx_tenants_custom_domain ON tenants(custom_domain) WHERE custom_domain IS NOT NULL;

-- subscriptions
CREATE INDEX idx_subscriptions_tenant ON subscriptions(tenant_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);

-- users
CREATE INDEX idx_users_tenant        ON users(tenant_id);
CREATE INDEX idx_users_email         ON users(email);

-- sellers
CREATE INDEX idx_sellers_tenant      ON sellers(tenant_id);
CREATE INDEX idx_sellers_user        ON sellers(user_id);

-- vehicles
CREATE INDEX idx_vehicles_tenant         ON vehicles(tenant_id);
CREATE INDEX idx_vehicles_tenant_status  ON vehicles(tenant_id, status);
CREATE INDEX idx_vehicles_tenant_featured ON vehicles(tenant_id, is_featured) WHERE is_featured = TRUE;
CREATE INDEX idx_vehicles_slug           ON vehicles(tenant_id, slug);
CREATE INDEX idx_vehicles_brand_model    ON vehicles(tenant_id, brand, model);
CREATE INDEX idx_vehicles_price          ON vehicles(tenant_id, price);
CREATE INDEX idx_vehicles_created        ON vehicles(tenant_id, created_at DESC);

-- leads
CREATE INDEX idx_leads_tenant            ON leads(tenant_id);
CREATE INDEX idx_leads_tenant_status     ON leads(tenant_id, status);
CREATE INDEX idx_leads_vehicle           ON leads(vehicle_id);
CREATE INDEX idx_leads_seller            ON leads(seller_id);
CREATE INDEX idx_leads_created           ON leads(tenant_id, created_at DESC);

-- lead activities
CREATE INDEX idx_lead_activities_lead    ON lead_activities(lead_id);
CREATE INDEX idx_lead_activities_tenant  ON lead_activities(tenant_id);

-- usage snapshots
CREATE INDEX idx_usage_snapshots_tenant  ON usage_snapshots(tenant_id, snapped_at DESC);

-- =============================================================================
-- UPDATED_AT TRIGGER
-- =============================================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_tenants_updated_at          BEFORE UPDATE ON tenants           FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_subscriptions_updated_at    BEFORE UPDATE ON subscriptions     FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_users_updated_at            BEFORE UPDATE ON users             FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_sellers_updated_at          BEFORE UPDATE ON sellers           FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_vehicles_updated_at         BEFORE UPDATE ON vehicles          FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_leads_updated_at            BEFORE UPDATE ON leads             FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_onboarding_updated_at       BEFORE UPDATE ON onboarding_checklists FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =============================================================================
-- PLAN LIMITS ENFORCEMENT (DB-level guard)
-- =============================================================================

CREATE OR REPLACE FUNCTION check_vehicle_limit()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
    v_max_vehicles  INT;
    v_current_count INT;
BEGIN
    SELECT p.max_vehicles INTO v_max_vehicles
    FROM subscriptions s
    JOIN plans p ON p.id = s.plan_id
    WHERE s.tenant_id = NEW.tenant_id
      AND s.status IN ('active', 'trialing');

    IF v_max_vehicles IS NULL OR v_max_vehicles = -1 THEN
        RETURN NEW;
    END IF;

    SELECT COUNT(*) INTO v_current_count
    FROM vehicles
    WHERE tenant_id = NEW.tenant_id
      AND status != 'inactive';

    IF v_current_count >= v_max_vehicles THEN
        RAISE EXCEPTION 'vehicle_limit_reached: tenant has reached the maximum of % vehicles for their plan', v_max_vehicles
            USING ERRCODE = 'P0001';
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_check_vehicle_limit
    BEFORE INSERT ON vehicles
    FOR EACH ROW EXECUTE FUNCTION check_vehicle_limit();

-- --------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION check_user_limit()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
    v_max_users     INT;
    v_current_count INT;
BEGIN
    SELECT p.max_users INTO v_max_users
    FROM subscriptions s
    JOIN plans p ON p.id = s.plan_id
    WHERE s.tenant_id = NEW.tenant_id
      AND s.status IN ('active', 'trialing');

    IF v_max_users IS NULL OR v_max_users = -1 THEN
        RETURN NEW;
    END IF;

    SELECT COUNT(*) INTO v_current_count
    FROM users
    WHERE tenant_id = NEW.tenant_id
      AND is_active = TRUE;

    IF v_current_count >= v_max_users THEN
        RAISE EXCEPTION 'user_limit_reached: tenant has reached the maximum of % users for their plan', v_max_users
            USING ERRCODE = 'P0001';
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_check_user_limit
    BEFORE INSERT ON users
    FOR EACH ROW EXECUTE FUNCTION check_user_limit();

-- =============================================================================
-- VEHICLE LEAD COUNTER TRIGGER
-- =============================================================================

CREATE OR REPLACE FUNCTION increment_vehicle_leads_count()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF NEW.vehicle_id IS NOT NULL THEN
        UPDATE vehicles
        SET leads_count = leads_count + 1
        WHERE id = NEW.vehicle_id;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_increment_leads_count
    AFTER INSERT ON leads
    FOR EACH ROW EXECUTE FUNCTION increment_vehicle_leads_count();

-- =============================================================================
-- ONBOARDING AUTO-CREATE TRIGGER
-- =============================================================================

CREATE OR REPLACE FUNCTION create_onboarding_checklist()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    INSERT INTO onboarding_checklists (tenant_id)
    VALUES (NEW.id)
    ON CONFLICT (tenant_id) DO NOTHING;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_create_onboarding
    AFTER INSERT ON tenants
    FOR EACH ROW EXECUTE FUNCTION create_onboarding_checklist();

-- =============================================================================
-- USAGE HELPER FUNCTION (used by frontend for plan alerts)
-- =============================================================================

CREATE OR REPLACE FUNCTION get_tenant_usage(p_tenant_id UUID)
RETURNS TABLE (
    vehicles_count  BIGINT,
    users_count     BIGINT,
    leads_count     BIGINT,
    max_vehicles    INT,
    max_users       INT,
    max_leads       INT,
    vehicles_pct    NUMERIC,
    users_pct       NUMERIC,
    plan_name       plan_type,
    plan_display    TEXT,
    sub_status      subscription_status
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    SELECT
        (SELECT COUNT(*) FROM vehicles  v WHERE v.tenant_id = p_tenant_id AND v.status != 'inactive'),
        (SELECT COUNT(*) FROM users     u WHERE u.tenant_id = p_tenant_id AND u.is_active = TRUE),
        (SELECT COUNT(*) FROM leads     l WHERE l.tenant_id = p_tenant_id),
        pl.max_vehicles,
        pl.max_users,
        pl.max_leads,
        CASE
            WHEN pl.max_vehicles = -1 THEN 0
            ELSE ROUND(
                (SELECT COUNT(*) FROM vehicles v WHERE v.tenant_id = p_tenant_id AND v.status != 'inactive')::NUMERIC
                / NULLIF(pl.max_vehicles, 0) * 100, 1)
        END,
        CASE
            WHEN pl.max_users = -1 THEN 0
            ELSE ROUND(
                (SELECT COUNT(*) FROM users u WHERE u.tenant_id = p_tenant_id AND u.is_active = TRUE)::NUMERIC
                / NULLIF(pl.max_users, 0) * 100, 1)
        END,
        pl.name,
        pl.display_name,
        s.status
    FROM subscriptions s
    JOIN plans pl ON pl.id = s.plan_id
    WHERE s.tenant_id = p_tenant_id;
END;
$$;

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================

-- Enable RLS on all tenant-scoped tables
ALTER TABLE tenants              ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE users                ENABLE ROW LEVEL SECURITY;
ALTER TABLE sellers              ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles             ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads                ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_activities      ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_snapshots      ENABLE ROW LEVEL SECURITY;

-- plans table: public read, no writes from app
ALTER TABLE plans                ENABLE ROW LEVEL SECURITY;
CREATE POLICY "plans_public_read" ON plans FOR SELECT USING (TRUE);

-- =============================================================================
-- HELPER: extract tenant_id from JWT claims
-- =============================================================================

CREATE OR REPLACE FUNCTION auth_tenant_id() RETURNS UUID LANGUAGE sql STABLE AS $$
    SELECT NULLIF((auth.jwt() ->> 'tenant_id'), '')::UUID;
$$;

CREATE OR REPLACE FUNCTION auth_user_role() RETURNS user_role LANGUAGE sql STABLE AS $$
    SELECT NULLIF((auth.jwt() ->> 'user_role'), '')::user_role;
$$;

-- =============================================================================
-- TENANTS POLICIES
-- =============================================================================

-- Users can read their own tenant
CREATE POLICY "tenants_select_own"
    ON tenants FOR SELECT
    USING (id = auth_tenant_id());

-- Owners/admins can update their tenant
CREATE POLICY "tenants_update_own"
    ON tenants FOR UPDATE
    USING (id = auth_tenant_id() AND auth_user_role() IN ('owner', 'admin'))
    WITH CHECK (id = auth_tenant_id());

-- Public: slug lookup for middleware (service role bypasses RLS)
-- Handled via service_role key in middleware — no additional policy needed

-- =============================================================================
-- SUBSCRIPTIONS POLICIES
-- =============================================================================

CREATE POLICY "subscriptions_select_own"
    ON subscriptions FOR SELECT
    USING (tenant_id = auth_tenant_id());

CREATE POLICY "subscriptions_update_own"
    ON subscriptions FOR UPDATE
    USING (tenant_id = auth_tenant_id() AND auth_user_role() = 'owner')
    WITH CHECK (tenant_id = auth_tenant_id());

-- =============================================================================
-- USERS POLICIES
-- =============================================================================

CREATE POLICY "users_select_own_tenant"
    ON users FOR SELECT
    USING (tenant_id = auth_tenant_id());

CREATE POLICY "users_insert_admin"
    ON users FOR INSERT
    WITH CHECK (tenant_id = auth_tenant_id() AND auth_user_role() IN ('owner', 'admin'));

CREATE POLICY "users_update_admin"
    ON users FOR UPDATE
    USING (tenant_id = auth_tenant_id() AND (auth_user_role() IN ('owner', 'admin') OR id = auth.uid()))
    WITH CHECK (tenant_id = auth_tenant_id());

CREATE POLICY "users_delete_admin"
    ON users FOR DELETE
    USING (tenant_id = auth_tenant_id() AND auth_user_role() IN ('owner', 'admin') AND id != auth.uid());

-- =============================================================================
-- SELLERS POLICIES
-- =============================================================================

CREATE POLICY "sellers_select_own_tenant"
    ON sellers FOR SELECT
    USING (tenant_id = auth_tenant_id());

CREATE POLICY "sellers_insert_admin"
    ON sellers FOR INSERT
    WITH CHECK (tenant_id = auth_tenant_id() AND auth_user_role() IN ('owner', 'admin'));

CREATE POLICY "sellers_update_admin"
    ON sellers FOR UPDATE
    USING (tenant_id = auth_tenant_id() AND (auth_user_role() IN ('owner', 'admin') OR user_id = auth.uid()))
    WITH CHECK (tenant_id = auth_tenant_id());

CREATE POLICY "sellers_delete_admin"
    ON sellers FOR DELETE
    USING (tenant_id = auth_tenant_id() AND auth_user_role() IN ('owner', 'admin'));

-- Public: anyone can read sellers for marketplace pages
CREATE POLICY "sellers_public_read"
    ON sellers FOR SELECT
    USING (is_active = TRUE);

-- =============================================================================
-- VEHICLES POLICIES
-- =============================================================================

-- Public read: available vehicles visible to everyone (marketplace)
CREATE POLICY "vehicles_public_read"
    ON vehicles FOR SELECT
    USING (status = 'available');

-- Authenticated: full tenant scope
CREATE POLICY "vehicles_tenant_read"
    ON vehicles FOR SELECT
    USING (tenant_id = auth_tenant_id());

CREATE POLICY "vehicles_insert"
    ON vehicles FOR INSERT
    WITH CHECK (tenant_id = auth_tenant_id() AND auth_user_role() IN ('owner', 'admin', 'seller'));

CREATE POLICY "vehicles_update"
    ON vehicles FOR UPDATE
    USING (
        tenant_id = auth_tenant_id()
        AND (
            auth_user_role() IN ('owner', 'admin')
            OR (auth_user_role() = 'seller' AND seller_id IN (
                SELECT id FROM sellers WHERE user_id = auth.uid()
            ))
        )
    )
    WITH CHECK (tenant_id = auth_tenant_id());

CREATE POLICY "vehicles_delete"
    ON vehicles FOR DELETE
    USING (tenant_id = auth_tenant_id() AND auth_user_role() IN ('owner', 'admin'));

-- =============================================================================
-- LEADS POLICIES
-- =============================================================================

-- Anyone can insert a lead (public form)
CREATE POLICY "leads_public_insert"
    ON leads FOR INSERT
    WITH CHECK (TRUE);

-- Authenticated: read own tenant leads
CREATE POLICY "leads_tenant_read"
    ON leads FOR SELECT
    USING (tenant_id = auth_tenant_id());

-- Sellers can only see leads assigned to them
CREATE POLICY "leads_seller_read"
    ON leads FOR SELECT
    USING (
        tenant_id = auth_tenant_id()
        AND (
            auth_user_role() IN ('owner', 'admin')
            OR seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid())
        )
    );

CREATE POLICY "leads_update"
    ON leads FOR UPDATE
    USING (
        tenant_id = auth_tenant_id()
        AND (
            auth_user_role() IN ('owner', 'admin')
            OR seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid())
        )
    )
    WITH CHECK (tenant_id = auth_tenant_id());

CREATE POLICY "leads_delete"
    ON leads FOR DELETE
    USING (tenant_id = auth_tenant_id() AND auth_user_role() IN ('owner', 'admin'));

-- =============================================================================
-- LEAD ACTIVITIES POLICIES
-- =============================================================================

CREATE POLICY "lead_activities_tenant_read"
    ON lead_activities FOR SELECT
    USING (tenant_id = auth_tenant_id());

CREATE POLICY "lead_activities_insert"
    ON lead_activities FOR INSERT
    WITH CHECK (tenant_id = auth_tenant_id());

CREATE POLICY "lead_activities_delete_admin"
    ON lead_activities FOR DELETE
    USING (tenant_id = auth_tenant_id() AND auth_user_role() IN ('owner', 'admin'));

-- =============================================================================
-- ONBOARDING POLICIES
-- =============================================================================

CREATE POLICY "onboarding_tenant_select"
    ON onboarding_checklists FOR SELECT
    USING (tenant_id = auth_tenant_id());

CREATE POLICY "onboarding_tenant_update"
    ON onboarding_checklists FOR UPDATE
    USING (tenant_id = auth_tenant_id())
    WITH CHECK (tenant_id = auth_tenant_id());

-- =============================================================================
-- USAGE SNAPSHOTS POLICIES
-- =============================================================================

CREATE POLICY "usage_snapshots_tenant_read"
    ON usage_snapshots FOR SELECT
    USING (tenant_id = auth_tenant_id());

-- =============================================================================
-- SERVICE ROLE BYPASS (for backend Go API and middleware)
-- All service_role operations bypass RLS automatically in Supabase
-- No extra policy needed — just use the service_role key server-side
-- =============================================================================

-- =============================================================================
-- VIEWS (convenience, RLS still applies)
-- =============================================================================

CREATE OR REPLACE VIEW public_vehicle_listings AS
SELECT
    v.id,
    v.tenant_id,
    v.slug,
    v.title,
    v.brand,
    v.model,
    v.version,
    v.year_model,
    v.year_manufacture,
    v.color,
    v.mileage,
    v.fuel,
    v.transmission,
    v.doors,
    v.engine,
    v.horsepower,
    v.features,
    v.price,
    v.price_negotiable,
    v.fipe_price,
    v.condition,
    v.images,
    v.thumbnail_url,
    v.video_url,
    v.description,
    v.views_count,
    v.leads_count,
    v.created_at,
    t.name    AS store_name,
    t.slug    AS store_slug,
    t.phone_whatsapp AS store_whatsapp,
    t.logo_url AS store_logo
FROM vehicles v
JOIN tenants t ON t.id = v.tenant_id
WHERE v.status = 'available'
  AND t.is_active = TRUE;

-- =============================================================================
-- SEED: Trial subscription auto-assign on tenant creation
-- =============================================================================

CREATE OR REPLACE FUNCTION auto_assign_trial_subscription()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
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
        NOW() + INTERVAL '14 days',
        NOW() + INTERVAL '14 days'
    );

    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auto_trial_subscription
    AFTER INSERT ON tenants
    FOR EACH ROW EXECUTE FUNCTION auto_assign_trial_subscription();
