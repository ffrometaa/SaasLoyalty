-- Add owner contact fields to tenants
ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS owner_first_name TEXT,
  ADD COLUMN IF NOT EXISTS owner_last_name TEXT,
  ADD COLUMN IF NOT EXISTS owner_phone TEXT,
  ADD COLUMN IF NOT EXISTS owner_email TEXT,
  ADD COLUMN IF NOT EXISTS business_phone TEXT,
  ADD COLUMN IF NOT EXISTS business_address TEXT,
  ADD COLUMN IF NOT EXISTS secondary_contact_first_name TEXT,
  ADD COLUMN IF NOT EXISTS secondary_contact_last_name TEXT,
  ADD COLUMN IF NOT EXISTS secondary_contact_phone TEXT,
  ADD COLUMN IF NOT EXISTS secondary_contact_email TEXT;
