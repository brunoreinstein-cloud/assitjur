-- ============================================================================
-- Migration: Document sharing with row level security
-- Adds memberships, documents, shares tables, secure view and grant_access RPC
-- ============================================================================

-- 1. memberships table (user -> tenant mapping)
CREATE TABLE IF NOT EXISTS public.memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  user_id uuid NOT NULL,
  role text DEFAULT 'member',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, user_id)
);

-- 2. documents table (tenant isolated resources)
CREATE TABLE IF NOT EXISTS public.documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  owner_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3. shares table (explicit access grants)
CREATE TABLE IF NOT EXISTS public.shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES public.memberships(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(document_id, member_id)
);

-- Enable RLS
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shares ENABLE ROW LEVEL SECURITY;

-- Default deny policies
CREATE POLICY IF NOT EXISTS default_memberships ON public.memberships FOR ALL TO public USING (false);
CREATE POLICY IF NOT EXISTS default_documents ON public.documents FOR ALL TO public USING (false);
CREATE POLICY IF NOT EXISTS default_shares ON public.shares FOR ALL TO public USING (false);

-- memberships: users can view their own membership
CREATE POLICY IF NOT EXISTS memberships_self_access ON public.memberships
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- documents policies
CREATE POLICY IF NOT EXISTS documents_owner_insert ON public.documents
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    owner_id = auth.uid() AND
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
  );

CREATE POLICY IF NOT EXISTS documents_owner_modify ON public.documents
  FOR UPDATE TO authenticated
  USING (
    auth.uid() IS NOT NULL AND
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid AND
    owner_id = auth.uid()
  )
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid AND
    owner_id = auth.uid()
  );

CREATE POLICY IF NOT EXISTS documents_owner_delete ON public.documents
  FOR DELETE TO authenticated
  USING (
    auth.uid() IS NOT NULL AND
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid AND
    owner_id = auth.uid()
  );

CREATE POLICY IF NOT EXISTS documents_access ON public.documents
  FOR SELECT TO authenticated
  USING (
    auth.uid() IS NOT NULL AND
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid AND
    (
      owner_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM public.shares s
        JOIN public.memberships m ON m.id = s.member_id
        WHERE s.document_id = public.documents.id
          AND m.user_id = auth.uid()
      )
    )
  );

-- shares policies
CREATE POLICY IF NOT EXISTS shares_member_access ON public.shares
  FOR SELECT TO authenticated
  USING (
    auth.uid() IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.id = member_id AND m.user_id = auth.uid()
    )
  );

-- Secure view exposing documents with RLS
CREATE OR REPLACE VIEW public.v_documents_secure AS
  SELECT id, tenant_id, owner_id, content, created_at
  FROM public.documents;

ALTER VIEW public.v_documents_secure SET (security_invoker = true);

-- RPC: grant access to a membership
CREATE OR REPLACE FUNCTION public.grant_access(p_document_id uuid, p_member_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant uuid;
  v_owner uuid;
BEGIN
  v_tenant := (auth.jwt() ->> 'tenant_id')::uuid;
  v_owner := auth.uid();

  -- Ensure the caller owns the document within their tenant
  IF NOT EXISTS (
    SELECT 1 FROM public.documents d
    WHERE d.id = p_document_id AND d.tenant_id = v_tenant AND d.owner_id = v_owner
  ) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  INSERT INTO public.shares (document_id, member_id)
  VALUES (p_document_id, p_member_id)
  ON CONFLICT (document_id, member_id) DO NOTHING;
END;
$$;

-- Indexes for quick lookups
CREATE INDEX IF NOT EXISTS idx_documents_tenant_owner ON public.documents (tenant_id, owner_id);
CREATE INDEX IF NOT EXISTS idx_shares_document ON public.shares (document_id, member_id);
-- ============================================================================
