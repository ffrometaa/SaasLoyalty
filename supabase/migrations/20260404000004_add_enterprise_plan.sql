-- Add 'enterprise' to the plan_type enum.
-- The enum was created with only ('starter', 'pro', 'scale') but enterprise
-- is a real tier used in pricing, feature gating, and admin tooling.

ALTER TYPE plan_type ADD VALUE IF NOT EXISTS 'enterprise';
