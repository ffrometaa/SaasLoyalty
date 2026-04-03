-- Add attribution columns to demo_requests
ALTER TABLE demo_requests
  ADD COLUMN IF NOT EXISTS converted_at timestamptz,
  ADD COLUMN IF NOT EXISTS converted_tenant_slug text;
