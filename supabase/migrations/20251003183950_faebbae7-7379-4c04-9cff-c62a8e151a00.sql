-- ============================================
-- FASE 2: Criar RLS Policies para assistjur.processos
-- ============================================

-- Policy 1: Service role tem acesso total
CREATE POLICY "service_role_full_access_assistjur_processos"
ON assistjur.processos
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Policy 2: Usuários podem ver processos do seu tenant (via memberships)
CREATE POLICY "users_view_tenant_processos"
ON assistjur.processos
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM public.memberships m
    WHERE m.user_id = auth.uid()
      AND m.org_id = assistjur.processos.tenant_id
  )
);

-- Policy 3: Admins podem inserir processos no seu tenant
CREATE POLICY "admins_insert_tenant_processos"
ON assistjur.processos
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM public.memberships m
    WHERE m.user_id = auth.uid()
      AND m.org_id = assistjur.processos.tenant_id
      AND m.role = 'admin'
  )
);

-- Policy 4: Admins podem atualizar processos do seu tenant
CREATE POLICY "admins_update_tenant_processos"
ON assistjur.processos
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM public.memberships m
    WHERE m.user_id = auth.uid()
      AND m.org_id = assistjur.processos.tenant_id
      AND m.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM public.memberships m
    WHERE m.user_id = auth.uid()
      AND m.org_id = assistjur.processos.tenant_id
      AND m.role = 'admin'
  )
);

-- Policy 5: Admins podem deletar processos do seu tenant
CREATE POLICY "admins_delete_tenant_processos"
ON assistjur.processos
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM public.memberships m
    WHERE m.user_id = auth.uid()
      AND m.org_id = assistjur.processos.tenant_id
      AND m.role = 'admin'
  )
);

-- ============================================
-- COMENTÁRIOS E VERIFICAÇÃO
-- ============================================

COMMENT ON TABLE assistjur.processos IS 
  'SECURITY HARDENED: Tabela de processos com RLS baseado em tenant_id via memberships';

-- Verificação final
DO $$
DECLARE
  v_policies_created INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_policies_created
  FROM pg_policies
  WHERE schemaname = 'assistjur' 
    AND tablename = 'processos';

  RAISE NOTICE 'SECURITY MIGRATION PHASE 2 COMPLETE:';
  RAISE NOTICE '  - RLS Policies created for assistjur.processos: % (expected: 5)', v_policies_created;
  RAISE NOTICE '  - Policies enforce multi-tenant isolation via memberships';
END $$;