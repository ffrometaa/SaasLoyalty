-- Hard-delete tenants that were soft-deleted more than 30 days ago.
-- Runs daily at 03:00 UTC via pg_cron.
SELECT cron.schedule(
  'hard-delete-closed-tenants',
  '0 3 * * *',
  $$
    DELETE FROM tenants
    WHERE deleted_at IS NOT NULL
      AND deleted_at < now() - INTERVAL '30 days';
  $$
);
