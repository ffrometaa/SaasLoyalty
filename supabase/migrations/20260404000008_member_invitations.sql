-- Member Invitations table
-- Dashboard operators invite existing members (null auth_user_id) to register
CREATE TABLE IF NOT EXISTS public.member_invitations (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    uuid        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  member_id    uuid        REFERENCES public.members(id) ON DELETE SET NULL,
  email        text        NOT NULL,
  name         text,
  token        text        NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  accepted_at  timestamptz,
  expires_at   timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  created_at   timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS member_invitations_token_idx     ON public.member_invitations(token);
CREATE INDEX IF NOT EXISTS member_invitations_tenant_id_idx ON public.member_invitations(tenant_id);
CREATE INDEX IF NOT EXISTS member_invitations_email_idx     ON public.member_invitations(email);

ALTER TABLE public.member_invitations ENABLE ROW LEVEL SECURITY;

-- Tenant operators can manage their own invitations
DROP POLICY IF EXISTS "tenant_manage_invitations" ON public.member_invitations;

CREATE POLICY "tenant_manage_invitations" ON public.member_invitations
  FOR ALL USING (tenant_id = auth_tenant_id());
