-- Fix RLS for gamification engine tables, member_invitations, and stripe_events.
--
-- Root cause: enterprise_gamification_engine migration (20260404000005) and
-- member_invitations migration (20260404000008) used auth_tenant_id() /
-- auth_member_id(), which read PostgreSQL session settings that are never set
-- by any middleware. Both functions always return NULL,
-- making every policy that used them a no-op.
--
-- fix_rls_all_tables (20260406000006) introduced current_tenant_id() /
-- current_member_id() (SECURITY DEFINER, resolved via auth.uid()) and fixed
-- the basic tables, but did not cover the gamification engine tables.
--
-- This migration:
--   1. Enables RLS on stripe_events (missed in initial schema)
--   2. Drops all broken policies on 9 gamification tables
--   3. Recreates them using current_tenant_id() / current_member_id()
--
-- The helper functions current_tenant_id() and current_member_id() already
-- exist from 20260406000006 — no need to redefine them here.

-- ─────────────────────────────────────────────────────────────────────────────
-- STRIPE_EVENTS — enable RLS (no policies = blocked for anon/authenticated)
-- service_role bypasses RLS, so the webhook is unaffected.
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.stripe_events ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────────────────────
-- MEMBER_BEHAVIOR_SCORES
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "tenant_behavior_scores_rls" ON member_behavior_scores;
DROP POLICY IF EXISTS "member_scores_self_read"    ON member_behavior_scores;

-- Tenant admins/staff: see and write their own tenant's scores
CREATE POLICY behavior_scores_select_tenant ON member_behavior_scores
  FOR SELECT USING (tenant_id = current_tenant_id());

CREATE POLICY behavior_scores_insert_tenant ON member_behavior_scores
  FOR INSERT WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY behavior_scores_update_tenant ON member_behavior_scores
  FOR UPDATE USING (tenant_id = current_tenant_id());

-- Members: read their own score only
CREATE POLICY behavior_scores_select_member ON member_behavior_scores
  FOR SELECT USING (member_id = current_member_id());

-- ─────────────────────────────────────────────────────────────────────────────
-- MISSIONS
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "tenant_missions_rls"  ON missions;
DROP POLICY IF EXISTS "member_missions_read" ON missions;

-- Tenant admins/staff: full access to their own tenant's missions
CREATE POLICY missions_select_tenant ON missions
  FOR SELECT USING (tenant_id = current_tenant_id());

CREATE POLICY missions_insert_tenant ON missions
  FOR INSERT WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY missions_update_tenant ON missions
  FOR UPDATE USING (tenant_id = current_tenant_id());

-- Members: read active missions for their tenant
-- current_tenant_id() resolves members.auth_user_id → tenant_id, so this
-- covers member-app users without needing a separate member policy.
-- No separate member policy needed: the SELECT above already covers members
-- because current_tenant_id() resolves the member's tenant via auth.uid().

-- ─────────────────────────────────────────────────────────────────────────────
-- MISSION_STEPS
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "tenant_mission_steps_rls" ON mission_steps;

CREATE POLICY mission_steps_select_tenant ON mission_steps
  FOR SELECT USING (
    mission_id IN (SELECT id FROM missions WHERE tenant_id = current_tenant_id())
  );

CREATE POLICY mission_steps_insert_tenant ON mission_steps
  FOR INSERT WITH CHECK (
    mission_id IN (SELECT id FROM missions WHERE tenant_id = current_tenant_id())
  );

CREATE POLICY mission_steps_update_tenant ON mission_steps
  FOR UPDATE USING (
    mission_id IN (SELECT id FROM missions WHERE tenant_id = current_tenant_id())
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- MEMBER_MISSION_PROGRESS
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "tenant_mission_progress_rls"      ON member_mission_progress;
DROP POLICY IF EXISTS "member_mission_progress_self_read" ON member_mission_progress;

CREATE POLICY mission_progress_select_tenant ON member_mission_progress
  FOR SELECT USING (tenant_id = current_tenant_id());

CREATE POLICY mission_progress_insert_tenant ON member_mission_progress
  FOR INSERT WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY mission_progress_update_tenant ON member_mission_progress
  FOR UPDATE USING (tenant_id = current_tenant_id());

-- Members: read/write their own progress
CREATE POLICY mission_progress_select_member ON member_mission_progress
  FOR SELECT USING (member_id = current_member_id());

CREATE POLICY mission_progress_insert_member ON member_mission_progress
  FOR INSERT WITH CHECK (member_id = current_member_id());

CREATE POLICY mission_progress_update_member ON member_mission_progress
  FOR UPDATE USING (member_id = current_member_id());

-- ─────────────────────────────────────────────────────────────────────────────
-- POINT_MULTIPLIERS
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "tenant_multipliers_rls"    ON point_multipliers;
DROP POLICY IF EXISTS "member_multipliers_read"   ON point_multipliers;

CREATE POLICY multipliers_select_tenant ON point_multipliers
  FOR SELECT USING (tenant_id = current_tenant_id());

CREATE POLICY multipliers_insert_tenant ON point_multipliers
  FOR INSERT WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY multipliers_update_tenant ON point_multipliers
  FOR UPDATE USING (tenant_id = current_tenant_id());

-- ─────────────────────────────────────────────────────────────────────────────
-- LEADERBOARD_SNAPSHOTS
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "tenant_leaderboard_rls"  ON leaderboard_snapshots;
DROP POLICY IF EXISTS "member_leaderboard_read" ON leaderboard_snapshots;

CREATE POLICY leaderboard_select_tenant ON leaderboard_snapshots
  FOR SELECT USING (tenant_id = current_tenant_id());

CREATE POLICY leaderboard_insert_tenant ON leaderboard_snapshots
  FOR INSERT WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY leaderboard_update_tenant ON leaderboard_snapshots
  FOR UPDATE USING (tenant_id = current_tenant_id());

-- ─────────────────────────────────────────────────────────────────────────────
-- ENGINE_ACTIVITY_LOG
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "tenant_engine_log_rls" ON engine_activity_log;

CREATE POLICY engine_log_select_tenant ON engine_activity_log
  FOR SELECT USING (tenant_id = current_tenant_id());

CREATE POLICY engine_log_insert_tenant ON engine_activity_log
  FOR INSERT WITH CHECK (tenant_id = current_tenant_id());

-- ─────────────────────────────────────────────────────────────────────────────
-- CHURN_INTERVENTIONS
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "tenant_interventions_rls" ON churn_interventions;

CREATE POLICY interventions_select_tenant ON churn_interventions
  FOR SELECT USING (tenant_id = current_tenant_id());

CREATE POLICY interventions_insert_tenant ON churn_interventions
  FOR INSERT WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY interventions_update_tenant ON churn_interventions
  FOR UPDATE USING (tenant_id = current_tenant_id());

-- ─────────────────────────────────────────────────────────────────────────────
-- MEMBER_INVITATIONS
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "tenant_manage_invitations" ON member_invitations;

CREATE POLICY member_invitations_select_tenant ON member_invitations
  FOR SELECT USING (tenant_id = current_tenant_id());

CREATE POLICY member_invitations_insert_tenant ON member_invitations
  FOR INSERT WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY member_invitations_update_tenant ON member_invitations
  FOR UPDATE USING (tenant_id = current_tenant_id());

-- ─────────────────────────────────────────────────────────────────────────────
-- DYNAMIC_CHALLENGES
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "tenant_dynamic_challenges_rls"      ON dynamic_challenges;
DROP POLICY IF EXISTS "member_dynamic_challenges_self_read" ON dynamic_challenges;

-- Tenant admins/staff: full access to their tenant's dynamic challenges
CREATE POLICY dynamic_challenges_select_tenant ON dynamic_challenges
  FOR SELECT USING (tenant_id = current_tenant_id());

CREATE POLICY dynamic_challenges_insert_tenant ON dynamic_challenges
  FOR INSERT WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY dynamic_challenges_update_tenant ON dynamic_challenges
  FOR UPDATE USING (tenant_id = current_tenant_id());

-- Members: read their own dynamic challenges
CREATE POLICY dynamic_challenges_select_member ON dynamic_challenges
  FOR SELECT USING (member_id = current_member_id());
