-- FASE 2: CORREÇÕES DE SEGURANÇA CRÍTICAS (CORRIGIDA)

-- 1. Melhorar política de audit_logs para ser mais restritiva  
DROP POLICY IF EXISTS "audit_logs_strict_admin_only" ON audit_logs;
CREATE POLICY "audit_logs_org_admin_only" 
ON audit_logs FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role = 'ADMIN'::user_role 
    AND p.data_access_level = 'FULL'::data_access_level 
    AND p.is_active = true
    AND p.organization_id = audit_logs.organization_id
  )
);

-- 2. Função de validação de acesso organizacional mais robusta
CREATE OR REPLACE FUNCTION validate_org_access(target_org_id UUID)
RETURNS BOOLEAN AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Política mais restritiva para dados financeiros
DROP POLICY IF EXISTS "financial_data_super_restricted" ON cogs_monthly;
CREATE POLICY "financial_data_corporate_only" 
ON cogs_monthly FOR ALL
USING (
  auth.role() = 'service_role'::text OR
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role = 'ADMIN'::user_role 
    AND p.data_access_level = 'FULL'::data_access_level 
    AND p.is_active = true
    AND (p.email LIKE '%@assistjur.ia' OR p.email LIKE '%@admin.assistjur.ia')
  )
);

-- 4. Aplicar mesma política ao opex_monthly
DROP POLICY IF EXISTS "Enhanced financial data protection for opex" ON opex_monthly;
CREATE POLICY "opex_data_corporate_only" 
ON opex_monthly FOR ALL
USING (
  auth.role() = 'service_role'::text OR
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role = 'ADMIN'::user_role 
    AND p.data_access_level = 'FULL'::data_access_level 
    AND p.is_active = true
    AND (p.email LIKE '%@assistjur.ia' OR p.email LIKE '%@admin.assistjur.ia')
  )
);

-- 5. Melhorar log de ações do usuário para ser mais granular
CREATE OR REPLACE FUNCTION enhanced_log_user_action(
  action_type text, 
  resource_type text DEFAULT NULL::text, 
  resource_id uuid DEFAULT NULL::uuid, 
  metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_profile profiles%ROWTYPE;
  current_user_id uuid;
BEGIN
  current_user_id := auth.uid();
  
  -- Get user profile safely
  IF current_user_id IS NOT NULL THEN
    SELECT * INTO user_profile
    FROM profiles 
    WHERE user_id = current_user_id;
  END IF;
  
  -- Enhanced logging with more context
  INSERT INTO audit_logs (
    user_id, 
    email, 
    role, 
    organization_id, 
    action, 
    resource, 
    table_name,
    result, 
    metadata, 
    ip_address, 
    user_agent
  ) VALUES (
    current_user_id, 
    COALESCE(user_profile.email, 'system'), 
    COALESCE(user_profile.role::text, 'unknown'), 
    user_profile.organization_id,
    action_type, 
    COALESCE(resource_type, 'system'), 
    COALESCE(resource_type, 'system'),
    'SUCCESS', 
    metadata || jsonb_build_object(
      'timestamp', now(),
      'session_context', 'enhanced_audit',
      'data_access_level', COALESCE(user_profile.data_access_level::text, 'none')
    ),
    inet '127.0.0.1', 
    'AssistJur-Enhanced'
  );
EXCEPTION
  WHEN OTHERS THEN
    -- Silent fail to not block operations
    NULL;
END;
$$;