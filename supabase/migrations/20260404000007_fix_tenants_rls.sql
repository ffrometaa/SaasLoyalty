-- Fix tenants RLS: replace app.tenant_id session var with auth.uid()
-- The previous policy relied on a session variable never set by the app,
-- blocking all tenant queries for authenticated users.

DROP POLICY IF EXISTS tenants_select_own ON tenants;
DROP POLICY IF EXISTS tenants_update_own ON tenants;

CREATE POLICY tenants_select_own ON tenants
  FOR SELECT USING (auth_user_id = auth.uid());

CREATE POLICY tenants_update_own ON tenants
  FOR UPDATE USING (auth_user_id = auth.uid());
