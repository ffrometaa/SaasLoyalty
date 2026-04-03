-- Demo requests table for loyalbase.dev contact/demo form
CREATE TABLE IF NOT EXISTS demo_requests (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_name TEXT NOT NULL,
  business_type TEXT NOT NULL,
  owner_name    TEXT NOT NULL,
  email         TEXT NOT NULL,
  phone         TEXT,
  message       TEXT,
  status        TEXT DEFAULT 'new',
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE demo_requests ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (public contact form)
CREATE POLICY "Anyone can submit a demo request"
  ON demo_requests
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Only service role / admins can read
CREATE POLICY "Service role can read demo requests"
  ON demo_requests
  FOR SELECT
  TO service_role
  USING (true);
