-- Schedule automated jobs: points expiration + birthday bonus
-- Requires pg_cron and pg_net extensions (enabled by default on Supabase Pro+).
--
-- Before running, set app settings once:
--   ALTER DATABASE postgres SET "app.supabase_url" = 'https://YOUR_PROJECT_REF.supabase.co';
--   ALTER DATABASE postgres SET "app.cron_secret" = 'YOUR_CRON_SECRET';
--
-- Both values are also available in the Supabase dashboard under Settings → API.

-- Job 1: Expire stale points daily at 00:05 UTC
SELECT cron.schedule(
  'expire-points-daily',
  '5 0 * * *',
  $$
  SELECT net.http_post(
    url := current_setting('app.supabase_url', true) || '/functions/v1/expire-points',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || COALESCE(current_setting('app.cron_secret', true), '')
    ),
    body := jsonb_build_object('trigger', 'cron')
  );
  $$
);

-- Job 2: Send birthday bonus daily at 09:00 UTC
SELECT cron.schedule(
  'birthday-bonus-daily',
  '0 9 * * *',
  $$
  SELECT net.http_post(
    url := current_setting('app.supabase_url', true) || '/functions/v1/birthday-bonus',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || COALESCE(current_setting('app.cron_secret', true), '')
    ),
    body := jsonb_build_object('trigger', 'cron')
  );
  $$
);

-- To verify jobs were created:
-- SELECT jobname, schedule, active FROM cron.job WHERE jobname IN ('expire-points-daily', 'birthday-bonus-daily');

-- To unschedule:
-- SELECT cron.unschedule('expire-points-daily');
-- SELECT cron.unschedule('birthday-bonus-daily');
