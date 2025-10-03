-- ============================================
-- FASE 1: CORREÇÕES CRÍTICAS - BLOQUEAR ACESSO ANÔNIMO
-- ============================================

-- 1. NEGAR ACESSO ANÔNIMO A DADOS SENSÍVEIS
-- ============================================

-- 1.1 Negar acesso anônimo à tabela profiles
CREATE POLICY "deny_anon_access_profiles"
ON public.profiles
FOR ALL
TO anon
USING (false);

-- 1.2 Negar acesso anônimo à tabela beta_signups  
CREATE POLICY "deny_anon_access_beta_signups"
ON public.beta_signups
FOR ALL
TO anon
USING (false);

-- 1.3 Negar acesso anônimo à tabela openai_keys
CREATE POLICY "deny_anon_access_openai_keys"
ON public.openai_keys
FOR ALL
TO anon
USING (false);

-- 2. ADICIONAR search_path A FUNÇÕES SEM ELE
-- ============================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 3. ADICIONAR ÍNDICE PARA PERFORMANCE NA TABELA MEMBERS
-- ============================================

CREATE INDEX IF NOT EXISTS idx_members_user_org_status 
ON public.members(user_id, org_id, status)
WHERE status = 'active';

-- 4. COMENTÁRIOS
-- ============================================

COMMENT ON POLICY "deny_anon_access_profiles" ON public.profiles IS 
  'SECURITY CRITICAL: Bloqueia completamente acesso anônimo a dados de perfil - previne roubo de emails e PII';

COMMENT ON POLICY "deny_anon_access_beta_signups" ON public.beta_signups IS 
  'SECURITY CRITICAL: Protege dados de leads de marketing contra scraping por concorrentes';

COMMENT ON POLICY "deny_anon_access_openai_keys" ON public.openai_keys IS 
  'SECURITY CRITICAL: Previne roubo de chaves API criptografadas que poderiam gerar milhares em cobranças não autorizadas';