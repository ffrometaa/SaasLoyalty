-- Extend legal_documents type check to include DPA
ALTER TABLE public.legal_documents
  DROP CONSTRAINT IF EXISTS legal_documents_type_check;

ALTER TABLE public.legal_documents
  ADD CONSTRAINT legal_documents_type_check
  CHECK (type IN ('terms_of_service', 'privacy_policy', 'dpa'));

-- tenant_consents: tracks each tenant owner's acceptance of DPA (and future documents)
CREATE TABLE IF NOT EXISTS public.tenant_consents (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  document_id uuid        NOT NULL REFERENCES public.legal_documents(id) ON DELETE CASCADE,
  accepted_at timestamptz NOT NULL DEFAULT now(),
  ip_address  text,
  user_agent  text,
  UNIQUE(tenant_id, document_id)
);

CREATE INDEX idx_tenant_consents_tenant   ON public.tenant_consents(tenant_id);
CREATE INDEX idx_tenant_consents_document ON public.tenant_consents(document_id);

ALTER TABLE public.tenant_consents ENABLE ROW LEVEL SECURITY;

-- Tenant owners can read their own consent records
CREATE POLICY "tenant_consents_select" ON public.tenant_consents
  FOR SELECT USING (
    tenant_id IN (
      SELECT id FROM public.tenants WHERE auth_user_id = auth.uid()
    )
  );

-- Tenant owners can insert their own consent records
CREATE POLICY "tenant_consents_insert" ON public.tenant_consents
  FOR INSERT WITH CHECK (
    tenant_id IN (
      SELECT id FROM public.tenants WHERE auth_user_id = auth.uid()
    )
  );

-- Seed: DPA v1.0 global document
INSERT INTO public.legal_documents (id, tenant_id, type, version, content, is_active, effective_at)
VALUES (
  '00000000-0000-0000-0000-000000000003',
  NULL,
  'dpa',
  '1.0',
  'LoyalBase Data Processing Agreement v1.0 — Full text available at https://loyalbase.dev/dpa',
  true,
  '2026-04-12 00:00:00+00'
)
ON CONFLICT (id) DO NOTHING;

-- Helper: returns pending (unaccepted) DPA documents for a given tenant
CREATE OR REPLACE FUNCTION public.get_tenant_pending_dpa(p_tenant_id uuid)
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
  AND    d.type = 'dpa'
  AND    NOT EXISTS (
    SELECT 1
    FROM   public.tenant_consents c
    WHERE  c.tenant_id   = p_tenant_id
    AND    c.document_id = d.id
  );
$$;
