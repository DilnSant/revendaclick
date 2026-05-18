-- ─── Migration 007: Supabase Storage — vehicles bucket + RLS ─────────────────
--
-- Creates the vehicles storage bucket and RLS policies so each tenant can
-- upload to their own folder (vehicles/{tenant_id}/) and all photos are
-- publicly readable.
--
-- Run once in Supabase SQL editor.

-- ── Bucket ────────────────────────────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'vehicles',
  'vehicles',
  true,
  8388608,  -- 8 MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public             = true,
  file_size_limit    = 8388608,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

-- ── RLS policies ──────────────────────────────────────────────────────────────

-- Public read (vehicle photos are shown to visitors)
DROP POLICY IF EXISTS "vehicles_public_read" ON storage.objects;
CREATE POLICY "vehicles_public_read"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'vehicles');

-- Authenticated upload — only into own tenant folder
DROP POLICY IF EXISTS "vehicles_tenant_upload" ON storage.objects;
CREATE POLICY "vehicles_tenant_upload"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'vehicles'
    AND (storage.foldername(name))[1] = (auth.jwt() ->> 'tenant_id')
  );

-- Authenticated delete — only own tenant folder
DROP POLICY IF EXISTS "vehicles_tenant_delete" ON storage.objects;
CREATE POLICY "vehicles_tenant_delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'vehicles'
    AND (storage.foldername(name))[1] = (auth.jwt() ->> 'tenant_id')
  );
