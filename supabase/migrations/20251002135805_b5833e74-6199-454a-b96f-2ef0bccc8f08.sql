-- ============================================
-- SUPER ADMIN SYSTEM
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

-- 5. Atualizar função has_member_role para incluir super admin
CREATE OR REPLACE FUNCTION public.has_member_role(_user_id UUID, _org_id UUID, _role user_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (
    -- Super admin tem acesso a tudo
    is_super_admin(_user_id)
    OR
    -- Ou é membro com o role específico
    EXISTS (
      SELECT 1
      FROM public.members
      WHERE user_id = _user_id
        AND org_id = _org_id
        AND role = _role
        AND status = 'active'
    )
  );
$$;

-- 6. Atualizar RLS policies para incluir super admin

-- Members table
DROP POLICY IF EXISTS "Users can view members of their organization" ON public.members;
CREATE POLICY "Users can view members of their organization"
ON public.members
FOR SELECT
TO authenticated
USING (
  is_super_admin(auth.uid())
  OR
  EXISTS (
    SELECT 1 FROM public.members m
    WHERE m.org_id = members.org_id
      AND m.user_id = auth.uid()
      AND m.status = 'active'
  )
);

DROP POLICY IF EXISTS "Admins can manage members in their organization" ON public.members;
CREATE POLICY "Admins can manage members in their organization"
ON public.members
FOR ALL
TO authenticated
USING (
  is_super_admin(auth.uid())
  OR
  EXISTS (
    SELECT 1 FROM public.members m
    WHERE m.org_id = members.org_id
      AND m.user_id = auth.uid()
      AND m.role = 'ADMIN'
      AND m.status = 'active'
  )
)
WITH CHECK (
  is_super_admin(auth.uid())
  OR
  EXISTS (
    SELECT 1 FROM public.members m
    WHERE m.org_id = members.org_id
      AND m.user_id = auth.uid()
      AND m.role = 'ADMIN'
      AND m.status = 'active'
  )
);

-- Seats table
DROP POLICY IF EXISTS "Users can view seats of their organization" ON public.seats;
CREATE POLICY "Users can view seats of their organization"
ON public.seats
FOR SELECT
TO authenticated
USING (
  is_super_admin(auth.uid())
  OR
  EXISTS (
    SELECT 1 FROM public.members m
    WHERE m.org_id = seats.org_id
      AND m.user_id = auth.uid()
      AND m.status = 'active'
  )
);

DROP POLICY IF EXISTS "Admins can manage seats in their organization" ON public.seats;
CREATE POLICY "Admins can manage seats in their organization"
ON public.seats
FOR ALL
TO authenticated
USING (
  is_super_admin(auth.uid())
  OR
  EXISTS (
    SELECT 1 FROM public.members m
    WHERE m.org_id = seats.org_id
      AND m.user_id = auth.uid()
      AND m.role = 'ADMIN'
      AND m.status = 'active'
  )
)
WITH CHECK (
  is_super_admin(auth.uid())
  OR
  EXISTS (
    SELECT 1 FROM public.members m
    WHERE m.org_id = seats.org_id
      AND m.user_id = auth.uid()
      AND m.role = 'ADMIN'
      AND m.status = 'active'
  )
);

-- Organizations table
DROP POLICY IF EXISTS "Users can view their organization" ON public.organizations;
CREATE POLICY "Users can view their organization"
ON public.organizations
FOR SELECT
TO authenticated
USING (
  is_super_admin(auth.uid())
  OR
  EXISTS (
    SELECT 1
    FROM profiles
    WHERE profiles.user_id = auth.uid()
      AND profiles.organization_id = organizations.id
  )
  OR
  EXISTS (
    SELECT 1
    FROM members m
    WHERE m.user_id = auth.uid()
      AND m.org_id = organizations.id
      AND m.status = 'active'
  )
);

-- Processos table
DROP POLICY IF EXISTS "processos_org_access" ON public.processos;
CREATE POLICY "processos_org_access"
ON public.processos
FOR ALL
TO authenticated
USING (
  deleted_at IS NULL
  AND (
    is_super_admin(auth.uid())
    OR
    has_role(auth.uid(), 'ADMIN'::app_role, org_id)
    OR
    has_role(auth.uid(), 'ANALYST'::app_role, org_id)
    OR
    EXISTS (
      SELECT 1
      FROM profiles p
      WHERE p.user_id = auth.uid()
        AND p.organization_id = processos.org_id
        AND p.is_active = true
        AND p.data_access_level = ANY (ARRAY['FULL'::data_access_level, 'MASKED'::data_access_level])
    )
  )
)
WITH CHECK (
  is_super_admin(auth.uid())
  OR
  has_role(auth.uid(), 'ADMIN'::app_role, org_id)
);

-- Pessoas table  
DROP POLICY IF EXISTS "pessoas_org_access" ON public.pessoas;
CREATE POLICY "pessoas_org_access"
ON public.pessoas
FOR ALL
TO authenticated
USING (
  is_super_admin(auth.uid())
  OR
  has_role(auth.uid(), 'ADMIN'::app_role, org_id)
  OR
  has_role(auth.uid(), 'ANALYST'::app_role, org_id)
  OR
  EXISTS (
    SELECT 1
    FROM profiles p
    WHERE p.user_id = auth.uid()
      AND p.organization_id = pessoas.org_id
      AND p.is_active = true
      AND p.data_access_level = ANY (ARRAY['FULL'::data_access_level, 'MASKED'::data_access_level])
  )
)
WITH CHECK (
  is_super_admin(auth.uid())
  OR
  has_role(auth.uid(), 'ADMIN'::app_role, org_id)
);

-- 7. Enable RLS na tabela super_admins
ALTER TABLE public.super_admins ENABLE ROW LEVEL SECURITY;

-- 8. Policies para super_admins (apenas service role e próprio super admin podem ver)
CREATE POLICY "Super admins can view their own record"
ON public.super_admins
FOR SELECT
TO authenticated
USING (user_id = auth.uid() AND is_active = true);

CREATE POLICY "Service role has full access to super_admins"
ON public.super_admins
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 9. Trigger para atualizar last_access_at
CREATE OR REPLACE FUNCTION public.update_super_admin_last_access()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.super_admins
  SET last_access_at = now()
  WHERE user_id = auth.uid()
    AND is_active = true;
  RETURN NULL;
END;
$$;

-- Não vamos criar o trigger automático para evitar overhead
-- O último acesso será atualizado via aplicação quando necessário

-- 10. Audit log para ações de super admin
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

-- 11. Trigger para updated_at
CREATE TRIGGER trg_super_admins_updated_at
BEFORE UPDATE ON public.super_admins
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 12. Índices para performance
CREATE INDEX IF NOT EXISTS idx_super_admins_user_id ON public.super_admins(user_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_super_admins_email ON public.super_admins(email) WHERE is_active = true;

-- 13. Comentários
COMMENT ON TABLE public.super_admins IS 'Super administradores com acesso total ao sistema (uso interno/suporte)';
COMMENT ON FUNCTION public.is_super_admin IS 'Verifica se um usuário é super administrador ativo';
COMMENT ON FUNCTION public.log_super_admin_action IS 'Registra ações de super administradores para auditoria';