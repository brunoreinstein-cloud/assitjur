-- FASE 1: CORREÇÕES CRÍTICAS DE SEGURANÇA FINAL (SAFE VERSION)
-- Objetivo: Alcançar score 9.0/10 protegendo dados financeiros e corrigindo RLS

-- 1. PROTEGER VIEWS FINANCEIRAS COM RLS
-- Criar função segura para verificar acesso financeiro
CREATE OR REPLACE FUNCTION public.has_financial_access()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role = 'ADMIN' 
    AND p.data_access_level = 'FULL'
    AND p.is_active = true
  );
$$;

-- 2. CORRIGIR FUNÇÕES SEM SEARCH_PATH SEGURO
-- Atualizar função accept_invitation
CREATE OR REPLACE FUNCTION public.accept_invitation(p_token text, p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'  -- ADICIONADO
AS $function$
DECLARE
  v_invitation user_invitations%ROWTYPE;
  v_profile_id UUID;
BEGIN
  -- Get invitation
  SELECT * INTO v_invitation
  FROM user_invitations
  WHERE invitation_token = p_token
    AND status = 'PENDING'
    AND expires_at > now();
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Convite inválido ou expirado'
    );
  END IF;
  
  -- Check if user already has profile in this org
  SELECT id INTO v_profile_id
  FROM profiles
  WHERE user_id = p_user_id
    AND organization_id = v_invitation.org_id;
  
  IF FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Usuário já pertence a esta organização'
    );
  END IF;
  
  -- Create profile
  INSERT INTO profiles (
    user_id,
    email,
    role,
    data_access_level,
    organization_id,
    is_active
  ) VALUES (
    p_user_id,
    v_invitation.email,
    v_invitation.role,
    v_invitation.data_access_level,
    v_invitation.org_id,
    true
  );
  
  -- Mark invitation as accepted
  UPDATE user_invitations
  SET status = 'ACCEPTED',
      accepted_at = now()
  WHERE id = v_invitation.id;
  
  -- Log action
  PERFORM log_user_action(
    'ACCEPT_INVITATION',
    'user_invitations',
    v_invitation.id,
    jsonb_build_object(
      'org_id', v_invitation.org_id,
      'role', v_invitation.role,
      'data_access_level', v_invitation.data_access_level
    )
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Convite aceito com sucesso',
    'org_id', v_invitation.org_id
  );
END;
$function$;

-- Atualizar função mask_name
CREATE OR REPLACE FUNCTION public.mask_name(name_value text)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'  -- ADICIONADO
AS $function$
  SELECT CASE 
    WHEN name_value IS NULL THEN NULL
    WHEN length(name_value) <= 3 THEN '***'
    ELSE substring(name_value from 1 for 2) || repeat('*', length(name_value) - 3) || substring(name_value from length(name_value))
  END;
$function$;

-- Atualizar função can_access_sensitive_data
CREATE OR REPLACE FUNCTION public.can_access_sensitive_data(user_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'  -- ADICIONADO
AS $function$
  SELECT EXISTS (
    SELECT 1 
    FROM profiles 
    WHERE user_id = user_uuid 
    AND (role = 'ADMIN' OR data_access_level IN ('FULL', 'MASKED'))
  );
$function$;

-- Atualizar função is_admin_simple
CREATE OR REPLACE FUNCTION public.is_admin_simple(check_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'  -- ADICIONADO
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = check_user_id 
    AND p.role = 'ADMIN' 
    AND p.is_active = true
  );
$function$;

-- Atualizar função get_current_user_profile
CREATE OR REPLACE FUNCTION public.get_current_user_profile()
RETURNS profiles
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'  -- ADICIONADO
AS $function$
  SELECT p.* FROM profiles p WHERE p.user_id = auth.uid() LIMIT 1;
$function$;

-- 3. PROTEGER TABELA BETA_SIGNUPS COM RLS ADEQUADAS
-- Remover TODAS as policies existentes primeiro
DROP POLICY IF EXISTS "Deny all direct DELETE access" ON public.beta_signups;
DROP POLICY IF EXISTS "Deny all direct INSERT access" ON public.beta_signups;
DROP POLICY IF EXISTS "Deny all direct SELECT access" ON public.beta_signups;
DROP POLICY IF EXISTS "Deny all direct UPDATE access" ON public.beta_signups;
DROP POLICY IF EXISTS "Service role can insert beta signups" ON public.beta_signups;
DROP POLICY IF EXISTS "Super admins only can delete beta signups" ON public.beta_signups;
DROP POLICY IF EXISTS "Super admins only can update beta signups" ON public.beta_signups;
DROP POLICY IF EXISTS "Super admins only can view beta signups" ON public.beta_signups;
DROP POLICY IF EXISTS "Super admin can view beta signups" ON public.beta_signups;
DROP POLICY IF EXISTS "Super admin can manage beta signups" ON public.beta_signups;

-- Criar policies novas e mais seguras
CREATE POLICY "Super admin view beta signups" 
ON public.beta_signups 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.user_id = auth.uid() 
    AND p.role = 'ADMIN'
    AND p.data_access_level = 'FULL'
    AND p.is_active = true
  )
);

CREATE POLICY "Super admin manage beta signups"
ON public.beta_signups 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.user_id = auth.uid() 
    AND p.role = 'ADMIN'
    AND p.data_access_level = 'FULL'
    AND p.is_active = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.user_id = auth.uid() 
    AND p.role = 'ADMIN'
    AND p.data_access_level = 'FULL'
    AND p.is_active = true
  )
);

-- Permitir service role inserir para edge functions
CREATE POLICY "Service role insert beta signups" 
ON public.beta_signups 
FOR INSERT 
WITH CHECK (auth.role() = 'service_role');

-- 4. ADICIONAR COMENTÁRIOS DE SEGURANÇA
COMMENT ON FUNCTION public.has_financial_access() IS 'SECURITY: Verifica se usuário tem acesso a dados financeiros - apenas super admins';
COMMENT ON POLICY "Super admin view beta signups" ON public.beta_signups IS 'SECURITY: Apenas super admins podem visualizar signups beta';
COMMENT ON POLICY "Super admin manage beta signups" ON public.beta_signups IS 'SECURITY: Apenas super admins podem gerenciar signups beta';
COMMENT ON FUNCTION public.mask_name(text) IS 'SECURITY: Função com search_path seguro para mascarar nomes';
COMMENT ON FUNCTION public.can_access_sensitive_data(uuid) IS 'SECURITY: Função com search_path seguro para verificar acesso a dados sensíveis';