-- Schedule expire-redemptions edge function daily at 02:00 UTC
-- Replace YOUR_PROJECT_REF and YOUR_CRON_SECRET before running.

SELECT cron.schedule(
  'expire-redemptions-daily',
  '0 2 * * *',
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/expire-redemptions',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_CRON_SECRET"}',
    body := '{"trigger": "cron"}'
  );
  $$
);

-- Verify:
-- SELECT jobname, schedule, active FROM cron.job WHERE jobname = 'expire-redemptions-daily';

-- To unschedule:
-- SELECT cron.unschedule('expire-redemptions-daily');
