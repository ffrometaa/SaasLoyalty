ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS setup_wizard_completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS setup_wizard_dismissed_at TIMESTAMPTZ;
