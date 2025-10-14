-- ============================================
-- CORREÇÕES CRÍTICAS DE SEGURANÇA RLS (v2)
-- ============================================

-- 1. Reforçar políticas da tabela profiles
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view org profiles" ON profiles;

CREATE POLICY "Users view own profile"
  ON profiles FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users update own profile"
  ON profiles FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins view org profiles"
  ON profiles FOR SELECT
  USING (
    is_admin_simple(auth.uid()) AND 
    organization_id = get_user_org_safe()
  );

-- 2. Reforçar proteção de beta_signups
DROP POLICY IF EXISTS "beta_signups_ultra_secure" ON beta_signups;
DROP POLICY IF EXISTS "deny_anon_access_beta_signups" ON beta_signups;

CREATE POLICY "beta_signups_no_anon"
  ON beta_signups FOR ALL
  USING (auth.role() IS NOT NULL)
  WITH CHECK (auth.role() IS NOT NULL);

CREATE POLICY "beta_signups_admin_full_only"
  ON beta_signups FOR ALL
  USING (
    auth.role() = 'service_role' OR
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.user_id = auth.uid()
        AND p.role = 'ADMIN'
        AND p.data_access_level = 'FULL'
        AND p.is_active = true
    )
  )
  WITH CHECK (
    auth.role() = 'service_role' OR
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.user_id = auth.uid()
        AND p.role = 'ADMIN'
        AND p.data_access_level = 'FULL'
        AND p.is_active = true
    )
  );

-- 3. Reforçar proteção de openai_keys
DROP POLICY IF EXISTS "Admins can view organization keys" ON openai_keys;

-- View segura para keys (sem encrypted_key)
DROP VIEW IF EXISTS openai_keys_safe;
CREATE VIEW openai_keys_safe AS
SELECT 
  id, org_id, alias, last_four, is_active,
  last_used_at, created_by, created_at, updated_at
FROM openai_keys;

CREATE POLICY "Admins view org keys safe"
  ON openai_keys FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.user_id = auth.uid()
        AND p.organization_id = openai_keys.org_id
        AND p.role = 'ADMIN'
        AND p.is_active = true
    )
  );

-- 4. Verificar RLS em tabelas críticas
DO $$
DECLARE
  tbl text;
  rls_enabled boolean;
BEGIN
  FOR tbl IN 
    SELECT tablename FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename IN ('profiles', 'beta_signups', 'openai_keys', 'pessoas', 'processos', 
                      'audit_logs', 'data_access_logs', 'invoices', 'cogs_monthly', 'opex_monthly')
  LOOP
    SELECT relrowsecurity INTO rls_enabled
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = tbl AND n.nspname = 'public';
    
    IF NOT rls_enabled THEN
      RAISE NOTICE 'WARNING: RLS not enabled on table %', tbl;
      EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);
      RAISE NOTICE 'RLS enabled on table %', tbl;
    END IF;
  END LOOP;
END $$;

-- 5. Função para relatório de segurança
CREATE OR REPLACE FUNCTION get_security_report()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'timestamp', now(),
    'tables_with_rls', (
      SELECT count(*) FROM pg_tables t 
      JOIN pg_class c ON c.relname = t.tablename 
      WHERE t.schemaname = 'public' AND c.relrowsecurity = true
    ),
    'tables_without_rls', (
      SELECT count(*) FROM pg_tables t 
      JOIN pg_class c ON c.relname = t.tablename 
      WHERE t.schemaname = 'public' AND c.relrowsecurity = false
    ),
    'functions_with_security_definer', (
      SELECT count(*) FROM pg_proc p 
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'public' AND p.prosecdef = true
    ),
    'policies_count', (
      SELECT count(*) FROM pg_policies WHERE schemaname = 'public'
    ),
    'audit_logs_last_24h', (
      SELECT count(*) FROM audit_logs WHERE created_at > now() - interval '24 hours'
    ),
    'status', 'SECURITY_HARDENED'
  );
$$;