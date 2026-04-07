-- Harden demo_requests: move inserts to server-side API route
-- ContactForm now calls /api/demo-requests (service_role) instead of Supabase directly.
-- The anon INSERT policy is no longer needed and is removed to close the spam vector.
-- ip_address column added for audit and future IP-based rate limiting.

ALTER TABLE demo_requests ADD COLUMN IF NOT EXISTS ip_address TEXT;

-- Remove anon INSERT policy — inserts now go through the API route (service_role)
DROP POLICY IF EXISTS "Anyone can submit a demo request" ON demo_requests;
