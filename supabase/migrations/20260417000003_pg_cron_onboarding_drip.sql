-- Schedule onboarding-drip edge function daily at 10:30 UTC
-- Replace YOUR_PROJECT_REF and YOUR_CRON_SECRET before running.

SELECT cron.schedule(
  'onboarding-drip-daily',
  '30 10 * * *',
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/onboarding-drip',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_CRON_SECRET"}',
    body := '{"trigger": "cron"}'
  );
  $$
);

-- Verify:
-- SELECT jobname, schedule, active FROM cron.job WHERE jobname = 'onboarding-drip-daily';
