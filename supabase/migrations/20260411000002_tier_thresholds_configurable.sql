-- Make tier thresholds configurable per tenant.
-- Defaults match the previous hardcoded values so existing tenants are unaffected.
ALTER TABLE tenants
  ADD COLUMN tier_silver_threshold   INT NOT NULL DEFAULT 1000,
  ADD COLUMN tier_gold_threshold     INT NOT NULL DEFAULT 5000,
  ADD COLUMN tier_platinum_threshold INT NOT NULL DEFAULT 10000;
