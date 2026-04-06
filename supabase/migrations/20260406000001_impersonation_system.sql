-- ─── IMPERSONATION SYSTEM ────────────────────────────────────────────────────
-- Migration: impersonation_logs, member_activity_log
-- Run after: 20260404000003_super_admin.sql
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── IMPERSONATION LOGS ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS impersonation_logs (
  id                  uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  super_admin_id      uuid NOT NULL REFERENCES super_admins(id) ON DELETE CASCADE,
  -- auth.users.id of the impersonated user (no FK — cross-schema constraint unreliable)
  target_auth_user_id uuid NOT NULL,
  target_tenant_id    uuid REFERENCES tenants(id) ON DELETE SET NULL,
  target_member_id    uuid REFERENCES members(id) ON DELETE SET NULL,
  impersonation_level text NOT NULL CHECK (
    impersonation_level IN ('super_admin_to_tenant', 'super_admin_to_member')
  ),
  token_hash          text NOT NULL UNIQUE,
  started_at          timestamptz NOT NULL DEFAULT now(),
  ended_at            timestamptz,
  ip_address          inet,
  user_agent          text,
  reason              text,
  created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_impersonation_logs_super_admin_id     ON impersonation_logs(super_admin_id);
CREATE INDEX idx_impersonation_logs_target_auth_user   ON impersonation_logs(target_auth_user_id);
CREATE INDEX idx_impersonation_logs_created_at         ON impersonation_logs(created_at DESC);
CREATE INDEX idx_impersonation_logs_started_at         ON impersonation_logs(started_at DESC);

ALTER TABLE impersonation_logs ENABLE ROW LEVEL SECURITY;

-- Only super admins can read/write impersonation logs
CREATE POLICY "super_admin_select_impersonation_logs" ON impersonation_logs
  FOR SELECT USING (is_super_admin());

CREATE POLICY "super_admin_insert_impersonation_logs" ON impersonation_logs
  FOR INSERT WITH CHECK (is_super_admin());

CREATE POLICY "super_admin_update_impersonation_logs" ON impersonation_logs
  FOR UPDATE USING (is_super_admin());

-- ─── MEMBER ACTIVITY LOG ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS member_activity_log (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id     uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  tenant_id     uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  action        text NOT NULL,
  resource_type text NOT NULL,
  resource_id   text,
  points_delta  integer,
  details       jsonb,
  ip_address    inet,
  user_agent    text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_member_activity_log_member_id  ON member_activity_log(member_id);
CREATE INDEX idx_member_activity_log_tenant_id  ON member_activity_log(tenant_id);
CREATE INDEX idx_member_activity_log_created_at ON member_activity_log(created_at DESC);
CREATE INDEX idx_member_activity_log_action     ON member_activity_log(action);

ALTER TABLE member_activity_log ENABLE ROW LEVEL SECURITY;

-- Super admins see everything
CREATE POLICY "super_admin_view_all_activity" ON member_activity_log
  FOR SELECT USING (is_super_admin());

-- Members see only their own activity
CREATE POLICY "member_view_own_activity" ON member_activity_log
  FOR SELECT USING (
    member_id = (
      SELECT id FROM members
      WHERE auth_user_id = auth.uid()
      LIMIT 1
    )
  );

-- Members can insert their own activity
CREATE POLICY "member_insert_own_activity" ON member_activity_log
  FOR INSERT WITH CHECK (
    member_id = (
      SELECT id FROM members
      WHERE auth_user_id = auth.uid()
      LIMIT 1
    )
  );

-- ─── FUNCTION: log_member_activity ───────────────────────────────────────────
CREATE OR REPLACE FUNCTION log_member_activity(
  p_member_id     uuid,
  p_action        text,
  p_resource_type text,
  p_resource_id   text    DEFAULT NULL,
  p_points_delta  integer DEFAULT NULL,
  p_details       jsonb   DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tenant_id uuid;
  v_log_id    uuid;
BEGIN
  SELECT tenant_id INTO v_tenant_id FROM members WHERE id = p_member_id;

  INSERT INTO member_activity_log (
    member_id, tenant_id, action, resource_type,
    resource_id, points_delta, details
  ) VALUES (
    p_member_id, v_tenant_id, p_action, p_resource_type,
    p_resource_id, p_points_delta, p_details
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$;

-- ─── FUNCTION: get_impersonation_summary ─────────────────────────────────────
CREATE OR REPLACE FUNCTION get_impersonation_summary(p_days integer DEFAULT 30)
RETURNS TABLE(
  date                 text,
  total_impersonations integer,
  unique_super_admins  integer,
  unique_targets       integer,
  avg_duration_seconds numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    DATE(il.started_at)::text,
    COUNT(*)::integer,
    COUNT(DISTINCT il.super_admin_id)::integer,
    COUNT(DISTINCT il.target_auth_user_id)::integer,
    AVG(
      EXTRACT(EPOCH FROM (COALESCE(il.ended_at, NOW()) - il.started_at))
    )::numeric
  FROM impersonation_logs il
  WHERE il.started_at > NOW() - (INTERVAL '1 day' * p_days)
  GROUP BY DATE(il.started_at)
  ORDER BY DATE(il.started_at) DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION log_member_activity      TO authenticated;
GRANT EXECUTE ON FUNCTION get_impersonation_summary TO authenticated;

-- ─── TRACKING FK COLUMNS ON EXISTING TABLES ──────────────────────────────────
ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS activity_log_id uuid REFERENCES member_activity_log(id);

ALTER TABLE redemptions
  ADD COLUMN IF NOT EXISTS activity_log_id uuid REFERENCES member_activity_log(id);

CREATE INDEX IF NOT EXISTS idx_transactions_activity_log_id ON transactions(activity_log_id);
CREATE INDEX IF NOT EXISTS idx_redemptions_activity_log_id  ON redemptions(activity_log_id);
