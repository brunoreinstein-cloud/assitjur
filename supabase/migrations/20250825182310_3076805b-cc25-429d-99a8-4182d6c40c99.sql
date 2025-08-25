-- Fase 1: Correção de Vulnerabilidades Críticas de Segurança

-- 1. Corrigir search_path na função existente
DROP FUNCTION IF EXISTS public.handle_new_user();
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, role)
  VALUES (NEW.id, NEW.email, 'VIEWER');
  RETURN NEW;
END;
$$;

-- 2. Criar enum para níveis de acesso a dados sensíveis
CREATE TYPE public.data_access_level AS ENUM ('FULL', 'MASKED', 'NONE');

-- 3. Adicionar coluna de nível de acesso a dados na tabela profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS data_access_level public.data_access_level DEFAULT 'NONE';

-- 4. Função para verificar se usuário pode acessar dados sensíveis
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

-- 5. Função para mascarar CPF
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

-- 6. Função para mascarar nomes
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

-- 7. Recriar políticas mais restritivas para a tabela pessoas
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

-- 8. Recriar políticas mais restritivas para a tabela processos
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

-- 9. Política mais restritiva para audit_logs (apenas super admins)
DROP POLICY IF EXISTS "Admins can view organization audit logs" ON public.audit_logs;

CREATE POLICY "Super admins can view audit logs" 
ON public.audit_logs 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.organization_id = audit_logs.organization_id 
    AND p.role = 'ADMIN'
    AND p.data_access_level = 'FULL'
  )
);

-- 10. Criar view para dados mascarados de pessoas
CREATE OR REPLACE VIEW public.pessoas_masked AS
SELECT 
  id,
  org_id,
  CASE 
    WHEN public.can_access_sensitive_data(auth.uid()) THEN nome_civil
    ELSE public.mask_name(nome_civil)
  END as nome_civil,
  CASE 
    WHEN public.can_access_sensitive_data(auth.uid()) THEN cpf_mask
    ELSE public.mask_cpf(cpf_mask)
  END as cpf_mask,
  apelidos,
  created_at,
  updated_at
FROM public.pessoas
WHERE EXISTS (
  SELECT 1 FROM profiles p 
  WHERE p.user_id = auth.uid() 
  AND p.organization_id = pessoas.org_id
);

-- 11. Criar view para dados mascarados de processos
CREATE OR REPLACE VIEW public.processos_masked AS
SELECT 
  id,
  org_id,
  version_id,
  cnj,
  cnj_normalizado,
  comarca,
  tribunal,
  vara,
  fase,
  status,
  CASE 
    WHEN public.can_access_sensitive_data(auth.uid()) THEN reclamante_nome
    ELSE public.mask_name(reclamante_nome)
  END as reclamante_nome,
  CASE 
    WHEN public.can_access_sensitive_data(auth.uid()) THEN reclamante_cpf_mask
    ELSE public.mask_cpf(reclamante_cpf_mask)
  END as reclamante_cpf_mask,
  CASE 
    WHEN public.can_access_sensitive_data(auth.uid()) THEN reu_nome
    ELSE public.mask_name(reu_nome)
  END as reu_nome,
  advogados_ativo,
  advogados_passivo,
  testemunhas_ativo,
  testemunhas_passivo,
  data_audiencia,
  reclamante_foi_testemunha,
  troca_direta,
  triangulacao_confirmada,
  prova_emprestada,
  score_risco,
  classificacao_final,
  observacoes,
  created_at,
  updated_at,
  deleted_at,
  deleted_by
FROM public.processos
WHERE EXISTS (
  SELECT 1 FROM profiles p 
  WHERE p.user_id = auth.uid() 
  AND p.organization_id = processos.org_id
);

-- 12. Habilitar RLS nas views
ALTER VIEW public.pessoas_masked SET (security_barrier = on);
ALTER VIEW public.processos_masked SET (security_barrier = on);

-- 13. Atualizar perfil de admin padrão com acesso completo (exemplo)
-- Nota: Isso deve ser feito manualmente para usuários específicos
-- UPDATE profiles SET data_access_level = 'FULL' WHERE role = 'ADMIN' AND email = 'admin@example.com';