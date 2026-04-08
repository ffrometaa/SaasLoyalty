-- Referral Reward Trigger
-- Fires AFTER UPDATE on members when visits_total changes 0 → 1 (first visit).
-- Awards referral bonus points to both referee and referrer if:
--   1. member has referred_by (was referred by someone)
--   2. tenant has referral_enabled = true
--   3. Both members belong to the same tenant

CREATE OR REPLACE FUNCTION fn_referral_reward()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_tenant           RECORD;
  v_referrer_balance INTEGER;
  v_referee_balance  INTEGER;
BEGIN
  -- Only fire on first visit (0 → 1)
  IF OLD.visits_total <> 0 OR NEW.visits_total < 1 THEN
    RETURN NEW;
  END IF;

  -- Must have a referrer
  IF NEW.referred_by IS NULL THEN
    RETURN NEW;
  END IF;

  -- Load tenant referral config
  SELECT referral_enabled, referral_points_referrer, referral_points_referee
    INTO v_tenant
    FROM tenants
   WHERE id = NEW.tenant_id;

  IF NOT FOUND OR NOT v_tenant.referral_enabled THEN
    RETURN NEW;
  END IF;

  -- Skip if points are zero (misconfigured tenant)
  IF v_tenant.referral_points_referrer = 0 AND v_tenant.referral_points_referee = 0 THEN
    RETURN NEW;
  END IF;

  -- ── Award referee (the new member, NEW.id) ───────────────────────────────

  IF v_tenant.referral_points_referee > 0 THEN
    v_referee_balance := NEW.points_balance + v_tenant.referral_points_referee;

    INSERT INTO transactions (tenant_id, member_id, type, points, balance_after, description)
    VALUES (
      NEW.tenant_id,
      NEW.id,
      'referral',
      v_tenant.referral_points_referee,
      v_referee_balance,
      'Referral bonus — welcome reward'
    );

    UPDATE members
      SET points_balance  = v_referee_balance,
          points_lifetime = points_lifetime + v_tenant.referral_points_referee,
          updated_at      = now()
    WHERE id = NEW.id;

    -- Reflect in NEW so subsequent logic sees updated balance
    NEW.points_balance  := v_referee_balance;
    NEW.points_lifetime := NEW.points_lifetime + v_tenant.referral_points_referee;
  END IF;

  -- ── Award referrer ───────────────────────────────────────────────────────

  IF v_tenant.referral_points_referrer > 0 THEN
    SELECT points_balance INTO v_referrer_balance
      FROM members
     WHERE id = NEW.referred_by AND tenant_id = NEW.tenant_id;

    IF FOUND THEN
      v_referrer_balance := v_referrer_balance + v_tenant.referral_points_referrer;

      INSERT INTO transactions (tenant_id, member_id, type, points, balance_after, description, reference_id)
      VALUES (
        NEW.tenant_id,
        NEW.referred_by,
        'referral',
        v_tenant.referral_points_referrer,
        v_referrer_balance,
        'Referral bonus — your referral just visited!',
        NEW.id::TEXT
      );

      UPDATE members
        SET points_balance  = v_referrer_balance,
            points_lifetime = points_lifetime + v_tenant.referral_points_referrer,
            updated_at      = now()
      WHERE id = NEW.referred_by;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_referral_reward ON members;

CREATE TRIGGER trg_referral_reward
  AFTER UPDATE OF visits_total ON members
  FOR EACH ROW
  WHEN (OLD.visits_total = 0 AND NEW.visits_total >= 1 AND NEW.referred_by IS NOT NULL)
  EXECUTE FUNCTION fn_referral_reward();

COMMENT ON FUNCTION fn_referral_reward IS
  'Awards referral bonus points to both referrer and referee when the referred member '
  'makes their first visit. Only fires when tenant.referral_enabled = true.';
