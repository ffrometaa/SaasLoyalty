-- Create RPC function for scoring engine stats
-- Fixes: C-04 RPC get_member_engine_stats doesn't exist

CREATE OR REPLACE FUNCTION get_member_engine_stats(p_tenant_id UUID)
RETURNS TABLE (
  id UUID,
  tenant_id UUID,
  status TEXT,
  tier TEXT,
  points_lifetime INTEGER,
  visit_count_30d INTEGER,
  points_earned_30d INTEGER,
  last_visit_at TIMESTAMPTZ,
  challenges_completed INTEGER,
  member_since TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id,
    m.tenant_id,
    m.status::TEXT,
    m.tier::TEXT,
    m.points_lifetime,
    COALESCE(visit_counts.visit_count, 0)::INTEGER AS visit_count_30d,
    COALESCE(points_earned.points_30d, 0)::INTEGER AS points_earned_30d,
    m.last_visit_at,
    COALESCE(completed_challenges.count, 0)::INTEGER AS challenges_completed,
    m.created_at AS member_since
  FROM members m
  LEFT JOIN (
    SELECT tenant_id, member_id, COUNT(*) as visit_count
    FROM visits
    WHERE created_at >= NOW() - INTERVAL '30 days'
    GROUP BY tenant_id, member_id
  ) visit_counts ON m.id = visit_counts.member_id
  LEFT JOIN (
    SELECT tenant_id, member_id, SUM(ABS(points)) as points_30d
    FROM transactions
    WHERE type IN ('earn', 'bonus', 'referral', 'birthday')
      AND created_at >= NOW() - INTERVAL '30 days'
    GROUP BY tenant_id, member_id
  ) points_earned ON m.id = points_earned.member_id
  LEFT JOIN (
    SELECT tenant_id, member_id, COUNT(*) as count
    FROM member_challenge_progress
    WHERE completed_at IS NOT NULL
    GROUP BY tenant_id, member_id
  ) completed_challenges ON m.id = completed_challenges.member_id
  WHERE m.tenant_id = p_tenant_id
    AND m.deleted_at IS NULL
    AND m.status = 'active';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to service role
GRANT EXECUTE ON FUNCTION get_member_engine_stats TO service_role;
