-- Add missing columns to tenants table for contact information
-- Fixes: C-12 Missing contact fields

ALTER TABLE tenants 
ADD COLUMN IF NOT EXISTS business_phone TEXT,
ADD COLUMN IF NOT EXISTS business_address TEXT,
ADD COLUMN IF NOT EXISTS owner_first_name TEXT,
ADD COLUMN IF NOT EXISTS owner_last_name TEXT,
ADD COLUMN IF NOT EXISTS owner_phone TEXT,
ADD COLUMN IF NOT EXISTS owner_email TEXT,
ADD COLUMN IF NOT EXISTS secondary_contact_first_name TEXT,
ADD COLUMN IF NOT EXISTS secondary_contact_last_name TEXT,
ADD COLUMN IF NOT EXISTS secondary_contact_phone TEXT,
ADD COLUMN IF NOT EXISTS secondary_contact_email TEXT;

-- Add missing column for campaign limits (referenced in triggers but never defined)
ALTER TABLE tenants 
ADD COLUMN IF NOT EXISTS max_campaigns_per_month INTEGER DEFAULT 10 CHECK (max_campaigns_per_month >= 0);

-- Add index for faster lookups on new columns
CREATE INDEX IF NOT EXISTS idx_tenants_owner_email ON tenants(owner_email) WHERE owner_email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tenants_owner_phone ON tenants(owner_phone) WHERE owner_phone IS NOT NULL;
