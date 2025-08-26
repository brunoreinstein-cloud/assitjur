-- CRITICAL: Fix exposed sensitive data - Enable RLS on masked tables
ALTER TABLE public.pessoas_masked ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processos_masked ENABLE ROW LEVEL SECURITY;

-- Create secure policies for masked tables
CREATE POLICY "Restricted access to masked pessoas data" 
ON public.pessoas_masked 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM profiles p
  WHERE p.user_id = auth.uid() 
  AND p.organization_id = pessoas_masked.org_id
  AND can_access_sensitive_data(auth.uid())
));

CREATE POLICY "Only admins can manage masked pessoas data" 
ON public.pessoas_masked 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles p
  WHERE p.user_id = auth.uid() 
  AND p.organization_id = pessoas_masked.org_id
  AND p.role = 'ADMIN'::user_role
));

CREATE POLICY "Restricted access to masked processos data" 
ON public.processos_masked 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM profiles p
  WHERE p.user_id = auth.uid() 
  AND p.organization_id = processos_masked.org_id
  AND can_access_sensitive_data(auth.uid())
));

CREATE POLICY "Only admins can manage masked processos data" 
ON public.processos_masked 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles p
  WHERE p.user_id = auth.uid() 
  AND p.organization_id = processos_masked.org_id
  AND p.role = 'ADMIN'::user_role
));

-- Fix remaining security definer views by converting them to regular views or functions
-- First, drop the problematic views and recreate them safely
DROP VIEW IF EXISTS public.pessoas_masked CASCADE;
DROP VIEW IF EXISTS public.processos_masked CASCADE;

-- Recreate as secure functions instead of views
CREATE OR REPLACE FUNCTION public.get_masked_pessoas(org_uuid uuid)
RETURNS TABLE (
  id uuid,
  org_id uuid,
  nome_civil text,
  cpf_mask text,
  apelidos text[],
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    p.id,
    p.org_id,
    CASE 
      WHEN can_access_sensitive_data(auth.uid()) THEN p.nome_civil
      ELSE mask_name(p.nome_civil)
    END as nome_civil,
    p.cpf_mask,
    p.apelidos,
    p.created_at,
    p.updated_at
  FROM pessoas p
  WHERE p.org_id = org_uuid
  AND EXISTS (
    SELECT 1 FROM profiles pr
    WHERE pr.user_id = auth.uid() 
    AND pr.organization_id = org_uuid
  );
$$;

CREATE OR REPLACE FUNCTION public.get_masked_processos(org_uuid uuid)
RETURNS TABLE (
  id uuid,
  org_id uuid,
  version_id uuid,
  cnj text,
  cnj_normalizado text,
  comarca text,
  tribunal text,
  vara text,
  fase text,
  status text,
  reclamante_nome text,
  reclamante_cpf_mask text,
  reu_nome text,
  data_audiencia date,
  advogados_ativo text[],
  advogados_passivo text[],
  testemunhas_ativo text[],
  testemunhas_passivo text[],
  reclamante_foi_testemunha boolean,
  troca_direta boolean,
  triangulacao_confirmada boolean,
  prova_emprestada boolean,
  classificacao_final text,
  score_risco integer,
  observacoes text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  deleted_at timestamp with time zone,
  deleted_by uuid
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    p.id,
    p.org_id,
    p.version_id,
    p.cnj,
    p.cnj_normalizado,
    p.comarca,
    p.tribunal,
    p.vara,
    p.fase,
    p.status,
    CASE 
      WHEN can_access_sensitive_data(auth.uid()) THEN p.reclamante_nome
      ELSE mask_name(p.reclamante_nome)
    END as reclamante_nome,
    p.reclamante_cpf_mask,
    CASE 
      WHEN can_access_sensitive_data(auth.uid()) THEN p.reu_nome
      ELSE mask_name(p.reu_nome)
    END as reu_nome,
    p.data_audiencia,
    p.advogados_ativo,
    p.advogados_passivo,
    p.testemunhas_ativo,
    p.testemunhas_passivo,
    p.reclamante_foi_testemunha,
    p.troca_direta,
    p.triangulacao_confirmada,
    p.prova_emprestada,
    p.classificacao_final,
    p.score_risco,
    p.observacoes,
    p.created_at,
    p.updated_at,
    p.deleted_at,
    p.deleted_by
  FROM processos p
  WHERE p.org_id = org_uuid
  AND EXISTS (
    SELECT 1 FROM profiles pr
    WHERE pr.user_id = auth.uid() 
    AND pr.organization_id = org_uuid
  );
$$;