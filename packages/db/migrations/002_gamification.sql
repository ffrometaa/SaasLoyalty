-- Gamification Module
-- Challenges, member progress, and badges for Enterprise plan tenants

-- ============================================
-- ENUMS
-- ============================================

CREATE TYPE challenge_type AS ENUM ('visit_count', 'points_earned', 'referral', 'spend_amount', 'streak');
CREATE TYPE challenge_status AS ENUM ('active', 'draft', 'archived');
CREATE TYPE badge_rarity AS ENUM ('common', 'rare', 'epic', 'legendary');

-- ============================================
-- TABLES
-- ============================================

-- Challenges defined by the business (tenant)
CREATE TABLE challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  type challenge_type NOT NULL,
  goal_value INTEGER NOT NULL CHECK (goal_value > 0),
  bonus_points INTEGER NOT NULL DEFAULT 0 CHECK (bonus_points >= 0),
  badge_id UUID,  -- FK added after badges table below
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  status challenge_status NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Badges awarded upon challenge completion
CREATE TABLE badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  icon_url TEXT,
  rarity badge_rarity NOT NULL DEFAULT 'common',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add FK from challenges to badges (deferred to avoid circular dependency)
ALTER TABLE challenges
  ADD CONSTRAINT fk_challenges_badge
  FOREIGN KEY (badge_id) REFERENCES badges(id) ON DELETE SET NULL;

-- Member progress toward each challenge
CREATE TABLE member_challenge_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  current_value INTEGER NOT NULL DEFAULT 0 CHECK (current_value >= 0),
  completed_at TIMESTAMPTZ,
  bonus_awarded BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_member_challenge UNIQUE (member_id, challenge_id)
);

-- Member badges earned
CREATE TABLE member_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  awarded_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_member_badge UNIQUE (member_id, badge_id)
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_challenges_tenant ON challenges(tenant_id);
CREATE INDEX idx_challenges_status ON challenges(tenant_id, status);
CREATE INDEX idx_member_challenge_progress_member ON member_challenge_progress(member_id);
CREATE INDEX idx_member_challenge_progress_challenge ON member_challenge_progress(challenge_id);
CREATE INDEX idx_member_badges_member ON member_badges(member_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_challenge_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_badges ENABLE ROW LEVEL SECURITY;

-- Tenant-scoped: dashboard owners and staff can read/write their own data
CREATE POLICY "tenant_challenges_rls" ON challenges
  USING (tenant_id = auth_tenant_id());

CREATE POLICY "tenant_badges_rls" ON badges
  USING (tenant_id = auth_tenant_id());

CREATE POLICY "tenant_member_challenge_progress_rls" ON member_challenge_progress
  USING (tenant_id = auth_tenant_id());

CREATE POLICY "tenant_member_badges_rls" ON member_badges
  USING (tenant_id = auth_tenant_id());

-- Members can read their own progress and badges
CREATE POLICY "member_challenge_progress_self_read" ON member_challenge_progress
  FOR SELECT USING (member_id = auth_member_id());

CREATE POLICY "member_badges_self_read" ON member_badges
  FOR SELECT USING (member_id = auth_member_id());

-- Members can read active challenges for their tenant
CREATE POLICY "member_challenges_read" ON challenges
  FOR SELECT USING (status = 'active');

CREATE POLICY "member_badges_catalog_read" ON badges
  FOR SELECT USING (true);

-- ============================================
-- UPDATED_AT TRIGGERS
-- ============================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER challenges_updated_at
  BEFORE UPDATE ON challenges
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER member_challenge_progress_updated_at
  BEFORE UPDATE ON member_challenge_progress
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
