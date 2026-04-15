-- ─────────────────────────────────────────────────────────────────────────────
-- mrr_snapshots: daily MRR snapshot for historical NRR and trend tracking.
--
-- Populated by the pg_cron job below (daily at 00:05 UTC).
-- NRR = (mrr_total[month N] / mrr_total[month N-1]) × 100
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS mrr_snapshots (
  id               UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  snapshot_date    DATE        NOT NULL UNIQUE,
  mrr_total        INTEGER     NOT NULL DEFAULT 0,
  active_tenants   INTEGER     NOT NULL DEFAULT 0,
  new_tenants      INTEGER     NOT NULL DEFAULT 0,   -- activated that day
  churned_tenants  INTEGER     NOT NULL DEFAULT 0,   -- canceled that day
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Service role only — no tenant should read financial aggregates
ALTER TABLE mrr_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY mrr_snapshots_service_only ON mrr_snapshots USING (false);

-- ─── Helper: plan → monthly price ────────────────────────────────────────────
CREATE OR REPLACE FUNCTION plan_mrr_cents(p TEXT)
RETURNS INTEGER LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE p
    WHEN 'starter'    THEN 9900
    WHEN 'pro'        THEN 39900
    WHEN 'scale'      THEN 59900
    WHEN 'enterprise' THEN 0
    ELSE 0
  END;
$$;

-- ─── Snapshot function ────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION take_mrr_snapshot()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_mrr           INTEGER;
  v_active        INTEGER;
  v_new           INTEGER;
  v_churned       INTEGER;
  v_today         DATE := CURRENT_DATE;
  v_yesterday     TIMESTAMPTZ := date_trunc('day', now()) - INTERVAL '1 day';
BEGIN
  SELECT
    COALESCE(SUM(plan_mrr_cents(plan)) / 100, 0),
    COUNT(*) FILTER (WHERE plan_status = 'active'),
    COUNT(*) FILTER (WHERE plan_status = 'active'   AND updated_at >= v_yesterday),
    COUNT(*) FILTER (WHERE plan_status = 'canceled' AND updated_at >= v_yesterday)
  INTO v_mrr, v_active, v_new, v_churned
  FROM tenants
  WHERE deleted_at IS NULL;

  INSERT INTO mrr_snapshots (snapshot_date, mrr_total, active_tenants, new_tenants, churned_tenants)
  VALUES (v_today, v_mrr, v_active, v_new, v_churned)
  ON CONFLICT (snapshot_date) DO UPDATE SET
    mrr_total       = EXCLUDED.mrr_total,
    active_tenants  = EXCLUDED.active_tenants,
    new_tenants     = EXCLUDED.new_tenants,
    churned_tenants = EXCLUDED.churned_tenants;
END;
$$;

-- ─── pg_cron: daily at 00:05 UTC ─────────────────────────────────────────────
SELECT cron.schedule(
  'mrr-daily-snapshot',
  '5 0 * * *',
  'SELECT take_mrr_snapshot()'
);

-- Take first snapshot immediately on migration run
SELECT take_mrr_snapshot();
