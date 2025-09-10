-- ============================================================================
-- Migration: Add tenant isolation columns and RLS policies
-- Date: 2025-09-10
-- Adds tenant_id to sensitive tables and enforces row level security
-- ============================================================================

-- 1. Add tenant_id columns
ALTER TABLE IF EXISTS public.profiles ADD COLUMN IF NOT EXISTS tenant_id uuid;
ALTER TABLE IF EXISTS public.processos ADD COLUMN IF NOT EXISTS tenant_id uuid;
ALTER TABLE IF EXISTS public.testemunhas ADD COLUMN IF NOT EXISTS tenant_id uuid;
ALTER TABLE IF EXISTS public.attachments ADD COLUMN IF NOT EXISTS tenant_id uuid;
ALTER TABLE IF EXISTS public.audit_logs ADD COLUMN IF NOT EXISTS tenant_id uuid;

-- 2. Indexes combining tenant_id with common search keys
CREATE INDEX IF NOT EXISTS idx_profiles_tenant_user ON public.profiles (tenant_id, user_id);
CREATE INDEX IF NOT EXISTS idx_processos_tenant_cnj ON public.processos (tenant_id, cnj);
CREATE INDEX IF NOT EXISTS idx_testemunhas_tenant_user ON public.testemunhas (tenant_id, user_id);
CREATE INDEX IF NOT EXISTS idx_attachments_tenant_owner ON public.attachments (tenant_id, owner_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_created ON public.audit_logs (tenant_id, created_at);

-- 3. Enable RLS (deny by default)
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.processos ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.testemunhas ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Default policy: deny all (requires explicit policies below)
CREATE POLICY IF NOT EXISTS "default_profiles" ON public.profiles FOR ALL TO public USING (false);
CREATE POLICY IF NOT EXISTS "default_processos" ON public.processos FOR ALL TO public USING (false);
CREATE POLICY IF NOT EXISTS "default_testemunhas" ON public.testemunhas FOR ALL TO public USING (false);
CREATE POLICY IF NOT EXISTS "default_attachments" ON public.attachments FOR ALL TO public USING (false);
CREATE POLICY IF NOT EXISTS "default_audit_logs" ON public.audit_logs FOR ALL TO public USING (false);

-- Policy: tenant_scope (matches tenant_id in JWT)
CREATE POLICY IF NOT EXISTS tenant_scope_profiles ON public.profiles
FOR ALL TO authenticated
USING (auth.uid() IS NOT NULL AND tenant_id = (auth.jwt() ->> 'tenant_id')::uuid)
WITH CHECK (auth.uid() IS NOT NULL AND tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

CREATE POLICY IF NOT EXISTS tenant_scope_processos ON public.processos
FOR ALL TO authenticated
USING (auth.uid() IS NOT NULL AND tenant_id = (auth.jwt() ->> 'tenant_id')::uuid)
WITH CHECK (auth.uid() IS NOT NULL AND tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

CREATE POLICY IF NOT EXISTS tenant_scope_testemunhas ON public.testemunhas
FOR ALL TO authenticated
USING (auth.uid() IS NOT NULL AND tenant_id = (auth.jwt() ->> 'tenant_id')::uuid)
WITH CHECK (auth.uid() IS NOT NULL AND tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

CREATE POLICY IF NOT EXISTS tenant_scope_attachments ON public.attachments
FOR ALL TO authenticated
USING (auth.uid() IS NOT NULL AND tenant_id = (auth.jwt() ->> 'tenant_id')::uuid)
WITH CHECK (auth.uid() IS NOT NULL AND tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

CREATE POLICY IF NOT EXISTS tenant_scope_audit_logs ON public.audit_logs
FOR ALL TO authenticated
USING (auth.uid() IS NOT NULL AND tenant_id = (auth.jwt() ->> 'tenant_id')::uuid)
WITH CHECK (auth.uid() IS NOT NULL AND tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- Policy: hierarchical_access (owner or supervisor via law_firm_hierarchy)
CREATE POLICY IF NOT EXISTS hierarchical_access_profiles ON public.profiles
FOR ALL TO authenticated
USING (
  auth.uid() IS NOT NULL AND (
    auth.uid() = user_id OR
    auth.uid() IN (
      SELECT member_id FROM law_firm_hierarchy WHERE supervisor_id = auth.uid()
    )
  )
)
WITH CHECK (
  auth.uid() IS NOT NULL AND (
    auth.uid() = user_id OR
    auth.uid() IN (
      SELECT member_id FROM law_firm_hierarchy WHERE supervisor_id = auth.uid()
    )
  )
);

CREATE POLICY IF NOT EXISTS hierarchical_access_processos ON public.processos
FOR ALL TO authenticated
USING (
  auth.uid() IS NOT NULL AND (
    auth.uid() = owner_id OR
    auth.uid() IN (
      SELECT member_id FROM law_firm_hierarchy WHERE supervisor_id = auth.uid()
    )
  )
)
WITH CHECK (
  auth.uid() IS NOT NULL AND (
    auth.uid() = owner_id OR
    auth.uid() IN (
      SELECT member_id FROM law_firm_hierarchy WHERE supervisor_id = auth.uid()
    )
  )
);

CREATE POLICY IF NOT EXISTS hierarchical_access_testemunhas ON public.testemunhas
FOR ALL TO authenticated
USING (
  auth.uid() IS NOT NULL AND (
    auth.uid() = user_id OR
    auth.uid() IN (
      SELECT member_id FROM law_firm_hierarchy WHERE supervisor_id = auth.uid()
    )
  )
)
WITH CHECK (
  auth.uid() IS NOT NULL AND (
    auth.uid() = user_id OR
    auth.uid() IN (
      SELECT member_id FROM law_firm_hierarchy WHERE supervisor_id = auth.uid()
    )
  )
);

CREATE POLICY IF NOT EXISTS hierarchical_access_attachments ON public.attachments
FOR ALL TO authenticated
USING (
  auth.uid() IS NOT NULL AND (
    auth.uid() = owner_id OR
    auth.uid() IN (
      SELECT member_id FROM law_firm_hierarchy WHERE supervisor_id = auth.uid()
    )
  )
)
WITH CHECK (
  auth.uid() IS NOT NULL AND (
    auth.uid() = owner_id OR
    auth.uid() IN (
      SELECT member_id FROM law_firm_hierarchy WHERE supervisor_id = auth.uid()
    )
  )
);

CREATE POLICY IF NOT EXISTS hierarchical_access_audit_logs ON public.audit_logs
FOR ALL TO authenticated
USING (
  auth.uid() IS NOT NULL AND (
    auth.uid() = user_id OR
    auth.uid() IN (
      SELECT member_id FROM law_firm_hierarchy WHERE supervisor_id = auth.uid()
    )
  )
)
WITH CHECK (
  auth.uid() IS NOT NULL AND (
    auth.uid() = user_id OR
    auth.uid() IN (
      SELECT member_id FROM law_firm_hierarchy WHERE supervisor_id = auth.uid()
    )
  )
);

-- 4. Secure views exposing only UI-needed columns
CREATE OR REPLACE VIEW public.v_profiles_secure AS
  SELECT id, email, role, tenant_id FROM public.profiles;

CREATE OR REPLACE VIEW public.v_cases_secure AS
  SELECT id, cnj, status, tenant_id FROM public.processos;

CREATE OR REPLACE VIEW public.v_witnesses_secure AS
  SELECT id, name, tenant_id FROM public.testemunhas;

CREATE OR REPLACE VIEW public.v_attachments_secure AS
  SELECT id, tenant_id FROM public.attachments;

CREATE OR REPLACE VIEW public.v_audit_logs_secure AS
  SELECT id, action, created_at, tenant_id FROM public.audit_logs;

-- ============================================================================
