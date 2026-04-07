-- Fix RLS across all tables: replace auth_tenant_id() / auth_member_id() session vars
-- with SECURITY DEFINER helper functions that resolve identity via auth.uid() directly.
--
-- Root cause: auth_tenant_id() and auth_member_id() read PostgreSQL session settings
-- (current_setting('app.tenant_id') / current_setting('app.member_id')) that are never
-- set by any middleware. Both functions always returned NULL, making every policy
-- that used them a no-op. Only the tenants table was previously fixed (migration 007).
--
-- Solution: two SECURITY DEFINER helper functions that resolve tenant_id and member_id
-- from auth.uid() via real table lookups, without depending on session state.
-- STABLE modifier allows PostgreSQL to call them once per query, not once per row.

-- ─────────────────────────────────────────────────────────────────────────────
-- HELPER FUNCTIONS
-- ─────────────────────────────────────────────────────────────────────────────

-- current_tenant_id(): resolves the tenant for any authenticated user:
--   1. Tenant owner   → tenants.auth_user_id = auth.uid()
--   2. Tenant staff   → tenant_users.auth_user_id = auth.uid()
--   3. Loyalty member → members.auth_user_id = auth.uid() (member app context)
CREATE OR REPLACE FUNCTION current_tenant_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(
    (SELECT id         FROM tenants      WHERE auth_user_id = auth.uid() AND deleted_at IS NULL LIMIT 1),
    (SELECT tenant_id  FROM tenant_users WHERE auth_user_id = auth.uid() LIMIT 1),
    (SELECT tenant_id  FROM members      WHERE auth_user_id = auth.uid() LIMIT 1)
  );
$$;

-- current_member_id(): resolves the member_id for a loyalty member authenticated
-- via the member app. Returns NULL for tenant owners/staff (not in members table).
CREATE OR REPLACE FUNCTION current_member_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT id FROM members WHERE auth_user_id = auth.uid() LIMIT 1;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- MEMBERS
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS members_select_tenant  ON members;
DROP POLICY IF EXISTS members_insert_tenant  ON members;
DROP POLICY IF EXISTS members_update_tenant  ON members;
DROP POLICY IF EXISTS members_select_self    ON members;
DROP POLICY IF EXISTS members_update_self    ON members;

-- Dashboard: tenant admins and staff see/write their own tenant's members
CREATE POLICY members_select_tenant ON members
  FOR SELECT USING (tenant_id = current_tenant_id());

CREATE POLICY members_insert_tenant ON members
  FOR INSERT WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY members_update_tenant ON members
  FOR UPDATE USING (tenant_id = current_tenant_id());

-- Member app: members can read and update their own profile
CREATE POLICY members_select_self ON members
  FOR SELECT USING (id = current_member_id());

CREATE POLICY members_update_self ON members
  FOR UPDATE USING (id = current_member_id());

-- ─────────────────────────────────────────────────────────────────────────────
-- TRANSACTIONS
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS transactions_select_own    ON transactions;
DROP POLICY IF EXISTS transactions_insert_own    ON transactions;
DROP POLICY IF EXISTS transactions_select_member ON transactions;
DROP POLICY IF EXISTS transactions_select_tenant ON transactions;
DROP POLICY IF EXISTS transactions_insert_tenant ON transactions;

CREATE POLICY transactions_select_tenant ON transactions
  FOR SELECT USING (tenant_id = current_tenant_id());

CREATE POLICY transactions_insert_tenant ON transactions
  FOR INSERT WITH CHECK (tenant_id = current_tenant_id());

-- Member app: members see their own transaction history
CREATE POLICY transactions_select_member ON transactions
  FOR SELECT USING (member_id = current_member_id());

-- ─────────────────────────────────────────────────────────────────────────────
-- REWARDS
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS rewards_select_own    ON rewards;
DROP POLICY IF EXISTS rewards_insert_own    ON rewards;
DROP POLICY IF EXISTS rewards_update_own    ON rewards;
DROP POLICY IF EXISTS rewards_select_tenant ON rewards;
DROP POLICY IF EXISTS rewards_insert_tenant ON rewards;
DROP POLICY IF EXISTS rewards_update_tenant ON rewards;

CREATE POLICY rewards_select_tenant ON rewards
  FOR SELECT USING (tenant_id = current_tenant_id());

-- Members can also see active rewards for their tenant (current_tenant_id covers member context)
CREATE POLICY rewards_insert_tenant ON rewards
  FOR INSERT WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY rewards_update_tenant ON rewards
  FOR UPDATE USING (tenant_id = current_tenant_id());

-- ─────────────────────────────────────────────────────────────────────────────
-- REDEMPTIONS
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS redemptions_select_tenant ON redemptions;
DROP POLICY IF EXISTS redemptions_insert_own    ON redemptions;
DROP POLICY IF EXISTS redemptions_update_own    ON redemptions;
DROP POLICY IF EXISTS redemptions_select_member ON redemptions;
DROP POLICY IF EXISTS redemptions_insert_tenant ON redemptions;
DROP POLICY IF EXISTS redemptions_update_tenant ON redemptions;

CREATE POLICY redemptions_select_tenant ON redemptions
  FOR SELECT USING (tenant_id = current_tenant_id());

CREATE POLICY redemptions_insert_tenant ON redemptions
  FOR INSERT WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY redemptions_update_tenant ON redemptions
  FOR UPDATE USING (tenant_id = current_tenant_id());

-- Member app: members see their own redemptions
CREATE POLICY redemptions_select_member ON redemptions
  FOR SELECT USING (member_id = current_member_id());

-- ─────────────────────────────────────────────────────────────────────────────
-- CAMPAIGNS
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS campaigns_select_own    ON campaigns;
DROP POLICY IF EXISTS campaigns_insert_own    ON campaigns;
DROP POLICY IF EXISTS campaigns_update_own    ON campaigns;
DROP POLICY IF EXISTS campaigns_select_tenant ON campaigns;
DROP POLICY IF EXISTS campaigns_insert_tenant ON campaigns;
DROP POLICY IF EXISTS campaigns_update_tenant ON campaigns;

CREATE POLICY campaigns_select_tenant ON campaigns
  FOR SELECT USING (tenant_id = current_tenant_id());

CREATE POLICY campaigns_insert_tenant ON campaigns
  FOR INSERT WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY campaigns_update_tenant ON campaigns
  FOR UPDATE USING (tenant_id = current_tenant_id());

-- ─────────────────────────────────────────────────────────────────────────────
-- VISITS
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS visits_select_own    ON visits;
DROP POLICY IF EXISTS visits_insert_own    ON visits;
DROP POLICY IF EXISTS visits_select_member ON visits;
DROP POLICY IF EXISTS visits_select_tenant ON visits;
DROP POLICY IF EXISTS visits_insert_tenant ON visits;

CREATE POLICY visits_select_tenant ON visits
  FOR SELECT USING (tenant_id = current_tenant_id());

CREATE POLICY visits_insert_tenant ON visits
  FOR INSERT WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY visits_select_member ON visits
  FOR SELECT USING (member_id = current_member_id());

-- ─────────────────────────────────────────────────────────────────────────────
-- NOTIFICATIONS
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS notifications_select_tenant ON notifications;
DROP POLICY IF EXISTS notifications_select_member ON notifications;
DROP POLICY IF EXISTS notifications_insert_own    ON notifications;
DROP POLICY IF EXISTS notifications_insert_tenant ON notifications;

CREATE POLICY notifications_select_tenant ON notifications
  FOR SELECT USING (tenant_id = current_tenant_id());

CREATE POLICY notifications_select_member ON notifications
  FOR SELECT USING (member_id = current_member_id());

CREATE POLICY notifications_insert_tenant ON notifications
  FOR INSERT WITH CHECK (
    tenant_id = current_tenant_id()
    OR member_id = current_member_id()
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- REACTIVATION SEQUENCES
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS reactivation_select_own    ON reactivation_sequences;
DROP POLICY IF EXISTS reactivation_insert_own    ON reactivation_sequences;
DROP POLICY IF EXISTS reactivation_update_own    ON reactivation_sequences;
DROP POLICY IF EXISTS reactivation_select_tenant ON reactivation_sequences;
DROP POLICY IF EXISTS reactivation_insert_tenant ON reactivation_sequences;
DROP POLICY IF EXISTS reactivation_update_tenant ON reactivation_sequences;

CREATE POLICY reactivation_select_tenant ON reactivation_sequences
  FOR SELECT USING (tenant_id = current_tenant_id());

CREATE POLICY reactivation_insert_tenant ON reactivation_sequences
  FOR INSERT WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY reactivation_update_tenant ON reactivation_sequences
  FOR UPDATE USING (tenant_id = current_tenant_id());

-- ─────────────────────────────────────────────────────────────────────────────
-- DASHBOARD ALERTS
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS alerts_select_own    ON dashboard_alerts;
DROP POLICY IF EXISTS alerts_insert_own    ON dashboard_alerts;
DROP POLICY IF EXISTS alerts_update_own    ON dashboard_alerts;
DROP POLICY IF EXISTS alerts_select_tenant ON dashboard_alerts;
DROP POLICY IF EXISTS alerts_insert_tenant ON dashboard_alerts;
DROP POLICY IF EXISTS alerts_update_tenant ON dashboard_alerts;

CREATE POLICY alerts_select_tenant ON dashboard_alerts
  FOR SELECT USING (tenant_id = current_tenant_id());

CREATE POLICY alerts_insert_tenant ON dashboard_alerts
  FOR INSERT WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY alerts_update_tenant ON dashboard_alerts
  FOR UPDATE USING (tenant_id = current_tenant_id());

-- ─────────────────────────────────────────────────────────────────────────────
-- GAMIFICATION: CHALLENGES
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS tenant_challenges_rls    ON challenges;
DROP POLICY IF EXISTS challenges_select_tenant ON challenges;
DROP POLICY IF EXISTS challenges_insert_tenant ON challenges;
DROP POLICY IF EXISTS challenges_update_tenant ON challenges;
DROP POLICY IF EXISTS member_challenges_read   ON challenges;

CREATE POLICY challenges_select_tenant ON challenges
  FOR SELECT USING (tenant_id = current_tenant_id());

-- Members can read active challenges for their tenant via current_tenant_id()
-- (current_tenant_id() resolves members.auth_user_id → tenant_id)
CREATE POLICY challenges_insert_tenant ON challenges
  FOR INSERT WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY challenges_update_tenant ON challenges
  FOR UPDATE USING (tenant_id = current_tenant_id());

-- ─────────────────────────────────────────────────────────────────────────────
-- GAMIFICATION: BADGES
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS tenant_badges_rls          ON badges;
DROP POLICY IF EXISTS badges_select_tenant       ON badges;
DROP POLICY IF EXISTS badges_insert_tenant       ON badges;
DROP POLICY IF EXISTS "member_badges_catalog_read" ON badges;

-- Single tenant-scoped policy covers dashboard admins AND member app users
-- (current_tenant_id() resolves correctly for all three auth contexts)
CREATE POLICY badges_select_tenant ON badges
  FOR SELECT USING (tenant_id = current_tenant_id());

CREATE POLICY badges_insert_tenant ON badges
  FOR INSERT WITH CHECK (tenant_id = current_tenant_id());

-- ─────────────────────────────────────────────────────────────────────────────
-- GAMIFICATION: MEMBER CHALLENGE PROGRESS
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS tenant_member_challenge_progress_rls ON member_challenge_progress;
DROP POLICY IF EXISTS member_challenge_select_tenant       ON member_challenge_progress;
DROP POLICY IF EXISTS member_challenge_select_member       ON member_challenge_progress;
DROP POLICY IF EXISTS member_challenge_insert_tenant       ON member_challenge_progress;
DROP POLICY IF EXISTS member_challenge_insert_member       ON member_challenge_progress;
DROP POLICY IF EXISTS member_challenge_update              ON member_challenge_progress;
DROP POLICY IF EXISTS member_challenge_progress_self_read  ON member_challenge_progress;

CREATE POLICY member_challenge_select_tenant ON member_challenge_progress
  FOR SELECT USING (tenant_id = current_tenant_id());

CREATE POLICY member_challenge_select_member ON member_challenge_progress
  FOR SELECT USING (member_id = current_member_id());

CREATE POLICY member_challenge_insert_tenant ON member_challenge_progress
  FOR INSERT WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY member_challenge_insert_member ON member_challenge_progress
  FOR INSERT WITH CHECK (member_id = current_member_id());

CREATE POLICY member_challenge_update ON member_challenge_progress
  FOR UPDATE USING (
    member_id = current_member_id() OR tenant_id = current_tenant_id()
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- GAMIFICATION: MEMBER BADGES (earned badges)
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS tenant_member_badges_rls  ON member_badges;
DROP POLICY IF EXISTS member_badges_self_read   ON member_badges;
DROP POLICY IF EXISTS member_badges_select_tenant ON member_badges;
DROP POLICY IF EXISTS member_badges_select_member ON member_badges;

CREATE POLICY member_badges_select_tenant ON member_badges
  FOR SELECT USING (tenant_id = current_tenant_id());

CREATE POLICY member_badges_select_member ON member_badges
  FOR SELECT USING (member_id = current_member_id());
