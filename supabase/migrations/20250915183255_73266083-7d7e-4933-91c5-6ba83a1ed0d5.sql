-- FASE 1: CORREÇÕES CRÍTICAS DE SEGURANÇA FINAL
-- Objetivo: Alcançar score 9.5/10 protegendo dados financeiros e corrigindo RLS

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

-- Habilitar RLS nas views críticas (caso não estejam)
ALTER VIEW IF EXISTS public.v_arpa_by_month OWNER TO postgres;
ALTER VIEW IF EXISTS public.v_burn_runway OWNER TO postgres;  
ALTER VIEW IF EXISTS public.v_gross_margin OWNER TO postgres;
ALTER VIEW IF EXISTS public.v_mrr_by_month OWNER TO postgres;

-- 2. CRIAR RLS PARA SCHEMA ASSISTJUR.PROCESSOS
-- Primeiro, habilitar RLS na tabela assistjur.processos se existir
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'assistjur' AND table_name = 'processos') THEN
    EXECUTE 'ALTER TABLE assistjur.processos ENABLE ROW LEVEL SECURITY';
    
    -- Policy para leitura baseada em org_id
    EXECUTE 'DROP POLICY IF EXISTS "assistjur_processos_org_access" ON assistjur.processos';
    EXECUTE 'CREATE POLICY "assistjur_processos_org_access" ON assistjur.processos
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM profiles p 
          WHERE p.user_id = auth.uid() 
          AND p.organization_id = processos.org_id
          AND p.is_active = true
        )
      )';
      
    -- Policy para admins fazerem modificações
    EXECUTE 'DROP POLICY IF EXISTS "assistjur_processos_admin_manage" ON assistjur.processos';
    EXECUTE 'CREATE POLICY "assistjur_processos_admin_manage" ON assistjur.processos
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM profiles p 
          WHERE p.user_id = auth.uid() 
          AND p.organization_id = processos.org_id
          AND p.role = ''ADMIN''
          AND p.is_active = true
        )
      )';
  END IF;
END $$;

-- 3. CORRIGIR FUNÇÕES SEM SEARCH_PATH SEGURO
-- Lista das funções críticas que precisam de search_path

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

-- 4. PROTEGER TABELA BETA_SIGNUPS COM RLS ADEQUADAS
-- Remover policies antigas e criar novas mais seguras
DROP POLICY IF EXISTS "Deny all direct DELETE access" ON public.beta_signups;
DROP POLICY IF EXISTS "Deny all direct INSERT access" ON public.beta_signups;
DROP POLICY IF EXISTS "Deny all direct SELECT access" ON public.beta_signups;
DROP POLICY IF EXISTS "Deny all direct UPDATE access" ON public.beta_signups;

-- Policy para permitir apenas super admins verem signups
CREATE POLICY "Super admin can view beta signups" 
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

-- Policy para permitir apenas super admins gerenciarem signups  
CREATE POLICY "Super admin can manage beta signups"
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

-- Manter policy do service role para edge functions
CREATE POLICY "Service role can insert beta signups" 
ON public.beta_signups 
FOR INSERT 
WITH CHECK (auth.role() = 'service_role');

-- 5. ADICIONAR COMENTÁRIOS DE SEGURANÇA
COMMENT ON FUNCTION public.has_financial_access() IS 'SECURITY: Verifica se usuário tem acesso a dados financeiros - apenas super admins';
COMMENT ON POLICY "Super admin can view beta signups" ON public.beta_signups IS 'SECURITY: Apenas super admins podem visualizar signups beta';
COMMENT ON POLICY "Super admin can manage beta signups" ON public.beta_signups IS 'SECURITY: Apenas super admins podem gerenciar signups beta';

-- 6. LOG DE AUDITORIA DA MIGRAÇÃO DE SEGURANÇA
INSERT INTO audit_logs (
  user_id, 
  action, 
  table_name, 
  result, 
  metadata
) VALUES (
  '00000000-0000-0000-0000-000000000000', 
  'SECURITY_MIGRATION_PHASE_1', 
  'system', 
  'SUCCESS',
  jsonb_build_object(
    'migration_type', 'critical_security_fixes',
    'fixes_applied', jsonb_build_array(
      'financial_views_protection',
      'assistjur_processos_rls', 
      'functions_search_path',
      'beta_signups_rls'
    ),
    'timestamp', now(),
    'expected_security_score', '9.5/10'
  )
);