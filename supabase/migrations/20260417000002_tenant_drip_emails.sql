-- Table to track sent onboarding drip emails (idempotency guard)
CREATE TABLE IF NOT EXISTS tenant_drip_emails (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email_key   TEXT NOT NULL,  -- 'day3' | 'day7'
  sent_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  resend_id   TEXT,
  UNIQUE (tenant_id, email_key)
);

CREATE INDEX IF NOT EXISTS tenant_drip_emails_tenant_id_idx ON tenant_drip_emails(tenant_id);
