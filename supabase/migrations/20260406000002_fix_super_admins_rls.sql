-- Fix CRITICAL security vulnerability in super_admins RLS
-- Migration 20260405000006 introduced "super_admins_all" FOR ALL USING (true)
-- which allowed ANY authenticated user to INSERT/UPDATE/DELETE/SELECT on super_admins.
-- This migration removes the insecure policy and restores correct access control.

-- Step 1: Remove the insecure policies introduced by 20260405000006
DROP POLICY IF EXISTS "super_admins_all" ON super_admins;
DROP POLICY IF EXISTS "super_admins_select" ON super_admins;

-- Step 2: Restore correct policies using is_super_admin() (SECURITY DEFINER function)
-- is_super_admin() checks: auth.uid() = user_id AND is_active = true
-- All three operations are restricted to existing active super admins only.

CREATE POLICY "super_admins_select" ON super_admins
  FOR SELECT USING (is_super_admin());

-- super_admins_insert and super_admins_update from migration 20260404000003
-- are already correct (use is_super_admin()) — not touched here.
-- No DELETE policy is intentional: super admins are deactivated via is_active = false.
