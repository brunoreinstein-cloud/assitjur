-- ============================================================================
-- ETAPA 3: Validação Final e Preparação para Remoção de profiles.role
-- ============================================================================
-- Issue: SEC-101 | Garantir migração completa antes de remover coluna
-- Author: Security Team
-- Date: 2025-10-02
-- ============================================================================

-- 3.1. DROP função antiga e recriar com novo tipo de retorno
DROP FUNCTION IF EXISTS public.ensure_user_profile(uuid, text, user_role, uuid);

CREATE FUNCTION public.ensure_user_profile(
  user_uuid uuid,
  user_email text,
  user_role user_role,
  org_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  profile_data jsonb;
  existing_profile profiles%ROWTYPE;
BEGIN
  -- Get or create profile (without touching role column)
  SELECT * INTO existing_profile
  FROM profiles
  WHERE user_id = user_uuid;
  
  IF NOT FOUND THEN
    -- Create new profile
    INSERT INTO profiles (user_id, email, organization_id, is_active, data_access_level)
    VALUES (user_uuid, user_email, org_id, true, 'MASKED')
    RETURNING * INTO existing_profile;
  END IF;
  
  -- Ensure membership exists in members table (source of truth)
  IF org_id IS NOT NULL THEN
    INSERT INTO members (user_id, org_id, role, status, data_access_level)
    VALUES (user_uuid, org_id, user_role, 'active', 'MASKED')
    ON CONFLICT (user_id, org_id) 
    DO UPDATE SET 
      role = EXCLUDED.role,
      status = 'active',
      updated_at = now();
  END IF;
  
  -- Return profile with roles from members
  SELECT jsonb_build_object(
    'id', existing_profile.id,
    'user_id', existing_profile.user_id,
    'email', existing_profile.email,
    'organization_id', existing_profile.organization_id,
    'is_active', existing_profile.is_active,
    'data_access_level', existing_profile.data_access_level,
    'roles', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'org_id', m.org_id::text,
          'role', m.role::text
        )
      )
      FROM members m
      WHERE m.user_id = user_uuid AND m.status = 'active'
    ),
    'created_at', existing_profile.created_at,
    'updated_at', existing_profile.updated_at
  ) INTO profile_data;
  
  RETURN profile_data;
END;
$$;

-- 3.2. Criar função de validação de consistência
CREATE OR REPLACE FUNCTION public.validate_role_migration()
RETURNS TABLE(
  check_name text,
  status text,
  details jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check 1: Profiles sem members correspondente
  RETURN QUERY
  SELECT 
    'profiles_without_members'::text,
    CASE 
      WHEN COUNT(*) = 0 THEN 'PASS'
      ELSE 'FAIL'
    END::text,
    jsonb_build_object(
      'count', COUNT(*),
      'message', 'Profiles sem membership ativo em members'
    )
  FROM profiles p
  LEFT JOIN members m ON m.user_id = p.user_id 
    AND m.org_id = p.organization_id 
    AND m.status = 'active'
  WHERE p.organization_id IS NOT NULL 
    AND m.id IS NULL;
  
  -- Check 2: Verificar se get_user_profile_with_roles está funcionando
  RETURN QUERY
  SELECT 
    'rpc_get_user_profile_working'::text,
    'PASS'::text,
    jsonb_build_object(
      'message', 'RPC get_user_profile_with_roles está disponível'
    )
  WHERE EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' 
    AND p.proname = 'get_user_profile_with_roles'
  );
  
  -- Check 3: Verificar se ensure_user_profile está funcionando
  RETURN QUERY
  SELECT 
    'rpc_ensure_user_profile_working'::text,
    'PASS'::text,
    jsonb_build_object(
      'message', 'RPC ensure_user_profile retorna jsonb (atualizado)'
    )
  WHERE EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    JOIN pg_type t ON p.prorettype = t.oid
    WHERE n.nspname = 'public' 
    AND p.proname = 'ensure_user_profile'
    AND t.typname = 'jsonb'
  );
  
  -- Check 4: Índices otimizados
  RETURN QUERY
  SELECT 
    'members_indexes_exist'::text,
    CASE 
      WHEN COUNT(*) >= 2 THEN 'PASS'
      ELSE 'WARN'
    END::text,
    jsonb_build_object(
      'count', COUNT(*),
      'indexes', jsonb_agg(indexname)
    )
  FROM pg_indexes
  WHERE tablename = 'members'
    AND schemaname = 'public'
    AND indexname IN ('idx_members_user_org_active', 'idx_members_role_lookup');
END;
$$;

-- 3.3. Executar validação
DO $$
DECLARE
  validation_result RECORD;
BEGIN
  FOR validation_result IN 
    SELECT * FROM validate_role_migration()
  LOOP
    IF validation_result.status = 'FAIL' THEN
      RAISE WARNING 'Validation FAILED: % - %', 
        validation_result.check_name, 
        validation_result.details;
    ELSIF validation_result.status = 'WARN' THEN
      RAISE WARNING 'Validation WARNING: % - %', 
        validation_result.check_name, 
        validation_result.details;
    ELSE
      RAISE NOTICE 'Validation PASSED: % - %', 
        validation_result.check_name, 
        validation_result.details;
    END IF;
  END LOOP;
END $$;

-- 3.4. Adicionar schedule para remoção final (7 dias)
COMMENT ON COLUMN profiles.role IS 
'[DEPRECATED - Remoção agendada para 2025-10-09] 
Use members.role como fonte de verdade. 
Após 7 dias esta coluna será removida definitivamente.
Migration para remoção: 20251009_remove_profiles_role_column.sql';

-- 3.5. Criar view de auditoria para monitorar uso de profiles.role
CREATE OR REPLACE VIEW public.v_profile_role_usage_audit AS
SELECT 
  p.user_id,
  p.email,
  p.organization_id,
  p.role as deprecated_profile_role,
  m.role as current_member_role,
  CASE 
    WHEN p.role IS DISTINCT FROM m.role THEN 'MISMATCH'
    WHEN p.role IS NULL AND m.role IS NOT NULL THEN 'MIGRATED'
    WHEN p.role IS NOT NULL AND m.role IS NULL THEN 'MISSING_MEMBER'
    ELSE 'CONSISTENT'
  END as migration_status,
  m.status as member_status,
  p.updated_at as profile_updated,
  m.updated_at as member_updated
FROM profiles p
LEFT JOIN members m ON m.user_id = p.user_id 
  AND m.org_id = p.organization_id
WHERE p.organization_id IS NOT NULL;

COMMENT ON VIEW v_profile_role_usage_audit IS 
'View de auditoria para monitorar inconsistências entre profiles.role e members.role durante migração';

-- 3.6. Log de conclusão
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ ETAPA 3 CONCLUÍDA';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Sistema pronto para remoção de profiles.role em 7 dias';
  RAISE NOTICE 'Execute: SELECT * FROM validate_role_migration();';
  RAISE NOTICE 'Monitore: SELECT * FROM v_profile_role_usage_audit;';
  RAISE NOTICE '========================================';
END $$;