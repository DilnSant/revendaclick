-- =============================================================================
-- Migration 013 — Security: leads_public_insert + storage listing (2026-05-26)
--
-- 1. leads_public_insert: restrict to anon only + validate tenant is active
--    Previous: FOR ALL ROLES, WITH CHECK (true) — allowed any role to insert
--    leads for any tenant_id including inactive or non-existent tenants.
--
-- 2. vehicles_public_read (storage): remove broad SELECT policy.
--    Bucket is public=true — direct URLs work without RLS policy.
--    The broad policy allowed SDK-based listing of ALL files in the bucket,
--    potentially exposing tenant folder structure.
-- =============================================================================

-- ── 1. Fix leads_public_insert ────────────────────────────────────────────────
DROP POLICY IF EXISTS leads_public_insert ON public.leads;

CREATE POLICY leads_public_insert ON public.leads
    FOR INSERT
    TO anon
    WITH CHECK (
        tenant_id IN (
            SELECT id FROM public.tenants WHERE is_active = TRUE
        )
    );

-- ── 2. Remove broad storage listing policy (bucket is public=true) ────────────
DROP POLICY IF EXISTS vehicles_public_read ON storage.objects;
