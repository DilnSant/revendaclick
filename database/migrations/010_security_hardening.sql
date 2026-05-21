-- =============================================================================
-- Migration 010 — Security Hardening
-- Applied: 2026-05-20
-- =============================================================================

-- ── 1. Enable RLS on all Evolution API tables ─────────────────────────────────
-- PrismaORM tables created by Evolution API. They should only be accessible via
-- the backend's direct DB connection (bypasses RLS), never via PostgREST.
ALTER TABLE IF EXISTS public."_prisma_migrations"      ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."Instance"                ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."Session"                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."Contact"                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."Message"                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."MessageUpdate"           ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."Chat"                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."Label"                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."Webhook"                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."Proxy"                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."Setting"                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."Rabbitmq"                ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."Sqs"                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."Websocket"               ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."Pusher"                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."Media"                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."Typebot"                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."TypebotSetting"          ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."Chatwoot"                ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."IntegrationSession"      ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."IsOnWhatsapp"            ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."OpenaiSetting"           ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."OpenaiCreds"             ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."OpenaiBot"               ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."Dify"                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."DifySetting"             ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."EvolutionBot"            ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."EvolutionBotSetting"     ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."Flowise"                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."FlowiseSetting"          ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."Template"                ENABLE ROW LEVEL SECURITY;

-- ── 2. Revoke EXECUTE on internal-only SECURITY DEFINER functions ─────────────
-- These are called only by the Go backend service role, not via PostgREST.
REVOKE EXECUTE ON FUNCTION public.complete_sale()                     FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_tenant_invoices(uuid, integer)  FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_tenant_usage(uuid)              FROM anon, authenticated;

-- ── 3. Fix mutable search_path on all public functions ────────────────────────
-- Prevents search_path injection attacks (PostgreSQL security best practice).
ALTER FUNCTION public.auth_user_role()                        SET search_path = public, pg_catalog;
ALTER FUNCTION public.auto_assign_trial_subscription()        SET search_path = public, pg_catalog;
ALTER FUNCTION public.set_updated_at()                        SET search_path = public, pg_catalog;
ALTER FUNCTION public.check_vehicle_limit()                   SET search_path = public, pg_catalog;
ALTER FUNCTION public.check_user_limit()                      SET search_path = public, pg_catalog;
ALTER FUNCTION public.increment_vehicle_leads_count()         SET search_path = public, pg_catalog;
ALTER FUNCTION public.create_onboarding_checklist()           SET search_path = public, pg_catalog;
ALTER FUNCTION public.get_tenant_usage(uuid)                  SET search_path = public, pg_catalog;
ALTER FUNCTION public.auth_tenant_id()                        SET search_path = public, pg_catalog;
ALTER FUNCTION public.complete_sale()                          SET search_path = public, pg_catalog;
ALTER FUNCTION public.set_subscription_grace()                SET search_path = public, pg_catalog;
ALTER FUNCTION public.get_tenant_invoices(uuid, integer)      SET search_path = public, pg_catalog;

-- ── 4. Fix SECURITY DEFINER views to SECURITY INVOKER ────────────────────────
-- plan_usage: accessed by service role → RLS scopes correctly per tenant
-- v_cash_flow_monthly: financial_entries_tenant_isolation RLS applies
-- public_vehicle_listings: INTENTIONALLY kept as SECURITY DEFINER for
--   cross-tenant public marketplace (vehicles.vehicles_public_read allows anon)

CREATE OR REPLACE VIEW public.v_cash_flow_monthly
  WITH (security_invoker = true)
AS
SELECT tenant_id,
    date_trunc('month'::text, COALESCE(paid_at, due_date::timestamp with time zone, created_at))::date AS month,
    sum(CASE WHEN type = 'income'::financial_entry_type AND status = 'paid'::payment_status THEN amount ELSE 0::numeric END) AS total_income,
    sum(CASE WHEN type = 'expense'::financial_entry_type AND status = 'paid'::payment_status THEN amount ELSE 0::numeric END) AS total_expense,
    sum(CASE WHEN type = 'income'::financial_entry_type AND status = 'paid'::payment_status THEN amount
             WHEN type = 'expense'::financial_entry_type AND status = 'paid'::payment_status THEN - amount
             ELSE 0::numeric END) AS net_balance
FROM financial_entries
GROUP BY tenant_id, (date_trunc('month'::text, COALESCE(paid_at, due_date::timestamp with time zone, created_at))::date);

CREATE OR REPLACE VIEW public.plan_usage
  WITH (security_invoker = true)
AS
SELECT t.id AS tenant_id,
    p.name::text AS plan_name,
    p.display_name AS plan_display,
    s.status::text AS subscription_status,
    count(DISTINCT v.id) FILTER (WHERE v.status <> 'inactive'::vehicle_status) AS vehicles_count,
    count(DISTINCT u.id) FILTER (WHERE u.is_active) AS users_count,
    count(DISTINCT l.id) AS leads_count,
    p.max_vehicles, p.max_users, p.max_leads, p.features
FROM tenants t
    JOIN subscriptions s ON s.tenant_id = t.id
    JOIN plans p ON p.id = s.plan_id
    LEFT JOIN vehicles v ON v.tenant_id = t.id
    LEFT JOIN users u ON u.tenant_id = t.id
    LEFT JOIN leads l ON l.tenant_id = t.id AND l.created_at >= date_trunc('month'::text, now())
GROUP BY t.id, p.name, p.display_name, s.status, p.max_vehicles, p.max_users, p.max_leads, p.features;
