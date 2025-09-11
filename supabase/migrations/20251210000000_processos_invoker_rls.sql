-- Enforce tenant-based RLS for processos using invoker's identity
ALTER TABLE public.processos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS processos_tenant_rls ON public.processos;
CREATE POLICY processos_tenant_rls
  ON public.processos
  FOR ALL
  USING (
    auth.uid() IS NOT NULL AND
    org_id = current_setting('request.jwt.claim.tenant_id', true)::uuid
  )
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    org_id = current_setting('request.jwt.claim.tenant_id', true)::uuid
  );
