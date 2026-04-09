-- ─── Custom segments per tenant ──────────────────────────────────────────────
--
-- Allows tenants to define reusable audience segments with structured conditions.
-- Conditions are stored as JSONB array — evaluated at campaign send time.
--
-- Condition schema (each item in the array):
--   { "field": "points_balance" | "points_lifetime" | "visits_total" | "days_since_visit" | "tier",
--     "operator": "gte" | "lte" | "eq",
--     "value": number | "bronze" | "silver" | "gold" | "platinum" }
--
-- All conditions are AND-joined.

CREATE TABLE IF NOT EXISTS tenant_custom_segments (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name        TEXT        NOT NULL CHECK (char_length(name) BETWEEN 1 AND 100),
  description TEXT        CHECK (char_length(description) <= 300),
  conditions  JSONB       NOT NULL DEFAULT '[]'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tenant_custom_segments_tenant_id
  ON tenant_custom_segments(tenant_id);

-- updated_at trigger
CREATE OR REPLACE FUNCTION update_tenant_custom_segments_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_tenant_custom_segments_updated_at
  BEFORE UPDATE ON tenant_custom_segments
  FOR EACH ROW EXECUTE FUNCTION update_tenant_custom_segments_updated_at();

-- ─── RLS ─────────────────────────────────────────────────────────────────────

ALTER TABLE tenant_custom_segments ENABLE ROW LEVEL SECURITY;

-- Tenant owner
CREATE POLICY "custom_segments_owner_all"
  ON tenant_custom_segments FOR ALL
  USING (
    tenant_id IN (
      SELECT id FROM tenants
      WHERE auth_user_id = auth.uid()
        AND deleted_at IS NULL
    )
  );

-- Tenant staff
CREATE POLICY "custom_segments_staff_all"
  ON tenant_custom_segments FOR ALL
  USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_users
      WHERE auth_user_id = auth.uid()
    )
  );
