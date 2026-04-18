-- Schedule reward-available-notification edge function every 15 minutes
-- Replace YOUR_PROJECT_REF and YOUR_CRON_SECRET before applying.

SELECT cron.schedule(
  'reward-available-15min',
  '*/15 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/reward-available-notification',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_CRON_SECRET"}',
    body := '{"trigger": "cron"}'
  );
  $$
);

-- Verify:
-- SELECT jobname, schedule, active FROM cron.job WHERE jobname = 'reward-available-15min';

-- To unschedule:
-- SELECT cron.unschedule('reward-available-15min');
