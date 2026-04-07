-- legal_documents: stores versioned legal texts per tenant (or global)
CREATE TABLE IF NOT EXISTS public.legal_documents (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    uuid REFERENCES public.tenants(id) ON DELETE CASCADE,  -- NULL = global
  type         text NOT NULL CHECK (type IN ('terms_of_service', 'privacy_policy')),
  version      text NOT NULL,
  content      text NOT NULL,
  is_active    boolean NOT NULL DEFAULT true,
  effective_at timestamptz NOT NULL DEFAULT now(),
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_legal_documents_tenant   ON public.legal_documents(tenant_id);
CREATE INDEX idx_legal_documents_type     ON public.legal_documents(type, is_active);

-- member_consents: tracks each member's acceptance of each document version
CREATE TABLE IF NOT EXISTS public.member_consents (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id       uuid NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  document_id     uuid NOT NULL REFERENCES public.legal_documents(id) ON DELETE CASCADE,
  accepted_at     timestamptz NOT NULL DEFAULT now(),
  ip_address      text,
  user_agent      text,
  UNIQUE(member_id, document_id)
);

CREATE INDEX idx_member_consents_member   ON public.member_consents(member_id);
CREATE INDEX idx_member_consents_document ON public.member_consents(document_id);

-- RLS
ALTER TABLE public.legal_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_consents  ENABLE ROW LEVEL SECURITY;

-- legal_documents: everyone can read active docs, only super admin can write
CREATE POLICY "legal_documents_read"   ON public.legal_documents FOR SELECT USING (true);
CREATE POLICY "legal_documents_insert" ON public.legal_documents FOR INSERT WITH CHECK (is_super_admin());
CREATE POLICY "legal_documents_update" ON public.legal_documents FOR UPDATE USING (is_super_admin());
CREATE POLICY "legal_documents_delete" ON public.legal_documents FOR DELETE USING (is_super_admin());

-- member_consents: members can only see/insert their own
CREATE POLICY "member_consents_read"   ON public.member_consents FOR SELECT USING (member_id = current_member_id());
CREATE POLICY "member_consents_insert" ON public.member_consents FOR INSERT WITH CHECK (member_id = current_member_id());

-- Function: get pending (unaccepted) active documents for the current member
CREATE OR REPLACE FUNCTION public.get_pending_consents(p_member_id uuid)
RETURNS TABLE (
  document_id  uuid,
  type         text,
  version      text,
  effective_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT d.id, d.type, d.version, d.effective_at
  FROM   public.legal_documents d
  WHERE  d.is_active = true
  AND    NOT EXISTS (
    SELECT 1
    FROM   public.member_consents c
    WHERE  c.member_id   = p_member_id
    AND    c.document_id = d.id
  );
$$;

-- Seed: initial global legal documents
INSERT INTO public.legal_documents (id, tenant_id, type, version, content, is_active, effective_at)
VALUES
  (
    '00000000-0000-0000-0000-000000000001',
    NULL,
    'terms_of_service',
    '1.0',
    'LoyaltyOS Terms of Service v1.0',
    true,
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    NULL,
    'privacy_policy',
    '1.0',
    'LoyaltyOS Privacy Policy v1.0',
    true,
    now()
  )
ON CONFLICT (id) DO NOTHING;
