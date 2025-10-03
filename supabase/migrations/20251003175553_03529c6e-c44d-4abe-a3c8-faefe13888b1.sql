-- ============================================
-- CORREÇÃO: validate_org_access - Dropar todas as versões
-- ============================================

-- Primeiro, dropar todas as versões usando DO block
DO $$
DECLARE
  func_record RECORD;
BEGIN
  FOR func_record IN 
    SELECT 
      p.oid::regprocedure::text as func_signature
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' 
      AND p.proname = 'validate_org_access'
  LOOP
    EXECUTE format('DROP FUNCTION IF EXISTS %s CASCADE', func_record.func_signature);
  END LOOP;
END $$;

-- Agora criar a versão única e segura
CREATE FUNCTION public.validate_org_access(target_org_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_org_id UUID;
  user_active BOOLEAN;
BEGIN
  SELECT organization_id, is_active 
  INTO user_org_id, user_active
  FROM profiles 
  WHERE user_id = auth.uid();
  
  RETURN user_org_id IS NOT NULL 
    AND user_active = true
    AND user_org_id = target_org_id;
END;
$$;

COMMENT ON FUNCTION public.validate_org_access(uuid) IS 
  'SECURITY HARDENED: Valida acesso à organização com search_path fixo - previne privilege escalation';