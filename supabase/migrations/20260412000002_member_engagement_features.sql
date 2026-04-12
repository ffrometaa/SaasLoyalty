-- Member Engagement Features
-- Points per visit (configurable, min 15, enable/disable)
-- Welcome bonus
-- Google Review reward
-- (Referral columns already exist from migration 20260408000007)

ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS points_per_visit_enabled BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS points_per_visit         INTEGER  NOT NULL DEFAULT 15,
  ADD COLUMN IF NOT EXISTS welcome_bonus_enabled    BOOLEAN  NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS welcome_bonus_points     INTEGER  NOT NULL DEFAULT 50,
  ADD COLUMN IF NOT EXISTS google_review_url        TEXT,
  ADD COLUMN IF NOT EXISTS google_review_bonus_enabled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS google_review_bonus_points  INTEGER  NOT NULL DEFAULT 100;

ALTER TABLE public.tenants
  DROP CONSTRAINT IF EXISTS tenants_points_per_visit_min;
ALTER TABLE public.tenants
  ADD CONSTRAINT tenants_points_per_visit_min CHECK (points_per_visit >= 15);

-- Track per-member google review claim (one per tenant)
ALTER TABLE public.members
  ADD COLUMN IF NOT EXISTS google_review_claimed_at TIMESTAMPTZ;

-- Expose referral_code in members to the member app via RLS
-- (referral_code column already added in 20260408000007)
