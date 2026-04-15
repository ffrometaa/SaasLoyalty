-- ─────────────────────────────────────────────────────────────────────────────
-- Extend platform_config with operational toggles and email branding config.
--
-- Toggles (maintenance_mode, registration_open, trial_enabled):
--   Stored here and readable by any server-side code. Enforcement is done at
--   the route/middleware layer that reads these values — NOT enforced via RLS.
--
-- Email config (email_from_name, email_from_address):
--   Read via getPlatformEmailConfig() helper in packages/lib/src/server.ts.
--   Route handlers that send email should call this helper instead of hardcoding.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE platform_config
  ADD COLUMN IF NOT EXISTS maintenance_mode   BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS registration_open  BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS trial_enabled      BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS email_from_name    TEXT    NOT NULL DEFAULT 'LoyaltyOS',
  ADD COLUMN IF NOT EXISTS email_from_address TEXT    NOT NULL DEFAULT 'noreply@loyalbase.dev';
