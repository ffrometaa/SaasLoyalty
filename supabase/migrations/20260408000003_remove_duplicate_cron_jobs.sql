-- Remove duplicate cron jobs left over from earlier migrations.
-- The canonical names are the loyalty-os-* variants; the enterprise-* variants
-- are identical duplicates and cause each job to run twice per schedule.

SELECT cron.unschedule('enterprise-scoring-run');
SELECT cron.unschedule('enterprise-leaderboard-weekly');
SELECT cron.unschedule('enterprise-leaderboard-monthly');

-- Active jobs after cleanup:
-- loyalty-os-scoring-engine-6h    → 0 */6 * * *
-- loyalty-os-leaderboard-weekly   → 0 3 * * 1
-- loyalty-os-leaderboard-monthly  → 0 4 1 * *
-- loyalty-os-reactivation-daily   → 0 8 * * *
-- expire-points-daily             → 5 0 * * *
-- birthday-bonus-daily            → 0 9 * * *
