-- Fix cross-tenant badge leak
-- "member_badges_catalog_read" ON badges FOR SELECT USING (true) allows any
-- authenticated user to read badges from ALL tenants. Migration 20260405000006
-- added a scoped "badges_select_tenant" but never dropped the permissive one.
-- With permissive policies, PostgreSQL evaluates with OR — USING (true) always wins.

DROP POLICY IF EXISTS "member_badges_catalog_read" ON badges;

-- Members and tenant admins can only see badges belonging to their own tenant.
-- Covers two auth contexts:
--   1. Dashboard admin: auth_tenant_id() set by middleware (app.tenant_id session var)
--   2. Member app: auth_member_id() set by middleware (app.member_id session var)
--      → resolved via members table lookup for their tenant_id
CREATE POLICY "member_badges_catalog_read" ON badges
  FOR SELECT USING (
    tenant_id = auth_tenant_id()
    OR EXISTS (
      SELECT 1 FROM members
      WHERE id = auth_member_id()
        AND tenant_id = badges.tenant_id
    )
  );
