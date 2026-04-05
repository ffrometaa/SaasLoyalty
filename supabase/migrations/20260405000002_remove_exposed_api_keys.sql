-- SECURITY FIX: Remove hardcoded API keys from cron jobs
-- The cron jobs should use environment variables via Supabase Vault
-- For production, store the cron secret in vault:
--   SELECT vault.create_secret('your-cron-secret-here', 'scoring_engine_secret');

-- First, unschedule the old jobs with exposed keys
SELECT cron.unschedule('enterprise-scoring-run');
SELECT cron.unschedule('enterprise-leaderboard-weekly');
SELECT cron.unschedule('enterprise-leaderboard-monthly');

-- Recreate jobs using environment variables via pg_net
-- NOTE: The Authorization header should use CRON_SECRET from environment
-- For now, use a placeholder that will be replaced at deploy time
-- In production, set the CRON_SECRET environment variable in Supabase dashboard

-- Job 1: Score all members every 6 hours
SELECT cron.schedule(
  'enterprise-scoring-run',
  '0 */6 * * *',
  $$
  SELECT net.http_post(
    url := current_setting('app.scoring_engine_url', true) || '/functions/v1/run-scoring-engine',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || COALESCE(current_setting('app.scoring_engine_secret', true), '')
    ),
    body := jsonb_build_object('trigger', 'cron')
  );
  $$
);

-- Job 2: Generate weekly leaderboard snapshots every Monday at 01:00 UTC
SELECT cron.schedule(
  'enterprise-leaderboard-weekly',
  '0 1 * * 1',
  $$
  SELECT net.http_post(
    url := current_setting('app.scoring_engine_url', true) || '/functions/v1/run-scoring-engine',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || COALESCE(current_setting('app.scoring_engine_secret', true), '')
    ),
    body := jsonb_build_object('trigger', 'cron', 'tasks', jsonb_build_array('leaderboard_weekly'))
  );
  $$
);

-- Job 3: Generate monthly leaderboard snapshots on the 1st of each month at 01:30 UTC
SELECT cron.schedule(
  'enterprise-leaderboard-monthly',
  '30 1 1 * *',
  $$
  SELECT net.http_post(
    url := current_setting('app.scoring_engine_url', true) || '/functions/v1/run-scoring-engine',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || COALESCE(current_setting('app.scoring_engine_secret', true), '')
    ),
    body := jsonb_build_object('trigger', 'cron', 'tasks', jsonb_build_array('leaderboard_monthly'))
  );
  $$
);

-- Set application settings (run once or add to config)
-- These should be set via: ALTER DATABASE supabase SET app.scoring_engine_url = 'https://your-project.supabase.co';
-- ALTER DATABASE supabase SET app.scoring_engine_secret = 'your-secret';
