-- ─── TENANT JOIN CODE SYSTEM ─────────────────────────────────────────────────
-- Adds a 6-char alphanumeric join_code to the tenants table.
-- Safe charset: excludes ambiguous chars 0, O, I, 1, L
-- Safe set: ABCDEFGHJKMNPQRSTUVWXYZ23456789  (no I, L, O; no 0, 1)

-- 1. Add column
ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS join_code text UNIQUE;

-- 2. Unique index
CREATE UNIQUE INDEX IF NOT EXISTS tenants_join_code_idx ON tenants(join_code);

-- 3. Generator function — loops until unique
CREATE OR REPLACE FUNCTION generate_join_code()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  chars  text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  code   text;
  i      int;
BEGIN
  LOOP
    code := '';
    FOR i IN 1..6 LOOP
      code := code || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    END LOOP;
    -- Exit when the code is not already in use
    EXIT WHEN NOT EXISTS (SELECT 1 FROM tenants WHERE join_code = code);
  END LOOP;
  RETURN code;
END;
$$;

-- 4. Trigger: auto-populate join_code on INSERT if null
CREATE OR REPLACE FUNCTION tenants_set_join_code()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.join_code IS NULL THEN
    NEW.join_code := generate_join_code();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_tenants_join_code ON tenants;
CREATE TRIGGER trg_tenants_join_code
  BEFORE INSERT ON tenants
  FOR EACH ROW EXECUTE FUNCTION tenants_set_join_code();

-- 5. Backfill existing tenants
UPDATE tenants
SET join_code = generate_join_code()
WHERE join_code IS NULL;

-- 6. Public view — only active/trialing tenants, only safe columns
CREATE OR REPLACE VIEW tenant_public_info AS
SELECT
  id,
  business_name,
  brand_logo_url,
  brand_app_name,
  brand_color_primary,
  brand_color_secondary,
  join_code,
  slug
FROM tenants
WHERE plan_status IN ('active', 'trialing')
  AND deleted_at IS NULL;

-- Grant SELECT on the view to anonymous role
GRANT SELECT ON tenant_public_info TO anon;
