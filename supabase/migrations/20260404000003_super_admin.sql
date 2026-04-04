-- ─── SUPER ADMIN SYSTEM ──────────────────────────────────────────────────────
-- Migration: super_admins, platform_events, plan_overrides, platform_config
-- Run after: 20260404000002_campaigns_module.sql

-- ─── SUPER ADMINS TABLE ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS super_admins (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  email         text NOT NULL UNIQUE,
  full_name     text NOT NULL DEFAULT '',
  is_active     boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  last_login_at timestamptz
);

-- ─── PLATFORM EVENTS TABLE ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS platform_events (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id    uuid REFERENCES super_admins(id) ON DELETE SET NULL,
  action_type text NOT NULL,
  target_type text,
  target_id   text,
  metadata    jsonb DEFAULT '{}',
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ─── PLAN OVERRIDES TABLE ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS plan_overrides (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id      uuid REFERENCES super_admins(id) ON DELETE SET NULL,
  tenant_id     uuid REFERENCES tenants(id) ON DELETE CASCADE,
  override_plan text NOT NULL CHECK (override_plan IN ('starter','pro','scale','enterprise')),
  original_plan text NOT NULL CHECK (original_plan IN ('starter','pro','scale','enterprise')),
  reason        text,
  expires_at    timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- ─── PLATFORM CONFIG TABLE ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS platform_config (
  id                         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  trial_period_days          integer NOT NULL DEFAULT 14,
  grace_period_days          integer NOT NULL DEFAULT 7,
  points_expiry_days         integer NOT NULL DEFAULT 365,
  reactivation_threshold_days integer NOT NULL DEFAULT 25,
  max_payment_retries        integer NOT NULL DEFAULT 3,
  updated_at                 timestamptz NOT NULL DEFAULT now(),
  updated_by                 uuid REFERENCES super_admins(id) ON DELETE SET NULL
);

-- Insert default config row
INSERT INTO platform_config (id)
VALUES ('00000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- ─── RLS ──────────────────────────────────────────────────────────────────────
ALTER TABLE super_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_config ENABLE ROW LEVEL SECURITY;

-- Helper function: returns true if the caller is an active super admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM super_admins
    WHERE user_id = auth.uid()
      AND is_active = true
  );
$$;

-- super_admins: only active super admins can read/write
CREATE POLICY "super_admins_select" ON super_admins
  FOR SELECT USING (is_super_admin());

CREATE POLICY "super_admins_insert" ON super_admins
  FOR INSERT WITH CHECK (is_super_admin());

CREATE POLICY "super_admins_update" ON super_admins
  FOR UPDATE USING (is_super_admin());

-- platform_events: only active super admins can read/write
CREATE POLICY "platform_events_select" ON platform_events
  FOR SELECT USING (is_super_admin());

CREATE POLICY "platform_events_insert" ON platform_events
  FOR INSERT WITH CHECK (is_super_admin());

-- plan_overrides: only active super admins can read/write
CREATE POLICY "plan_overrides_select" ON plan_overrides
  FOR SELECT USING (is_super_admin());

CREATE POLICY "plan_overrides_insert" ON plan_overrides
  FOR INSERT WITH CHECK (is_super_admin());

-- platform_config: only active super admins can read/write
CREATE POLICY "platform_config_select" ON platform_config
  FOR SELECT USING (is_super_admin());

CREATE POLICY "platform_config_update" ON platform_config
  FOR UPDATE USING (is_super_admin());

-- ─── INDEXES ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS platform_events_admin_id_idx ON platform_events(admin_id);
CREATE INDEX IF NOT EXISTS platform_events_created_at_idx ON platform_events(created_at DESC);
CREATE INDEX IF NOT EXISTS platform_events_target_idx ON platform_events(target_type, target_id);
CREATE INDEX IF NOT EXISTS plan_overrides_tenant_id_idx ON plan_overrides(tenant_id);

-- ─── ADMIN TENANT OVERVIEW VIEW ───────────────────────────────────────────────
-- MRR values per plan (USD/month): starter=79, pro=199, scale=399, enterprise=0
CREATE OR REPLACE VIEW admin_tenant_overview AS
SELECT
  t.id,
  t.business_name,
  t.business_type,
  t.slug,
  t.plan,
  t.plan_status,
  t.stripe_customer_id,
  t.stripe_subscription_id,
  t.trial_ends_at,
  t.created_at,
  t.deleted_at,
  -- Member count
  COALESCE((
    SELECT COUNT(*) FROM members m
    WHERE m.tenant_id = t.id AND m.status = 'active'
  ), 0) AS member_count,
  -- Total campaign count
  COALESCE((
    SELECT COUNT(*) FROM campaigns c
    WHERE c.tenant_id = t.id
  ), 0) AS campaign_count,
  -- Campaigns this month
  COALESCE((
    SELECT COUNT(*) FROM campaigns c
    WHERE c.tenant_id = t.id
      AND c.created_at >= date_trunc('month', now())
  ), 0) AS campaigns_this_month,
  -- Pending (active) redemptions count
  COALESCE((
    SELECT COUNT(*) FROM redemptions r
    WHERE r.tenant_id = t.id AND r.status = 'pending'
  ), 0) AS active_redemptions,
  -- Last activity (most recent visit)
  (
    SELECT MAX(v.created_at) FROM visits v
    WHERE v.tenant_id = t.id
  ) AS last_activity_at,
  -- MRR contribution in USD cents
  CASE t.plan
    WHEN 'starter'    THEN CASE WHEN t.plan_status = 'active' THEN 7900  ELSE 0 END
    WHEN 'pro'        THEN CASE WHEN t.plan_status = 'active' THEN 19900 ELSE 0 END
    WHEN 'scale'      THEN CASE WHEN t.plan_status = 'active' THEN 39900 ELSE 0 END
    WHEN 'enterprise' THEN 0
    ELSE 0
  END AS mrr_cents
FROM tenants t
WHERE t.deleted_at IS NULL;

-- ─── INITIAL SUPER ADMIN SEED ─────────────────────────────────────────────────
-- Seed felixdfrometa@gmail.com as the initial super admin.
-- The user_id is looked up from auth.users by email.
-- If the auth user does not exist yet (first login hasn't happened),
-- the record is inserted with user_id = NULL and must be updated manually
-- after the user signs in for the first time:
--   UPDATE super_admins SET user_id = (SELECT id FROM auth.users WHERE email = 'felixdfrometa@gmail.com')
--   WHERE email = 'felixdfrometa@gmail.com';
INSERT INTO super_admins (user_id, email, full_name, is_active)
SELECT
  (SELECT id FROM auth.users WHERE email = 'felixdfrometa@gmail.com' LIMIT 1),
  'felixdfrometa@gmail.com',
  'Denis',
  true
ON CONFLICT (email) DO NOTHING;
