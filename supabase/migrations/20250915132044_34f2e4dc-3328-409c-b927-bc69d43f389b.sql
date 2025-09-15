-- ===========================================
-- CORREÇÕES CRÍTICAS DE SEGURANÇA - FASE 1
-- ===========================================

-- 1. HABILITAR RLS NA TABELA ORGS (ERROR 19)
ALTER TABLE public.orgs ENABLE ROW LEVEL SECURITY;

-- Criar política básica para tabela orgs
CREATE POLICY "orgs_service_role_access" ON public.orgs 
FOR ALL 
USING (auth.role() = 'service_role');

-- 2. CRIAR POLÍTICAS RLS PARA TABELAS SEM POLÍTICAS (INFO 1-6)

-- Política para invoices
CREATE POLICY "invoices_service_role_only" ON public.invoices 
FOR ALL 
USING (auth.role() = 'service_role');

-- Política para witness_data 
CREATE POLICY "witness_data_org_access" ON public.witness_data 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.organization_id = witness_data.org_id
  )
);

-- Política para opex_monthly
CREATE POLICY "opex_monthly_service_role_only" ON public.opex_monthly 
FOR ALL 
USING (auth.role() = 'service_role');

-- Política para subscriptions  
CREATE POLICY "subscriptions_service_role_only" ON public.subscriptions 
FOR ALL 
USING (auth.role() = 'service_role');

-- Política para cogs_monthly
CREATE POLICY "cogs_monthly_service_role_only" ON public.cogs_monthly 
FOR ALL 
USING (auth.role() = 'service_role');

-- 3. ADICIONAR SEARCH_PATH NAS FUNÇÕES CUSTOMIZADAS (WARN 11+)

-- Corrigir função generate_invitation_token
CREATE OR REPLACE FUNCTION public.generate_invitation_token()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT encode(gen_random_bytes(32), 'base64');
$$;

-- Corrigir função check_beta_signup_rate_limit  
CREATE OR REPLACE FUNCTION public.check_beta_signup_rate_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Check if this email has signed up recently (within 24 hours)
  IF EXISTS (
    SELECT 1 FROM beta_signups 
    WHERE email = NEW.email 
    AND created_at > now() - interval '24 hours'
  ) THEN
    RAISE EXCEPTION 'Rate limit exceeded: Email already signed up recently';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Verificar se current_user_org_ids existe e corrigir se necessário
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'current_user_org_ids') THEN
    -- Se a função existe, adicionar search_path
    EXECUTE '
    CREATE OR REPLACE FUNCTION public.current_user_org_ids()
    RETURNS uuid[]
    LANGUAGE sql
    STABLE SECURITY DEFINER
    SET search_path = ''public''
    AS $function$
      SELECT ARRAY(
        SELECT organization_id 
        FROM profiles 
        WHERE user_id = auth.uid() 
        AND is_active = true
      );
    $function$;
    ';
  END IF;
END $$;

-- 4. ADICIONAR COMENTÁRIOS DE AUDITORIA
COMMENT ON POLICY "orgs_service_role_access" ON public.orgs IS 'Allow service role full access to orgs table';
COMMENT ON POLICY "invoices_service_role_only" ON public.invoices IS 'Restrict invoices access to service role only';
COMMENT ON POLICY "witness_data_org_access" ON public.witness_data IS 'Allow organization members to access witness data';
COMMENT ON POLICY "opex_monthly_service_role_only" ON public.opex_monthly IS 'Restrict OPEX data to service role only';
COMMENT ON POLICY "subscriptions_service_role_only" ON public.subscriptions IS 'Restrict subscriptions to service role only'; 
COMMENT ON POLICY "cogs_monthly_service_role_only" ON public.cogs_monthly IS 'Restrict COGS data to service role only';