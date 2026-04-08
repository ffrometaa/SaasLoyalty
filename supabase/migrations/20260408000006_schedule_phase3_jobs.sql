-- Phase 3 automated jobs: at-risk notifications, points-expiring alert, weekly summary
-- Replace YOUR_PROJECT_REF and YOUR_CRON_SECRET before running.

-- Job 3: Deliver at-risk interventions — weekly, Sunday 22:00 UTC
SELECT cron.schedule(
  'at-risk-notifications-weekly',
  '0 22 * * 0',
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/at-risk-notifications',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_CRON_SECRET"}',
    body := '{"trigger": "cron"}'
  );
  $$
);

-- Job 4: Points-expiring alert — monthly, 1st of month at 10:00 UTC
SELECT cron.schedule(
  'points-expiring-alert-monthly',
  '0 10 1 * *',
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/points-expiring-alert',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_CRON_SECRET"}',
    body := '{"trigger": "cron"}'
  );
  $$
);

-- Job 5: Weekly tenant summary — every Monday at 08:00 UTC
SELECT cron.schedule(
  'weekly-tenant-summary',
  '0 8 * * 1',
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/weekly-tenant-summary',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_CRON_SECRET"}',
    body := '{"trigger": "cron"}'
  );
  $$
);

-- Verify:
-- SELECT jobname, schedule, active FROM cron.job
-- WHERE jobname IN ('at-risk-notifications-weekly', 'points-expiring-alert-monthly', 'weekly-tenant-summary');
