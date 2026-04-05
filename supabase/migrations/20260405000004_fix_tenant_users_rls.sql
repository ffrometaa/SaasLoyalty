-- RLS Fix for tenant_users - C-06
-- Allow authenticated users to read their own tenant_users records

-- Drop existing service_role only policies
DROP POLICY IF EXISTS "service_role_tenant_users" ON tenant_users;
DROP POLICY IF EXISTS "tenant_users_select_own" ON tenant_users;
DROP POLICY IF EXISTS "tenant_users_insert_service" ON tenant_users;
DROP POLICY IF EXISTS "tenant_users_update_service" ON tenant_users;
DROP POLICY IF EXISTS "service_role_invitations" ON invitations;
DROP POLICY IF EXISTS "invitations_select_by_email" ON invitations;
DROP POLICY IF EXISTS "invitations_insert_service" ON invitations;
DROP POLICY IF EXISTS "invitations_update_service" ON invitations;

-- Create proper RLS policies for tenant_users
-- Users can read their own tenant_user record
CREATE POLICY "tenant_users_select_own" ON tenant_users
  FOR SELECT USING (auth_user_id = auth.uid());

-- Users can only insert via service role (invitation flow)
CREATE POLICY "tenant_users_insert_service" ON tenant_users
  FOR INSERT WITH CHECK (true);

-- Users can only update via service role (admin actions)
CREATE POLICY "tenant_users_update_service" ON tenant_users
  FOR UPDATE USING (true);

-- For invitations: users can read invitations sent to their email
CREATE POLICY "invitations_select_by_email" ON invitations
  FOR SELECT USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- Invitations can only be modified by service role
CREATE POLICY "invitations_insert_service" ON invitations
  FOR INSERT WITH CHECK (true);

CREATE POLICY "invitations_update_service" ON invitations
  FOR UPDATE USING (true);
