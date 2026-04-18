-- DB trigger: fire points-earned-notification and referral-reward-notification
-- via pg_net after INSERT on transactions (fire-and-forget).
-- Replace YOUR_PROJECT_REF and YOUR_CRON_SECRET before applying.

CREATE OR REPLACE FUNCTION fn_notify_transaction_push_email()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  BEGIN
    IF NEW.type = 'earn' THEN
      PERFORM net.http_post(
        url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/points-earned-notification',
        headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_CRON_SECRET"}',
        body := json_build_object(
          'transaction_id', NEW.id,
          'member_id', NEW.member_id,
          'tenant_id', NEW.tenant_id,
          'points_earned', NEW.points,
          'balance_after', NEW.balance_after
        )::text
      );
    ELSIF NEW.type = 'referral' AND NEW.reference_id IS NOT NULL THEN
      PERFORM net.http_post(
        url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/referral-reward-notification',
        headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_CRON_SECRET"}',
        body := json_build_object(
          'transaction_id', NEW.id,
          'member_id', NEW.member_id,
          'tenant_id', NEW.tenant_id,
          'points_earned', NEW.points,
          'balance_after', NEW.balance_after,
          'reference_id', NEW.reference_id
        )::text
      );
    END IF;
  EXCEPTION WHEN OTHERS THEN
    NULL; -- fire-and-forget: never block the transaction
  END;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_transaction_push_email ON transactions;

CREATE TRIGGER trg_transaction_push_email
  AFTER INSERT ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION fn_notify_transaction_push_email();

-- Verify:
-- SELECT trigger_name, event_manipulation, action_statement FROM information_schema.triggers WHERE trigger_name = 'trg_transaction_push_email';
