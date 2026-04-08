-- Automatic tier upgrade trigger
-- Fires after any UPDATE on members that changes points_lifetime.
-- Computes the correct tier from lifetime points and updates the column if it changed.
-- Thresholds match TIER_THRESHOLDS in packages/db/src/types.ts:
--   bronze: 0 | silver: 1000 | gold: 5000 | platinum: 10000

CREATE OR REPLACE FUNCTION fn_auto_tier_upgrade()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_new_tier member_tier;
BEGIN
  -- Compute tier from new points_lifetime
  v_new_tier := CASE
    WHEN NEW.points_lifetime >= 10000 THEN 'platinum'::member_tier
    WHEN NEW.points_lifetime >=  5000 THEN 'gold'::member_tier
    WHEN NEW.points_lifetime >=  1000 THEN 'silver'::member_tier
    ELSE 'bronze'::member_tier
  END;

  -- Only update if tier actually changed (avoid infinite loops and no-op writes)
  IF v_new_tier <> OLD.tier THEN
    NEW.tier := v_new_tier;
    NEW.updated_at := now();
  END IF;

  RETURN NEW;
END;
$$;

-- Drop existing trigger if re-running migration
DROP TRIGGER IF EXISTS trg_auto_tier_upgrade ON members;

CREATE TRIGGER trg_auto_tier_upgrade
  BEFORE UPDATE OF points_lifetime ON members
  FOR EACH ROW
  WHEN (NEW.points_lifetime IS DISTINCT FROM OLD.points_lifetime)
  EXECUTE FUNCTION fn_auto_tier_upgrade();

COMMENT ON FUNCTION fn_auto_tier_upgrade IS
  'Automatically upgrades member tier when points_lifetime crosses a threshold. '
  'Thresholds: silver=1000, gold=5000, platinum=10000.';
