-- Fix CRITICAL security vulnerability in tenant_users and invitations RLS
-- Migration 20260405000004 introduced permissive policies (WITH CHECK (true) / USING (true))
-- that allow any authenticated user to INSERT/UPDATE on tenant_users and invitations
-- by calling the Supabase REST API directly with their JWT, bypassing app-level guards.

-- ─────────────────────────────────────────────────────────────────────────────
-- Step 1: Helper function — is_tenant_owner(tenant_id)
-- SECURITY DEFINER: runs as the function owner (postgres), bypassing RLS.
-- This avoids infinite recursion when querying tenant_users inside a tenant_users policy.
-- Same pattern as is_super_admin() in migration 20260404000003.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION is_tenant_owner(p_tenant_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM tenant_users
    WHERE tenant_id = p_tenant_id
      AND auth_user_id = auth.uid()
      AND role = 'owner'
  );
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- Step 2: Fix tenant_users policies
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "tenant_users_insert_service" ON tenant_users;
DROP POLICY IF EXISTS "tenant_users_update_service" ON tenant_users;

-- INSERT: Removed entirely for authenticated users.
-- The only INSERT path is apps/web/app/api/invite/accept/route.ts which uses
-- createServiceRoleClient() — service_role bypasses RLS, so no policy is needed.
-- Having WITH CHECK (true) here only adds attack surface with zero benefit.

-- UPDATE: Removed entirely for authenticated users.
-- No dashboard route updates tenant_users via user JWT. All updates go through
-- service_role. Having USING (true) here only adds attack surface with zero benefit.

-- DELETE: Added for owners removing other members from their own tenant.
-- Used by apps/dashboard/app/api/team/members/[id]/route.ts (DELETE).
-- Guard: owners cannot delete themselves (prevents orphaned tenants with no owner).
-- Note: this policy was MISSING in migration 20260405000004, so the delete
-- team member feature was broken in production. This also fixes that.
DROP POLICY IF EXISTS "tenant_users_delete_owner" ON tenant_users;
CREATE POLICY "tenant_users_delete_owner" ON tenant_users
  FOR DELETE USING (
    is_tenant_owner(tenant_id) AND auth_user_id != auth.uid()
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- Step 3: Fix invitations policies
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "invitations_insert_service" ON invitations;
DROP POLICY IF EXISTS "invitations_update_service" ON invitations;

-- INSERT: Only tenant owners can create invitations for their tenant.
-- Enforces at DB level what apps/dashboard/app/api/team/invites/route.ts
-- previously only enforced at app level (bypassable via direct Supabase REST call).
CREATE POLICY "invitations_insert_owner" ON invitations
  FOR INSERT WITH CHECK (is_tenant_owner(tenant_id));

-- UPDATE: Only tenant owners can update invitations (revoke, etc.) for their tenant.
-- The accept/expire flow uses createServiceRoleClient() → bypasses RLS → unaffected.
CREATE POLICY "invitations_update_owner" ON invitations
  FOR UPDATE USING (is_tenant_owner(tenant_id));
