-- ─────────────────────────────────────────────────────────────────────────────
-- Fix 1: Deterministic LIMIT 1 in current_tenant_id() and current_member_id()
--
-- Without ORDER BY, a user with multiple memberships gets a non-deterministic
-- tenant/member resolved. ORDER BY created_at ASC picks the oldest (primary) one.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION current_tenant_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(
    (SELECT id        FROM tenants      WHERE auth_user_id = auth.uid() AND deleted_at IS NULL ORDER BY created_at ASC LIMIT 1),
    (SELECT tenant_id FROM tenant_users WHERE auth_user_id = auth.uid()                        ORDER BY created_at ASC LIMIT 1),
    (SELECT tenant_id FROM members      WHERE auth_user_id = auth.uid()                        ORDER BY created_at ASC LIMIT 1)
  );
$$;

CREATE OR REPLACE FUNCTION current_member_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT id FROM members WHERE auth_user_id = auth.uid() ORDER BY created_at ASC LIMIT 1;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- Fix 2: Protect sensitive member fields from self-update via PostgREST
--
-- The members_update_self RLS policy allows members to UPDATE their own row,
-- but does not restrict which columns they can change. A member with their JWT
-- could directly call Supabase REST and set tier, points_balance, etc.
--
-- This trigger intercepts BEFORE UPDATE and resets protected columns to their
-- OLD values when the updater is a loyalty member (not staff/service role).
-- Service role bypasses auth.uid() → current_member_id() returns NULL → no-op.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION members_restrict_self_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only restrict when a member is updating their own row (not tenant staff or service role).
  -- current_member_id() returns NULL for service role (no auth.uid()) and for tenant owners/staff
  -- who are not in the members table, so this only fires for actual member-app users.
  IF current_member_id() IS NOT NULL AND current_member_id() = NEW.id THEN
    -- Reset fields a member must not be allowed to change
    NEW.points_balance          := OLD.points_balance;
    NEW.points_lifetime         := OLD.points_lifetime;
    NEW.tier                    := OLD.tier;
    NEW.visits_total            := OLD.visits_total;
    NEW.status                  := OLD.status;
    NEW.tenant_id               := OLD.tenant_id;
    NEW.auth_user_id            := OLD.auth_user_id;
    NEW.referrer_member_id      := OLD.referrer_member_id;
    NEW.member_code             := OLD.member_code;
    NEW.email                   := OLD.email;
    NEW.last_visit_at           := OLD.last_visit_at;
    NEW.deleted_at              := OLD.deleted_at;
    NEW.created_at              := OLD.created_at;
    NEW.google_review_claimed_at := OLD.google_review_claimed_at;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS members_restrict_self_update_trigger ON members;
CREATE TRIGGER members_restrict_self_update_trigger
  BEFORE UPDATE ON members
  FOR EACH ROW EXECUTE FUNCTION members_restrict_self_update();
