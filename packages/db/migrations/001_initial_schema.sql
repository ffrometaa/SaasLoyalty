-- LoyaltyOS Database Schema
-- Multi-tenant SaaS with Row Level Security (RLS)

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_cron";

-- ============================================
-- ENUMS
-- ============================================

CREATE TYPE business_type AS ENUM ('spa', 'restaurant', 'gym', 'retail', 'hotel', 'salon');
CREATE TYPE plan_type AS ENUM ('starter', 'pro', 'scale');
CREATE TYPE plan_status AS ENUM ('trialing', 'active', 'past_due', 'canceled');
CREATE TYPE member_tier AS ENUM ('bronze', 'silver', 'gold', 'platinum');
CREATE TYPE member_status AS ENUM ('active', 'inactive', 'blocked');
CREATE TYPE transaction_type AS ENUM ('earn', 'redeem', 'expire', 'bonus', 'referral', 'birthday', 'adjustment', 'refund');
CREATE TYPE redemption_status AS ENUM ('pending', 'used', 'expired');
CREATE TYPE campaign_type AS ENUM ('reactivation', 'birthday', 'custom', 'launch');
CREATE TYPE campaign_status AS ENUM ('draft', 'scheduled', 'running', 'completed', 'paused');
CREATE TYPE notification_channel AS ENUM ('email', 'push', 'in_app');
CREATE TYPE notification_status AS ENUM ('pending', 'sent', 'delivered', 'opened', 'failed');

-- ============================================
-- HELPER FUNCTIONS FOR RLS
-- ============================================

-- Get current tenant_id from app settings (set by middleware)
CREATE OR REPLACE FUNCTION auth_tenant_id()
RETURNS UUID AS $$
  SELECT NULLIF(current_setting('app.tenant_id', true), '')::UUID;
$$ LANGUAGE SQL STABLE;

-- Get current member_id from app settings (set by middleware for member auth)
CREATE OR REPLACE FUNCTION auth_member_id()
RETURNS UUID AS $$
  SELECT NULLIF(current_setting('app.member_id', true), '')::UUID;
$$ LANGUAGE SQL STABLE;

-- ============================================
-- TABLES
-- ============================================

-- Tenants (businesses B2B)
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  business_name TEXT NOT NULL,
  business_type business_type NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  plan plan_type NOT NULL DEFAULT 'starter',
  plan_status plan_status NOT NULL DEFAULT 'trialing',
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  brand_color_primary TEXT DEFAULT '#6366f1',
  brand_color_secondary TEXT DEFAULT '#818cf8',
  brand_logo_url TEXT,
  brand_app_name TEXT,
  points_per_dollar INTEGER DEFAULT 1 CHECK (points_per_dollar >= 1),
  points_expiration_days INTEGER DEFAULT 365 CHECK (points_expiration_days >= 30),
  max_members INTEGER DEFAULT 500 CHECK (max_members > 0),
  trial_ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Members (end customers)
CREATE TABLE members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  member_code TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  tier member_tier NOT NULL DEFAULT 'bronze',
  points_balance INTEGER NOT NULL DEFAULT 0 CHECK (points_balance >= 0),
  points_lifetime INTEGER NOT NULL DEFAULT 0 CHECK (points_lifetime >= 0),
  visits_total INTEGER NOT NULL DEFAULT 0 CHECK (visits_total >= 0),
  last_visit_at TIMESTAMPTZ,
  status member_status NOT NULL DEFAULT 'active',
  accepts_email BOOLEAN DEFAULT true,
  accepts_push BOOLEAN DEFAULT false,
  referrer_member_id UUID REFERENCES members(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  
  CONSTRAINT unique_member_email_per_tenant UNIQUE (tenant_id, email)
);

-- Transactions (immutable point history)
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  type transaction_type NOT NULL,
  points INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  description TEXT,
  reference_id UUID, -- Links to redemptions, rewards, etc.
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Transactions are immutable - no updated_at or deleted_at
  CONSTRAINT points_cannot_be_zero CHECK (points != 0)
);

-- Rewards
CREATE TABLE rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(name) <= 100),
  description TEXT CHECK (char_length(description) <= 500),
  points_required INTEGER NOT NULL CHECK (points_required > 0),
  max_redemptions INTEGER CHECK (max_redemptions > 0),
  redemption_count INTEGER DEFAULT 0 CHECK (redemption_count >= 0),
  valid_from TIMESTAMPTZ,
  valid_until TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Redemptions
CREATE TABLE redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  reward_id UUID NOT NULL REFERENCES rewards(id) ON DELETE CASCADE,
  points_spent INTEGER NOT NULL CHECK (points_spent > 0),
  status redemption_status NOT NULL DEFAULT 'pending',
  qr_code TEXT UNIQUE NOT NULL,
  alphanumeric_code TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Campaigns
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type campaign_type NOT NULL,
  status campaign_status NOT NULL DEFAULT 'draft',
  target_segment TEXT, -- 'inactive', 'at_risk', 'all', etc.
  bonus_points INTEGER DEFAULT 0,
  bonus_multiplier DECIMAL(3,2) DEFAULT 1.00,
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  stats JSONB DEFAULT '{"sent": 0, "delivered": 0, "opened": 0, "clicked": 0}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Visits (for analytics)
CREATE TABLE visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
  amount DECIMAL(10,2),
  points_earned INTEGER,
  day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6),
  hour_of_day INTEGER CHECK (hour_of_day BETWEEN 0 AND 23),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE, -- null for member-only
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
  channel notification_channel NOT NULL,
  type TEXT NOT NULL,
  subject TEXT,
  content TEXT,
  status notification_status NOT NULL DEFAULT 'pending',
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reactivation sequences (tracks active sequences per member)
CREATE TABLE reactivation_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  current_step INTEGER DEFAULT 1,
  current_step_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancelled_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_active_sequence_per_member UNIQUE (tenant_id, member_id, current_step)
);

-- Stripe webhook events (for idempotency)
CREATE TABLE stripe_events (
  id TEXT PRIMARY KEY, -- Stripe event ID
  type TEXT NOT NULL,
  processed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Dashboard alerts
CREATE TABLE dashboard_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'reactivation', 'payment', 'member_limit', etc.
  title TEXT NOT NULL,
  message TEXT,
  action_url TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

-- Tenants
CREATE INDEX idx_tenants_slug ON tenants(slug);
CREATE INDEX idx_tenants_plan_status ON tenants(plan_status);
CREATE INDEX idx_tenants_auth_user ON tenants(auth_user_id) WHERE deleted_at IS NULL;

-- Members
CREATE INDEX idx_members_tenant ON members(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_members_email ON members(email);
CREATE INDEX idx_members_status ON members(status);
CREATE INDEX idx_members_tier ON members(tier);
CREATE INDEX idx_members_last_visit ON members(last_visit_at) WHERE status = 'active';
CREATE INDEX idx_members_inactive ON members(tenant_id, last_visit_at) 
  WHERE status = 'active' AND deleted_at IS NULL;

-- Transactions
CREATE INDEX idx_transactions_member ON transactions(member_id);
CREATE INDEX idx_transactions_tenant ON transactions(tenant_id);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_created ON transactions(created_at DESC);

-- Rewards
CREATE INDEX idx_rewards_tenant ON rewards(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_rewards_active ON rewards(tenant_id, is_active) WHERE deleted_at IS NULL;

-- Redemptions
CREATE INDEX idx_redemptions_tenant ON redemptions(tenant_id);
CREATE INDEX idx_redemptions_member ON redemptions(member_id);
CREATE INDEX idx_redemptions_qr ON redemptions(qr_code);
CREATE INDEX idx_redemptions_code ON redemptions(alphanumeric_code);
CREATE INDEX idx_redemptions_status ON redemptions(status);
CREATE INDEX idx_redemptions_expires ON redemptions(expires_at) WHERE status = 'pending';

-- Campaigns
CREATE INDEX idx_campaigns_tenant ON campaigns(tenant_id);
CREATE INDEX idx_campaigns_status ON campaigns(status);

-- Visits
CREATE INDEX idx_visits_tenant ON visits(tenant_id);
CREATE INDEX idx_visits_member ON visits(member_id);
CREATE INDEX idx_visits_time ON visits(created_at DESC);

-- Notifications
CREATE INDEX idx_notifications_member ON notifications(member_id);
CREATE INDEX idx_notifications_status ON notifications(status);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);

-- Reactivation sequences
CREATE INDEX idx_reactivation_tenant ON reactivation_sequences(tenant_id);
CREATE INDEX idx_reactivation_member ON reactivation_sequences(member_id);
CREATE INDEX idx_reactivation_active ON reactivation_sequences(tenant_id) 
  WHERE completed_at IS NULL AND cancelled_at IS NULL;

-- ============================================
-- FUNCTIONS
-- ============================================

-- Calculate tier based on lifetime points
CREATE OR REPLACE FUNCTION calculate_tier(points_lifetime INTEGER)
RETURNS member_tier AS $$
BEGIN
  IF points_lifetime >= 10000 THEN
    RETURN 'platinum';
  ELSIF points_lifetime >= 5000 THEN
    RETURN 'gold';
  ELSIF points_lifetime >= 1000 THEN
    RETURN 'silver';
  ELSE
    RETURN 'bronze';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Get points needed for next tier
CREATE OR REPLACE FUNCTION points_for_next_tier(points_lifetime INTEGER)
RETURNS INTEGER AS $$
BEGIN
  IF points_lifetime >= 10000 THEN
    RETURN NULL; -- Already max tier
  ELSIF points_lifetime >= 5000 THEN
    RETURN 10000 - points_lifetime;
  ELSIF points_lifetime >= 1000 THEN
    RETURN 5000 - points_lifetime;
  ELSE
    RETURN 1000 - points_lifetime;
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Generate unique member code for a tenant
CREATE OR REPLACE FUNCTION generate_member_code(tenant_slug TEXT)
RETURNS TEXT AS $$
DECLARE
  new_code TEXT;
  suffix INTEGER;
  max_attempts INTEGER := 100;
  attempt INTEGER := 0;
BEGIN
  LOOP
    suffix := FLOOR(RANDOM() * 100000)::INTEGER;
    new_code := UPPER(tenant_slug) || '-' || LPAD(suffix::TEXT, 5, '0');
    
    -- Check if code already exists
    IF NOT EXISTS (SELECT 1 FROM members WHERE member_code = new_code) THEN
      RETURN new_code;
    END IF;
    
    attempt := attempt + 1;
    IF attempt >= max_attempts THEN
      -- Fallback: use UUID suffix
      new_code := UPPER(tenant_slug) || '-' || SUBSTRING(gen_random_uuid()::TEXT FROM 1 FOR 5);
      RETURN new_code;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Generate unique QR code
CREATE OR REPLACE FUNCTION generate_redemption_codes()
RETURNS TABLE(qr_code TEXT, alphanumeric TEXT) AS $$
BEGIN
  qr_code := 'RDM-' || LOWER(gen_random_uuid()::TEXT);
  alphanumeric := UPPER(SUBSTRING(gen_random_uuid()::TEXT FROM 1 FOR 6));
END;
$$ LANGUAGE plpgsql;

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Check if member can redeem reward
CREATE OR REPLACE FUNCTION can_redeem_reward(
  p_member_id UUID,
  p_reward_id UUID
)
RETURNS TABLE(can_redeem BOOLEAN, reason TEXT, points_required INTEGER, current_balance INTEGER) AS $$
DECLARE
  v_member RECORD;
  v_reward RECORD;
  v_existing_pending INTEGER;
BEGIN
  -- Get member info
  SELECT points_balance, status, tenant_id INTO v_member
  FROM members WHERE id = p_member_id;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Member not found'::TEXT, NULL, NULL;
    RETURN;
  END IF;
  
  IF v_member.status = 'blocked' THEN
    RETURN QUERY SELECT false, 'Member is blocked'::TEXT, NULL, v_member.points_balance;
    RETURN;
  END IF;
  
  -- Get reward info
  SELECT points_required, is_active, max_redemptions, redemption_count, tenant_id, valid_until
  INTO v_reward
  FROM rewards WHERE id = p_reward_id;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Reward not found'::TEXT, NULL, v_member.points_balance;
    RETURN;
  END IF;
  
  IF v_member.tenant_id != v_reward.tenant_id THEN
    RETURN QUERY SELECT false, 'Reward belongs to different business'::TEXT, v_reward.points_required, v_member.points_balance;
    RETURN;
  END IF;
  
  IF NOT v_reward.is_active THEN
    RETURN QUERY SELECT false, 'Reward is no longer available'::TEXT, v_reward.points_required, v_member.points_balance;
    RETURN;
  END IF;
  
  IF v_reward.valid_until IS NOT NULL AND v_reward.valid_until < NOW() THEN
    RETURN QUERY SELECT false, 'Reward has expired'::TEXT, v_reward.points_required, v_member.points_balance;
    RETURN;
  END IF;
  
  IF v_reward.max_redemptions IS NOT NULL AND v_reward.redemption_count >= v_reward.max_redemptions THEN
    RETURN QUERY SELECT false, 'Reward limit reached'::TEXT, v_reward.points_required, v_member.points_balance;
    RETURN;
  END IF;
  
  IF v_member.points_balance < v_reward.points_required THEN
    RETURN QUERY SELECT false, 
      ('You need ' || (v_reward.points_required - v_member.points_balance) || ' more points')::TEXT,
      v_reward.points_required, 
      v_member.points_balance;
    RETURN;
  END IF;
  
  -- Check for existing pending redemption for same reward
  SELECT COUNT(*) INTO v_existing_pending
  FROM redemptions
  WHERE member_id = p_member_id 
    AND reward_id = p_reward_id 
    AND status = 'pending'
    AND expires_at > NOW();
  
  IF v_existing_pending > 0 THEN
    RETURN QUERY SELECT false, 'You already have a pending redemption for this reward'::TEXT, v_reward.points_required, v_member.points_balance;
    RETURN;
  END IF;
  
  RETURN QUERY SELECT true, 'Can redeem'::TEXT, v_reward.points_required, v_member.points_balance;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-update updated_at
CREATE TRIGGER update_tenants_updated_at
  BEFORE UPDATE ON tenants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_members_updated_at
  BEFORE UPDATE ON members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_rewards_updated_at
  BEFORE UPDATE ON rewards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_campaigns_updated_at
  BEFORE UPDATE ON campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-calculate member tier on points change
CREATE OR REPLACE FUNCTION recalculate_member_tier()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_TABLE_NAME = 'transactions' AND NEW.member_id IS NOT NULL THEN
    UPDATE members
    SET tier = calculate_tier(points_lifetime)
    WHERE id = NEW.member_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_tier_calculation
  AFTER INSERT ON transactions
  FOR EACH ROW EXECUTE FUNCTION recalculate_member_tier();

-- Increment reward redemption count
CREATE OR REPLACE FUNCTION increment_redemption_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'used' AND OLD.status = 'pending' THEN
    UPDATE rewards
    SET redemption_count = redemption_count + 1
    WHERE id = NEW.reward_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_redemption_count
  AFTER UPDATE ON redemptions
  FOR EACH ROW EXECUTE FUNCTION increment_redemption_count();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on all tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE reactivation_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_alerts ENABLE ROW LEVEL SECURITY;

-- Tenants: tenants see only their own data
CREATE POLICY tenants_select_own ON tenants
  FOR SELECT USING (id = auth_tenant_id());

CREATE POLICY tenants_update_own ON tenants
  FOR UPDATE USING (id = auth_tenant_id());

-- Note: INSERT is handled via service role (signup flow)

-- Members: can be viewed by tenant staff OR by the member themselves
CREATE POLICY members_select_tenant ON members
  FOR SELECT USING (tenant_id = auth_tenant_id());

CREATE POLICY members_insert_tenant ON members
  FOR INSERT WITH CHECK (tenant_id = auth_tenant_id());

CREATE POLICY members_update_tenant ON members
  FOR UPDATE USING (tenant_id = auth_tenant_id());

-- Member self-access via auth (for PWA)
CREATE POLICY members_select_self ON members
  FOR SELECT USING (id = auth_member_id());

CREATE POLICY members_update_self ON members
  FOR UPDATE USING (id = auth_member_id());

-- Transactions: filtered by tenant_id
CREATE POLICY transactions_select_own ON transactions
  FOR SELECT USING (tenant_id = auth_tenant_id());

CREATE POLICY transactions_insert_own ON transactions
  FOR INSERT WITH CHECK (tenant_id = auth_tenant_id());

-- Member can see their own transactions
CREATE POLICY transactions_select_member ON transactions
  FOR SELECT USING (
    member_id = auth_member_id() OR
    tenant_id = auth_tenant_id()
  );

-- Rewards: filtered by tenant_id
CREATE POLICY rewards_select_own ON rewards
  FOR SELECT USING (tenant_id = auth_tenant_id());

CREATE POLICY rewards_insert_own ON rewards
  FOR INSERT WITH CHECK (tenant_id = auth_tenant_id());

CREATE POLICY rewards_update_own ON rewards
  FOR UPDATE USING (tenant_id = auth_tenant_id());

-- Redemptions: filtered by tenant_id
CREATE POLICY redemptions_select_tenant ON redemptions
  FOR SELECT USING (tenant_id = auth_tenant_id());

CREATE POLICY redemptions_insert_own ON redemptions
  FOR INSERT WITH CHECK (tenant_id = auth_tenant_id());

CREATE POLICY redemptions_update_own ON redemptions
  FOR UPDATE USING (tenant_id = auth_tenant_id());

-- Member can see their own redemptions
CREATE POLICY redemptions_select_member ON redemptions
  FOR SELECT USING (member_id = auth_member_id());

-- Campaigns: filtered by tenant_id
CREATE POLICY campaigns_select_own ON campaigns
  FOR SELECT USING (tenant_id = auth_tenant_id());

CREATE POLICY campaigns_insert_own ON campaigns
  FOR INSERT WITH CHECK (tenant_id = auth_tenant_id());

CREATE POLICY campaigns_update_own ON campaigns
  FOR UPDATE USING (tenant_id = auth_tenant_id());

-- Visits: filtered by tenant_id
CREATE POLICY visits_select_own ON visits
  FOR SELECT USING (tenant_id = auth_tenant_id());

CREATE POLICY visits_insert_own ON visits
  FOR INSERT WITH CHECK (tenant_id = auth_tenant_id());

-- Member can see their own visits
CREATE POLICY visits_select_member ON visits
  FOR SELECT USING (member_id = auth_member_id());

-- Notifications: filtered by tenant_id or member_id
CREATE POLICY notifications_select_tenant ON notifications
  FOR SELECT USING (tenant_id = auth_tenant_id());

CREATE POLICY notifications_select_member ON notifications
  FOR SELECT USING (member_id = auth_member_id());

CREATE POLICY notifications_insert_own ON notifications
  FOR INSERT WITH CHECK (
    tenant_id = auth_tenant_id() OR 
    member_id = auth_member_id()
  );

-- Reactivation sequences: filtered by tenant_id
CREATE POLICY reactivation_select_own ON reactivation_sequences
  FOR SELECT USING (tenant_id = auth_tenant_id());

CREATE POLICY reactivation_insert_own ON reactivation_sequences
  FOR INSERT WITH CHECK (tenant_id = auth_tenant_id());

CREATE POLICY reactivation_update_own ON reactivation_sequences
  FOR UPDATE USING (tenant_id = auth_tenant_id());

-- Dashboard alerts: filtered by tenant_id
CREATE POLICY alerts_select_own ON dashboard_alerts
  FOR SELECT USING (tenant_id = auth_tenant_id());

CREATE POLICY alerts_insert_own ON dashboard_alerts
  FOR INSERT WITH CHECK (tenant_id = auth_tenant_id());

CREATE POLICY alerts_update_own ON dashboard_alerts
  FOR UPDATE USING (tenant_id = auth_tenant_id());

-- ============================================
-- pg_cron JOBS (manual setup after migration)
-- ============================================

-- Note: These are commented out as pg_cron must be enabled per-database
-- Run these manually or via supabase/config.toml:

-- SELECT cron.schedule('expire-old-points', '0 0 1 * *', $$
--   SELECT expire_old_points();
-- $$);

-- SELECT cron.schedule('process-reactivation-steps', '0 9 * * *', $$
--   SELECT process_reactivation_emails();
-- $$);

-- ============================================
-- SEED DATA (optional, for testing)
-- ============================================

-- Uncomment to seed demo tenant:
-- INSERT INTO tenants (business_name, business_type, slug, plan, plan_status, trial_ends_at)
-- VALUES ('Demo Spa', 'spa', 'demo-spa', 'starter', 'active', NOW() + INTERVAL '14 days');
