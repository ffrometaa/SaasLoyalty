-- Add API key to tenants for external integrations (POS, widgets, etc.)
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS api_key TEXT UNIQUE;
