-- Schedule automated jobs: points expiration + birthday bonus
-- Requires pg_cron and pg_net extensions (enabled by default on Supabase Pro+).
--
-- IMPORTANT: Replace the placeholders before running:
--   - YOUR_PROJECT_REF → your Supabase project reference (e.g. "abcdefghijklmnop")
--   - YOUR_CRON_SECRET → the value of CRON_SECRET in your Edge Function env vars
--
-- The project ref is visible in: Settings → API → Project URL
-- The CRON_SECRET is set in: Settings → Edge Functions → Secrets

-- Job 1: Expire stale points daily at 00:05 UTC
SELECT cron.schedule(
  'expire-points-daily',
  '5 0 * * *',
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/expire-points',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_CRON_SECRET"}',
    body := '{"trigger": "cron"}'
  );
  $$
);

-- Job 2: Send birthday bonus daily at 09:00 UTC
SELECT cron.schedule(
  'birthday-bonus-daily',
  '0 9 * * *',
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/birthday-bonus',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_CRON_SECRET"}',
    body := '{"trigger": "cron"}'
  );
  $$
);

-- Verify jobs were created:
-- SELECT jobname, schedule, active FROM cron.job WHERE jobname IN ('expire-points-daily', 'birthday-bonus-daily');

-- To unschedule:
-- SELECT cron.unschedule('expire-points-daily');
-- SELECT cron.unschedule('birthday-bonus-daily');
