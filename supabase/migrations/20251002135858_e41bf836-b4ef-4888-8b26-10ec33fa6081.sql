-- ============================================
-- SUPER ADMIN SYSTEM (CORRIGIDO)
-- ============================================

-- 1. Criar tabela de super admins (acesso especial fora de orgs)
CREATE TABLE IF NOT EXISTS public.super_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  granted_by UUID,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_access_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  access_reason TEXT,
  ip_allowlist TEXT[] DEFAULT '{}',
  require_mfa BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Adicionar super admin bruno@dietwin.com.br
INSERT INTO public.super_admins (user_id, email, access_reason, is_active)
SELECT 
  user_id,
  'bruno@dietwin.com.br',
  'Sistema de super administração - acesso total',
  true
FROM public.profiles
WHERE email = 'bruno@dietwin.com.br'
ON CONFLICT (email) DO UPDATE 
SET is_active = true, updated_at = now();

-- 3. Criar função para verificar se é super admin
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.super_admins
    WHERE user_id = _user_id
      AND is_active = true
  );
$$;

-- 4. Criar função para obter informações do super admin
CREATE OR REPLACE FUNCTION public.get_super_admin_info(_user_id UUID)
RETURNS TABLE (
  is_super_admin BOOLEAN,
  email TEXT,
  granted_at TIMESTAMPTZ,
  last_access_at TIMESTAMPTZ
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    true as is_super_admin,
    sa.email,
    sa.granted_at,
    sa.last_access_at
  FROM public.super_admins sa
  WHERE sa.user_id = _user_id
    AND sa.is_active = true
  LIMIT 1;
$$;

-- 5. Enable RLS na tabela super_admins
ALTER TABLE public.super_admins ENABLE ROW LEVEL SECURITY;

-- 6. Policies para super_admins (apenas service role e próprio super admin podem ver)
DROP POLICY IF EXISTS "Super admins can view their own record" ON public.super_admins;
CREATE POLICY "Super admins can view their own record"
ON public.super_admins
FOR SELECT
TO authenticated
USING (user_id = auth.uid() AND is_active = true);

DROP POLICY IF EXISTS "Service role has full access to super_admins" ON public.super_admins;
CREATE POLICY "Service role has full access to super_admins"
ON public.super_admins
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 7. Audit log para ações de super admin
CREATE OR REPLACE FUNCTION public.log_super_admin_action(
  p_action TEXT,
  p_target_org_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_super_admin super_admins%ROWTYPE;
BEGIN
  SELECT * INTO v_super_admin
  FROM super_admins
  WHERE user_id = auth.uid() AND is_active = true;
  
  IF FOUND THEN
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
      v_super_admin.user_id,
      v_super_admin.email,
      'SUPER_ADMIN',
      p_target_org_id,
      p_action,
      'SUPER_ADMIN_ACTION',
      'super_admins',
      'SUCCESS',
      p_metadata || jsonb_build_object(
        'is_super_admin', true,
        'granted_at', v_super_admin.granted_at
      ),
      inet '127.0.0.1',
      'AssistJur-SuperAdmin'
    );
  END IF;
END;
$$;

-- 8. Trigger para updated_at
DROP TRIGGER IF EXISTS trg_super_admins_updated_at ON public.super_admins;
CREATE TRIGGER trg_super_admins_updated_at
BEFORE UPDATE ON public.super_admins
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 9. Índices para performance
CREATE INDEX IF NOT EXISTS idx_super_admins_user_id ON public.super_admins(user_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_super_admins_email ON public.super_admins(email) WHERE is_active = true;

-- 10. Comentários
COMMENT ON TABLE public.super_admins IS 'Super administradores com acesso total ao sistema (uso interno/suporte)';
COMMENT ON FUNCTION public.is_super_admin IS 'Verifica se um usuário é super administrador ativo';
COMMENT ON FUNCTION public.log_super_admin_action IS 'Registra ações de super administradores para auditoria';