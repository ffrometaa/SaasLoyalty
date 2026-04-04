-- ─── STEP 0: ENSURE HELPER FUNCTION EXISTS ───────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ─── STEP 1: EXTEND CAMPAIGNS TABLE ──────────────────────────────────────────
-- The campaigns table exists from initial schema but is missing several columns.

ALTER TABLE campaigns
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS subject TEXT,
  ADD COLUMN IF NOT EXISTS body TEXT,
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS cta_text TEXT,
  ADD COLUMN IF NOT EXISTS cta_url TEXT,
  ADD COLUMN IF NOT EXISTS segment TEXT,
  ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS recipients_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS delivered_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS opened_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS clicked_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS redeemed_count INTEGER NOT NULL DEFAULT 0;

-- Migrate target_segment -> segment if records exist
UPDATE campaigns SET segment = target_segment WHERE target_segment IS NOT NULL AND segment IS NULL;

-- Add 'error' to campaign_status enum if not present
DO $$ BEGIN
  ALTER TYPE campaign_status ADD VALUE IF NOT EXISTS 'error';
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Add 'inapp' to campaign_type enum if not present
DO $$ BEGIN
  ALTER TYPE campaign_type ADD VALUE IF NOT EXISTS 'inapp';
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- ─── STEP 2: EXTEND NOTIFICATIONS TABLE ──────────────────────────────────────

ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS data JSONB,
  ADD COLUMN IF NOT EXISTS onesignal_id TEXT,
  ADD COLUMN IF NOT EXISTS clicked_at TIMESTAMPTZ;

-- ─── STEP 3: CAMPAIGN STATS VIEW ─────────────────────────────────────────────

CREATE OR REPLACE VIEW campaign_stats AS
SELECT
  c.id,
  c.tenant_id,
  c.name,
  c.type,
  c.status,
  c.segment,
  c.recipients_count,
  c.delivered_count,
  c.opened_count,
  c.clicked_count,
  c.redeemed_count,
  c.scheduled_at,
  c.sent_at,
  c.created_at,
  CASE
    WHEN c.recipients_count > 0
    THEN ROUND((c.opened_count::DECIMAL / c.recipients_count) * 100, 1)
    ELSE 0
  END AS open_rate,
  CASE
    WHEN c.recipients_count > 0
    THEN ROUND((c.redeemed_count::DECIMAL / c.recipients_count) * 100, 1)
    ELSE 0
  END AS redemption_rate
FROM campaigns c;

-- ─── STEP 4: INDEXES ─────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_campaigns_tenant_status
  ON campaigns (tenant_id, status);

CREATE INDEX IF NOT EXISTS idx_campaigns_scheduled
  ON campaigns (scheduled_at)
  WHERE status = 'scheduled';

CREATE INDEX IF NOT EXISTS idx_notifications_campaign
  ON notifications (campaign_id);

-- ─── STEP 5: RLS POLICIES ────────────────────────────────────────────────────

ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant staff can manage campaigns" ON campaigns;
CREATE POLICY "Tenant staff can manage campaigns" ON campaigns
  FOR ALL
  USING (
    tenant_id IN (
      SELECT id FROM tenants WHERE auth_user_id = auth.uid()
      UNION
      SELECT tenant_id FROM tenant_users WHERE auth_user_id = auth.uid()
    )
  );

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant staff can manage notifications" ON notifications;
CREATE POLICY "Tenant staff can manage notifications" ON notifications
  FOR ALL
  USING (
    tenant_id IN (
      SELECT id FROM tenants WHERE auth_user_id = auth.uid()
      UNION
      SELECT tenant_id FROM tenant_users WHERE auth_user_id = auth.uid()
    )
  );

-- ─── STEP 6: UPDATED_AT TRIGGER FOR CAMPAIGNS ────────────────────────────────

DROP TRIGGER IF EXISTS set_campaigns_updated_at ON campaigns;
CREATE TRIGGER set_campaigns_updated_at
  BEFORE UPDATE ON campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
