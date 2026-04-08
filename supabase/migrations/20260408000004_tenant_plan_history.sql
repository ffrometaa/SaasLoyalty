-- Track plan changes per tenant for analytics and billing audit
CREATE TABLE IF NOT EXISTS tenant_plan_history (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  from_plan   TEXT        NOT NULL,
  to_plan     TEXT        NOT NULL,
  changed_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tenant_plan_history_tenant_id
  ON tenant_plan_history(tenant_id);

ALTER TABLE tenant_plan_history ENABLE ROW LEVEL SECURITY;

-- Only service role can read/write plan history
CREATE POLICY "service_role_only" ON tenant_plan_history
  USING (false)
  WITH CHECK (false);

COMMENT ON TABLE tenant_plan_history IS
  'Audit log of plan changes per tenant. Written by the billing webhook, read by Super Admin.';
