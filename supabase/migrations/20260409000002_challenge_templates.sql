-- ─── Per-tenant challenge templates ──────────────────────────────────────────
--
-- Allows enterprise tenants to customize the dynamic challenge templates
-- used by the scoring engine for each motivation type.
-- Falls back to built-in defaults when no custom template is defined.

CREATE TABLE IF NOT EXISTS tenant_challenge_templates (
  id              UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID           NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  motivation_type TEXT           NOT NULL CHECK (motivation_type IN ('achiever', 'socializer', 'explorer', 'competitor')),
  challenge_type  TEXT           NOT NULL CHECK (challenge_type IN ('visit_count', 'points_earned', 'referral', 'spend_amount', 'streak')),
  name            TEXT           NOT NULL CHECK (char_length(name) BETWEEN 1 AND 100),
  description     TEXT           NOT NULL CHECK (char_length(description) BETWEEN 1 AND 300),
  bonus_points    INTEGER        NOT NULL DEFAULT 100 CHECK (bonus_points BETWEEN 10 AND 5000),
  ttl_days        INTEGER        NOT NULL DEFAULT 7   CHECK (ttl_days BETWEEN 1 AND 90),
  goal_multiplier NUMERIC(4, 2)  NOT NULL DEFAULT 1.0 CHECK (goal_multiplier BETWEEN 0.5 AND 5.0),
  is_active       BOOLEAN        NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ    NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ    NOT NULL DEFAULT now(),

  -- One active template per (tenant, motivation_type, challenge_type)
  UNIQUE (tenant_id, motivation_type, challenge_type)
);

CREATE INDEX IF NOT EXISTS idx_tenant_challenge_templates_tenant_id
  ON tenant_challenge_templates(tenant_id);

-- updated_at trigger
CREATE OR REPLACE FUNCTION update_tenant_challenge_templates_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_tenant_challenge_templates_updated_at
  BEFORE UPDATE ON tenant_challenge_templates
  FOR EACH ROW EXECUTE FUNCTION update_tenant_challenge_templates_updated_at();

-- ─── RLS ─────────────────────────────────────────────────────────────────────

ALTER TABLE tenant_challenge_templates ENABLE ROW LEVEL SECURITY;

-- Tenant owner
CREATE POLICY "challenge_templates_owner_all"
  ON tenant_challenge_templates FOR ALL
  USING (
    tenant_id IN (
      SELECT id FROM tenants
      WHERE auth_user_id = auth.uid()
        AND deleted_at IS NULL
    )
  );

-- Tenant staff
CREATE POLICY "challenge_templates_staff_all"
  ON tenant_challenge_templates FOR ALL
  USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_users
      WHERE auth_user_id = auth.uid()
    )
  );
