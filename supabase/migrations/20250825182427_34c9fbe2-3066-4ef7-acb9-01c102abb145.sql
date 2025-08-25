-- Fase 1: Continuação - Políticas RLS restritivas e mascaramento

-- 1. Função para verificar se usuário pode acessar dados sensíveis
CREATE OR REPLACE FUNCTION public.can_access_sensitive_data(user_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM profiles 
    WHERE user_id = user_uuid 
    AND (role = 'ADMIN' OR data_access_level IN ('FULL', 'MASKED'))
  );
$$;

-- 2. Função para mascarar CPF
CREATE OR REPLACE FUNCTION public.mask_cpf(cpf_value text)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT CASE 
    WHEN cpf_value IS NULL THEN NULL
    WHEN length(cpf_value) >= 8 THEN 
      substring(cpf_value from 1 for 3) || '.***.***-' || substring(cpf_value from length(cpf_value) - 1)
    ELSE '***.***.***-**'
  END;
$$;

-- 3. Função para mascarar nomes
CREATE OR REPLACE FUNCTION public.mask_name(name_value text)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT CASE 
    WHEN name_value IS NULL THEN NULL
    WHEN length(name_value) <= 3 THEN '***'
    ELSE substring(name_value from 1 for 2) || repeat('*', length(name_value) - 3) || substring(name_value from length(name_value))
  END;
$$;

-- 4. Recriar políticas mais restritivas para a tabela pessoas
DROP POLICY IF EXISTS "Users can view their organization pessoas" ON public.pessoas;
DROP POLICY IF EXISTS "Only admins can manage pessoas" ON public.pessoas;

-- Apenas usuários com acesso a dados sensíveis podem ver pessoas
CREATE POLICY "Restricted access to pessoas data" 
ON public.pessoas 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.organization_id = pessoas.org_id 
    AND public.can_access_sensitive_data(auth.uid())
  )
);

-- Apenas admins podem gerenciar dados de pessoas
CREATE POLICY "Only admins can manage pessoas data" 
ON public.pessoas 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.organization_id = pessoas.org_id 
    AND p.role = 'ADMIN'
  )
);

-- 5. Recriar políticas mais restritivas para a tabela processos
DROP POLICY IF EXISTS "Users can view their organization processos" ON public.processos;
DROP POLICY IF EXISTS "Only admins can manage processos" ON public.processos;

-- Apenas usuários com acesso a dados sensíveis podem ver processos
CREATE POLICY "Restricted access to processos data" 
ON public.processos 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.organization_id = processos.org_id 
    AND public.can_access_sensitive_data(auth.uid())
  )
);

-- Apenas admins podem gerenciar dados de processos
CREATE POLICY "Only admins can manage processos data" 
ON public.processos 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.organization_id = processos.org_id 
    AND p.role = 'ADMIN'
  )
);