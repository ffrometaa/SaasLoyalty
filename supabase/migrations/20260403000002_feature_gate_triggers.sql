-- Trigger: prevent inserting members beyond plan limit
CREATE OR REPLACE FUNCTION check_member_limit()
RETURNS TRIGGER AS $$
DECLARE
  current_count INTEGER;
  max_allowed   INTEGER;
BEGIN
  SELECT COUNT(*) INTO current_count
  FROM members
  WHERE tenant_id = NEW.tenant_id
    AND status = 'active';

  SELECT max_members INTO max_allowed
  FROM tenants
  WHERE id = NEW.tenant_id;

  -- null means unlimited (Scale plan)
  IF max_allowed IS NOT NULL AND current_count >= max_allowed THEN
    RAISE EXCEPTION
      'Member limit reached. Current plan allows % members. Please upgrade your subscription.',
      max_allowed;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_member_limit ON members;
CREATE TRIGGER trg_check_member_limit
  BEFORE INSERT ON members
  FOR EACH ROW
  EXECUTE FUNCTION check_member_limit();


-- Trigger: prevent creating campaigns beyond monthly limit
CREATE OR REPLACE FUNCTION check_campaign_limit()
RETURNS TRIGGER AS $$
DECLARE
  current_count INTEGER;
  max_allowed   INTEGER;
BEGIN
  SELECT COUNT(*) INTO current_count
  FROM campaigns
  WHERE tenant_id = NEW.tenant_id
    AND created_at >= DATE_TRUNC('month', NOW());

  SELECT max_campaigns_per_month INTO max_allowed
  FROM tenants
  WHERE id = NEW.tenant_id;

  IF max_allowed IS NOT NULL AND current_count >= max_allowed THEN
    RAISE EXCEPTION
      'Campaign limit reached. Your plan allows % campaigns per month.',
      max_allowed;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_campaign_limit ON campaigns;
CREATE TRIGGER trg_check_campaign_limit
  BEFORE INSERT ON campaigns
  FOR EACH ROW
  EXECUTE FUNCTION check_campaign_limit();
