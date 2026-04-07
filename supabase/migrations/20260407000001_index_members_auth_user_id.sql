-- Add missing index on members.auth_user_id
-- current_tenant_id() and current_member_id() (introduced in 20260406000006)
-- both query members WHERE auth_user_id = auth.uid() on every RLS policy evaluation.
-- Without this index, each lookup is a sequential scan — O(n) per request.
-- Partial index excludes soft-deleted members, matching the active member query pattern.

CREATE INDEX IF NOT EXISTS idx_members_auth_user_id
  ON members(auth_user_id)
  WHERE deleted_at IS NULL;
