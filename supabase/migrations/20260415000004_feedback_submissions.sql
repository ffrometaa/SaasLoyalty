-- ─────────────────────────────────────────────────────────────────────────────
-- feedback_submissions: tenant and member feedback routed to LoyaltyOS team.
-- Emails sent via Resend; submissions stored for internal tracking.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS feedback_submissions (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  source        TEXT        NOT NULL CHECK (source IN ('tenant', 'member')),
  auth_user_id  UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  tenant_id     UUID        REFERENCES tenants(id) ON DELETE SET NULL,
  type          TEXT        NOT NULL CHECK (type IN ('bug', 'feature', 'suggestion', 'general')),
  message       TEXT        NOT NULL,
  status        TEXT        NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'read', 'resolved')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS feedback_submissions_source_idx ON feedback_submissions(source);
CREATE INDEX IF NOT EXISTS feedback_submissions_status_idx ON feedback_submissions(status);

ALTER TABLE feedback_submissions ENABLE ROW LEVEL SECURITY;

-- Authenticated users can submit their own feedback
CREATE POLICY "Users can submit feedback"
  ON feedback_submissions FOR INSERT
  TO authenticated
  WITH CHECK (auth_user_id = auth.uid());

-- No SELECT policy for authenticated role — only service role reads submissions
