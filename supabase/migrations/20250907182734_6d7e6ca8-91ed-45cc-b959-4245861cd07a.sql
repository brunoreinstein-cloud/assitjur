-- Enable RLS on core tables
ALTER TABLE public.processos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pessoas ENABLE ROW LEVEL SECURITY;

-- Create policies for org-based access using profiles table (more reliable than JWT claims)
CREATE POLICY "org_read_processos" ON public.processos
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid() 
      AND p.organization_id = processos.org_id
  )
);

CREATE POLICY "org_read_pessoas" ON public.pessoas  
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid() 
      AND p.organization_id = pessoas.org_id
  )
);

-- Add segredo_justica field to processos if not exists
ALTER TABLE public.processos 
ADD COLUMN IF NOT EXISTS segredo_justica BOOLEAN DEFAULT FALSE;

-- Create view for masked witness data (expanding witness arrays from processos)
CREATE OR REPLACE VIEW public.vw_testemunhas_publicas AS
SELECT 
  gen_random_uuid() as id,
  p.id as processo_id,
  p.org_id,
  unnest(
    CASE WHEN p.segredo_justica 
         THEN array_agg(left(witness, 1) || '***')
         ELSE p.testemunhas_ativo
    END
  ) as nome,
  'email@masked.com' as email, -- placeholder since we don't have witness emails
  CASE 
    WHEN array_length(p.testemunhas_ativo, 1) > 3 THEN 'Alto'
    WHEN array_length(p.testemunhas_ativo, 1) > 1 THEN 'Médio' 
    ELSE 'Baixo'
  END as risco_sensibilidade
FROM public.processos p
WHERE p.testemunhas_ativo IS NOT NULL 
  AND array_length(p.testemunhas_ativo, 1) > 0
  AND p.deleted_at IS NULL

UNION ALL

SELECT 
  gen_random_uuid() as id,
  p.id as processo_id,
  p.org_id,
  unnest(
    CASE WHEN p.segredo_justica 
         THEN array_agg(left(witness, 1) || '***')
         ELSE p.testemunhas_passivo
    END
  ) as nome,
  'email@masked.com' as email,
  CASE 
    WHEN array_length(p.testemunhas_passivo, 1) > 3 THEN 'Alto'
    WHEN array_length(p.testemunhas_passivo, 1) > 1 THEN 'Médio'
    ELSE 'Baixo'
  END as risco_sensibilidade
FROM public.processos p
WHERE p.testemunhas_passivo IS NOT NULL 
  AND array_length(p.testemunhas_passivo, 1) > 0
  AND p.deleted_at IS NULL;

-- Enable RLS on the view (inherits from base tables)
-- Views automatically inherit RLS from underlying tables

-- Create simplified view for processos with PII masking
CREATE OR REPLACE VIEW public.vw_processos_publicos AS
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
  CASE WHEN p.segredo_justica 
       THEN left(p.reclamante_nome, 2) || '***'
       ELSE p.reclamante_nome 
  END as reclamante_nome,
  p.reclamante_cpf_mask,
  CASE WHEN p.segredo_justica 
       THEN left(p.reu_nome, 2) || '***'
       ELSE p.reu_nome 
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
  p.segredo_justica
FROM public.processos p
WHERE p.deleted_at IS NULL;