-- ─────────────────────────────────────────────────────────────────────────────
-- 003_storage_logo_policy.sql
-- RLS policies for the 'logos' storage bucket.
--
-- The upload path is: {tenant.slug}/logo.{ext}
-- Auth column on tenants: auth_user_id (NOT owner_id)
--
-- A SECURITY DEFINER function is required to resolve the tenant slug without
-- hitting the circular RLS dependency: storage policies → tenants RLS →
-- auth_tenant_id() (current_setting) which is never set in the storage context.
-- ─────────────────────────────────────────────────────────────────────────────

-- Ensure the logos bucket exists (idempotent — safe to run if already created manually)
INSERT INTO storage.buckets (id, name, public)
VALUES ('logos', 'logos', true)
ON CONFLICT (id) DO NOTHING;

-- ─── Helper function ──────────────────────────────────────────────────────────
-- Returns the slug of the tenant owned by the currently authenticated user.
-- SECURITY DEFINER: runs as the function owner, bypasses RLS on tenants so the
-- subquery does not get blocked by tenants_select_own (which relies on
-- auth_tenant_id() / current_setting, unavailable in the storage context).
-- SET search_path = public: prevents search_path hijacking.

CREATE OR REPLACE FUNCTION storage_auth_tenant_slug()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT slug
  FROM public.tenants
  WHERE auth_user_id = auth.uid()
    AND deleted_at IS NULL
  LIMIT 1
$$;

-- ─── Storage policies ─────────────────────────────────────────────────────────

-- DROP existing policies first (idempotent re-runs)
DROP POLICY IF EXISTS "Tenant can upload own logo"  ON storage.objects;
DROP POLICY IF EXISTS "Tenant can update own logo"  ON storage.objects;
DROP POLICY IF EXISTS "Public can view logos"       ON storage.objects;
DROP POLICY IF EXISTS "Tenant can delete own logo"  ON storage.objects;

-- INSERT: authenticated tenant can only upload inside their own slug folder
CREATE POLICY "Tenant can upload own logo"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'logos'
  AND (storage.foldername(name))[1] = storage_auth_tenant_slug()
);

-- UPDATE: tenant can replace (upsert) their own logo
CREATE POLICY "Tenant can update own logo"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'logos'
  AND (storage.foldername(name))[1] = storage_auth_tenant_slug()
);

-- SELECT: public read so the logo renders in the Member App without auth
CREATE POLICY "Public can view logos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'logos');

-- DELETE: only the owning tenant can remove their logo
CREATE POLICY "Tenant can delete own logo"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'logos'
  AND (storage.foldername(name))[1] = storage_auth_tenant_slug()
);
