-- ─────────────────────────────────────────────────────────────────────────────
-- 20260408000011_feature_trials.sql
-- Feature trial system for Starter tenants (gamification + heatmap, 45 days)
-- One trial per feature per tenant — non-renewable (unique constraint)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS feature_trials (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  feature_name  TEXT        NOT NULL CHECK (feature_name IN ('gamification', 'heatmap')),
  trial_start   TIMESTAMPTZ NOT NULL DEFAULT now(),
  trial_end     TIMESTAMPTZ NOT NULL GENERATED ALWAYS AS (trial_start + INTERVAL '45 days') STORED,
  status        TEXT        NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'converted')),
  activated_by  UUID        REFERENCES auth.users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, feature_name)
);

-- ─── Indexes ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS feature_trials_tenant_id_idx ON feature_trials(tenant_id);
CREATE INDEX IF NOT EXISTS feature_trials_status_idx    ON feature_trials(status);

-- ─── RLS ──────────────────────────────────────────────────────────────────────
ALTER TABLE feature_trials ENABLE ROW LEVEL SECURITY;

-- Tenants can read their own trials
CREATE POLICY "Tenant reads own feature trials"
  ON feature_trials FOR SELECT
  TO authenticated
  USING (tenant_id = current_tenant_id());

-- Only service role can INSERT / UPDATE (admin activates via API)
-- No INSERT/UPDATE policies for authenticated role

-- ─── Auto-expire via pg_cron ──────────────────────────────────────────────────
-- Runs daily at 02:00 UTC, marks trials as expired when trial_end has passed
SELECT cron.schedule(
  'expire-feature-trials',
  '0 2 * * *',
  $$
    UPDATE feature_trials
    SET status = 'expired'
    WHERE status = 'active'
      AND trial_end < now();
  $$
);
