-- ============================================
-- FASE 1: CORREÇÕES CRÍTICAS DE SEGURANÇA
-- ============================================

-- 1.1: Remover SECURITY DEFINER de views financeiras
DROP VIEW IF EXISTS public.v_mrr_by_month CASCADE;
DROP VIEW IF EXISTS public.v_gross_margin CASCADE;

-- Recriar views sem SECURITY DEFINER (RLS enforced)
CREATE VIEW public.v_mrr_by_month 
WITH (security_invoker=true) AS
SELECT 
  date_trunc('month', issued_at) as month,
  SUM(amount) as revenue
FROM invoices
GROUP BY date_trunc('month', issued_at)
ORDER BY month;

CREATE VIEW public.v_gross_margin
WITH (security_invoker=true) AS
SELECT 
  date_trunc('month', i.issued_at) as month,
  SUM(i.amount) as revenue,
  SUM(c.hosting + c.db + c.llm_tokens + c.infra_other + c.support) as cogs,
  SUM(i.amount) - SUM(c.hosting + c.db + c.llm_tokens + c.infra_other + c.support) as gross_margin
FROM invoices i
LEFT JOIN cogs_monthly c ON date_trunc('month', i.issued_at) = c.month
GROUP BY date_trunc('month', i.issued_at);

-- 1.2: Criar tabela para armazenar verificações MFA server-side
CREATE TABLE IF NOT EXISTS public.mfa_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  verified_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '5 minutes'),
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mfa_verifications_user_id ON public.mfa_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_mfa_verifications_expires ON public.mfa_verifications(expires_at);

ALTER TABLE public.mfa_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own MFA verifications"
ON public.mfa_verifications FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage MFA verifications"
ON public.mfa_verifications FOR ALL
USING (auth.role() = 'service_role');

-- 1.3: Função para verificar MFA recente (SECURITY DEFINER com search_path fixo)
CREATE OR REPLACE FUNCTION public.check_recent_mfa_verification(p_user_id UUID DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := COALESCE(p_user_id, auth.uid());
  
  RETURN EXISTS (
    SELECT 1 FROM mfa_verifications
    WHERE user_id = v_user_id
      AND expires_at > now()
    ORDER BY verified_at DESC
    LIMIT 1
  );
END;
$$;

-- 1.4: Função para registrar verificação MFA
CREATE OR REPLACE FUNCTION public.register_mfa_verification(
  p_user_id UUID DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_user_id UUID;
  v_verification_id UUID;
BEGIN
  v_user_id := COALESCE(p_user_id, auth.uid());
  
  DELETE FROM mfa_verifications
  WHERE user_id = v_user_id
    AND expires_at < now();
  
  INSERT INTO mfa_verifications (user_id, ip_address, user_agent)
  VALUES (v_user_id, p_ip_address, p_user_agent)
  RETURNING id INTO v_verification_id;
  
  RETURN v_verification_id;
END;
$$;

-- 1.5: Limpar verificações MFA expiradas
CREATE OR REPLACE FUNCTION public.cleanup_expired_mfa_verifications()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  DELETE FROM mfa_verifications
  WHERE expires_at < now();
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  RETURN v_deleted_count;
END;
$$;

-- 1.6: Adicionar auditoria imutável para ações de super admin
CREATE TABLE IF NOT EXISTS public.super_admin_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  performed_by UUID NOT NULL REFERENCES auth.users(id),
  action TEXT NOT NULL,
  target_user_id UUID,
  target_org_id UUID,
  reason TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  performed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_address INET,
  user_agent TEXT
);

ALTER TABLE public.super_admin_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only for super admin audit"
ON public.super_admin_audit FOR ALL
USING (auth.role() = 'service_role');

CREATE POLICY "Super admins can view audit logs"
ON public.super_admin_audit FOR SELECT
USING (public.is_super_admin(auth.uid()));

CREATE INDEX IF NOT EXISTS idx_super_admin_audit_performed_by ON public.super_admin_audit(performed_by);
CREATE INDEX IF NOT EXISTS idx_super_admin_audit_performed_at ON public.super_admin_audit(performed_at DESC);
CREATE INDEX IF NOT EXISTS idx_super_admin_audit_target_user ON public.super_admin_audit(target_user_id);

-- 1.7: Adicionar sessões com expiração para super admins
ALTER TABLE public.super_admins 
ADD COLUMN IF NOT EXISTS session_expires_at TIMESTAMPTZ;

-- Atualizar função is_super_admin para verificar expiração de sessão
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.super_admins
    WHERE user_id = _user_id
      AND is_active = true
      AND (session_expires_at IS NULL OR session_expires_at > now())
  );
$$;

-- 1.8: Função para registrar ação de super admin com auditoria
CREATE OR REPLACE FUNCTION public.log_super_admin_action(
  p_action TEXT,
  p_target_user_id UUID DEFAULT NULL,
  p_target_org_id UUID DEFAULT NULL,
  p_reason TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_audit_id UUID;
BEGIN
  -- Verificar se é super admin
  IF NOT public.is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: Super admin only';
  END IF;
  
  -- Registrar ação
  INSERT INTO super_admin_audit (
    performed_by,
    action,
    target_user_id,
    target_org_id,
    reason,
    metadata,
    ip_address,
    user_agent
  ) VALUES (
    auth.uid(),
    p_action,
    p_target_user_id,
    p_target_org_id,
    COALESCE(p_reason, 'No reason provided'),
    p_metadata,
    inet '0.0.0.0', -- Placeholder, deve ser passado pelo Edge Function
    'AssistJur-SuperAdmin'
  )
  RETURNING id INTO v_audit_id;
  
  RETURN v_audit_id;
END;
$$;