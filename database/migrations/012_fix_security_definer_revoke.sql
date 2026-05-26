-- =============================================================================
-- Migration 012 — Fix SECURITY DEFINER function access (2026-05-26)
-- Supabase advisor confirmed anon + authenticated can still call these via /rest/v1/rpc/
-- Root cause: REVOKE from specific roles doesn't remove PUBLIC grant.
-- Fix: REVOKE from PUBLIC (supersedes per-role grants), then re-grant only to service_role.
-- =============================================================================

REVOKE EXECUTE ON FUNCTION public.complete_sale()                    FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_tenant_invoices(uuid, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_tenant_usage(uuid)             FROM PUBLIC, anon, authenticated;

-- Re-grant only to service_role (used by the Go backend via SUPABASE_SERVICE_ROLE_KEY)
GRANT EXECUTE ON FUNCTION public.complete_sale()                    TO service_role;
GRANT EXECUTE ON FUNCTION public.get_tenant_invoices(uuid, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_tenant_usage(uuid)             TO service_role;
