-- Referral Program: Phase 3
-- Adds referral_code + referred_by to members
-- Adds referral_enabled + referral_points_* to tenants
-- Auto-generates referral codes on member INSERT
-- Existing members get codes via UPDATE

-- ── Tenants: referral config ─────────────────────────────────────────────────

ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS referral_enabled         BOOLEAN     NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS referral_points_referrer INTEGER     NOT NULL DEFAULT 50,
  ADD COLUMN IF NOT EXISTS referral_points_referee  INTEGER     NOT NULL DEFAULT 50;

-- ── Members: referral columns ────────────────────────────────────────────────

ALTER TABLE members
  ADD COLUMN IF NOT EXISTS referral_code TEXT        UNIQUE,
  ADD COLUMN IF NOT EXISTS referred_by   UUID        REFERENCES members(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_members_referral_code ON members (referral_code);
CREATE INDEX IF NOT EXISTS idx_members_referred_by   ON members (referred_by);

-- ── Helper: generate a unique 8-char referral code ───────────────────────────

CREATE OR REPLACE FUNCTION generate_member_referral_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  code  TEXT;
  i     INT;
BEGIN
  LOOP
    code := '';
    FOR i IN 1..8 LOOP
      code := code || substr(chars, floor(random() * length(chars) + 1)::INT, 1);
    END LOOP;
    -- Retry if collision (extremely rare)
    EXIT WHEN NOT EXISTS (SELECT 1 FROM members WHERE referral_code = code);
  END LOOP;
  RETURN code;
END;
$$;

-- ── Trigger: auto-set referral_code on INSERT ────────────────────────────────

CREATE OR REPLACE FUNCTION fn_set_referral_code()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := generate_member_referral_code();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_referral_code ON members;

CREATE TRIGGER trg_set_referral_code
  BEFORE INSERT ON members
  FOR EACH ROW
  EXECUTE FUNCTION fn_set_referral_code();

-- ── Backfill: assign referral codes to existing members ──────────────────────

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT id FROM members WHERE referral_code IS NULL LOOP
    UPDATE members
      SET referral_code = generate_member_referral_code()
    WHERE id = r.id;
  END LOOP;
END;
$$;

-- ── Verify ───────────────────────────────────────────────────────────────────
-- SELECT COUNT(*) FROM members WHERE referral_code IS NULL; -- should be 0
-- SELECT referral_enabled, referral_points_referrer, referral_points_referee FROM tenants LIMIT 3;
