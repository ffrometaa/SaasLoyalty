-- Add onboarding tracking columns to tenants table
ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS onboarding_dismissed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS onboarding_reward_shared_at TIMESTAMPTZ;
