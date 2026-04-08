-- Helper function for birthday-bonus Edge Function
-- Returns all active members whose birthday matches the given month and day,
-- along with their tenant info for notification context.

CREATE OR REPLACE FUNCTION get_birthday_members_today(p_month INTEGER, p_day INTEGER)
RETURNS TABLE (
  id            UUID,
  tenant_id     UUID,
  name          TEXT,
  email         TEXT,
  points_balance INTEGER,
  accepts_email BOOLEAN,
  accepts_push  BOOLEAN,
  tenants       JSONB
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT
    m.id,
    m.tenant_id,
    m.name,
    m.email,
    m.points_balance,
    m.accepts_email,
    m.accepts_push,
    jsonb_build_object(
      'business_name',       t.business_name,
      'brand_color_primary', t.brand_color_primary
    ) AS tenants
  FROM members m
  JOIN tenants t ON t.id = m.tenant_id
  WHERE
    m.status = 'active'
    AND m.deleted_at IS NULL
    AND m.birthday IS NOT NULL
    AND EXTRACT(MONTH FROM m.birthday) = p_month
    AND EXTRACT(DAY   FROM m.birthday) = p_day
    AND t.deleted_at IS NULL
    AND t.plan_status IN ('active', 'trialing');
$$;

COMMENT ON FUNCTION get_birthday_members_today IS
  'Returns active members whose birthday matches the given month and day, for use by the birthday-bonus cron job.';
