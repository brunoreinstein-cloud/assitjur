-- Fix processos_live security issue by replacing with a proper security definer function

-- Drop the existing processos_live view
DROP VIEW IF EXISTS processos_live;

-- Create a security definer function that provides the same data as processos_live
-- but with proper access controls and organization filtering
CREATE OR REPLACE FUNCTION get_processos_live(org_uuid uuid DEFAULT NULL)
RETURNS TABLE(
  id uuid,
  org_id uuid,
  version_id uuid,
  cnj text,
  cnj_normalizado text,
  cnj_digits text,
  comarca text,
  tribunal text,
  vara text,
  fase text,
  status text,
  reclamante_nome text,
  reclamante_cpf_mask text,
  reu_nome text,
  advogados_ativo text[],
  advogados_passivo text[],
  testemunhas_ativo text[],
  testemunhas_passivo text[],
  data_audiencia date,
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
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT 
    p.id,
    p.org_id,
    p.version_id,
    p.cnj,
    p.cnj_normalizado,
    p.cnj_digits,
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
    p.advogados_ativo,
    p.advogados_passivo,
    p.testemunhas_ativo,
    p.testemunhas_passivo,
    p.data_audiencia,
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
  WHERE (org_uuid IS NULL OR p.org_id = org_uuid)
    AND p.deleted_at IS NULL
    AND EXISTS (
      SELECT 1 FROM profiles pr
      WHERE pr.user_id = auth.uid() 
        AND pr.organization_id = p.org_id
        AND can_access_sensitive_data(auth.uid())
    );
$$;

-- Create a new secure view that uses the function
-- This approach ensures proper RLS enforcement
CREATE VIEW processos_live AS
SELECT * FROM get_processos_live();

-- Grant appropriate permissions
GRANT EXECUTE ON FUNCTION get_processos_live(uuid) TO authenticated;

-- Add comments for documentation
COMMENT ON FUNCTION get_processos_live IS 'Secure function to access live process data with organization-based filtering and data masking';
COMMENT ON VIEW processos_live IS 'Secure view for live process data - uses security definer function with proper RLS enforcement';