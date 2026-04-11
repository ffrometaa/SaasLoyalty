-- Founding Partner Program
-- Adds columns to tenants table to track founding partner status

ALTER TABLE tenants
  ADD COLUMN is_founding_partner BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN founding_partner_number INT CHECK (founding_partner_number >= 1 AND founding_partner_number <= 15),
  ADD COLUMN founding_trial_ends_at TIMESTAMPTZ;

-- Fast lookup for remaining spots count
CREATE INDEX idx_tenants_founding_partner ON tenants(is_founding_partner)
  WHERE is_founding_partner = true;

-- Enforce uniqueness of partner slot numbers
CREATE UNIQUE INDEX idx_tenants_founding_number ON tenants(founding_partner_number)
  WHERE founding_partner_number IS NOT NULL;
