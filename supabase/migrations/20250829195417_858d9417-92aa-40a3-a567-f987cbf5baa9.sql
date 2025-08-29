-- Corrigir problemas de segurança

-- 1. Remover a view com SECURITY DEFINER e recriar sem ela
DROP VIEW IF EXISTS public.processos_live;

-- Recriar a view sem SECURITY DEFINER
CREATE OR REPLACE VIEW public.processos_live AS
  SELECT p.* FROM public.processos p
  JOIN public.versions v ON v.id = p.version_id 
  WHERE v.status = 'published' AND v.org_id = p.org_id;

-- 2. Corrigir as funções existentes para ter search_path definido
-- Atualizar a função get_current_user_role se existir
DROP FUNCTION IF EXISTS public.get_current_user_role();
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM profiles WHERE user_id = auth.uid();
$$;

-- 3. Corrigir outras funções existentes
DROP FUNCTION IF EXISTS public.get_current_user_org();  
CREATE OR REPLACE FUNCTION public.get_current_user_org()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id FROM profiles WHERE user_id = auth.uid();
$$;