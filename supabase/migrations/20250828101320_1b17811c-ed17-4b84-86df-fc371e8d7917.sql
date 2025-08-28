-- Fase 1 Corrigida: Alinhamento do Schema (com tratamento de duplicatas)

-- 1.1 Criar staging table para importação segura
CREATE TABLE IF NOT EXISTS public.stg_processos (
  cnj text,
  reclamante_limpo text,
  reu_nome text,
  comarca text,
  tribunal text,
  vara text,
  fase text,
  status text,
  reclamante_cpf text,
  data_audiencia text,
  observacoes text,
  cnj_digits text,
  row_number integer,
  import_job_id uuid
);

-- 1.2 Adicionar coluna cnj_digits à tabela processos se não existir
ALTER TABLE public.processos 
ADD COLUMN IF NOT EXISTS cnj_digits text;

-- 1.3 Popular cnj_digits removendo duplicatas
DO $$
BEGIN
  -- Primeiro popular cnj_digits
  UPDATE public.processos 
  SET cnj_digits = cnj_normalizado 
  WHERE cnj_digits IS NULL AND cnj_normalizado IS NOT NULL;
  
  -- Remover duplicatas mantendo o registro mais recente
  WITH duplicates AS (
    SELECT id,
           ROW_NUMBER() OVER (PARTITION BY org_id, cnj_digits ORDER BY created_at DESC) as rn
    FROM public.processos 
    WHERE cnj_digits IS NOT NULL AND deleted_at IS NULL
  )
  UPDATE public.processos 
  SET deleted_at = now(), 
      deleted_by = (SELECT id FROM profiles WHERE role = 'ADMIN' LIMIT 1)
  WHERE id IN (
    SELECT id FROM duplicates WHERE rn > 1
  );
END $$;

-- 1.4 Criar índice único após limpeza
CREATE UNIQUE INDEX IF NOT EXISTS processos_org_cnj_digits_unique 
ON public.processos (org_id, cnj_digits) 
WHERE deleted_at IS NULL;

-- 1.5 Criar índices de performance
CREATE INDEX IF NOT EXISTS processos_cnj_digits_idx ON public.processos (cnj_digits);
CREATE INDEX IF NOT EXISTS stg_processos_cnj_digits_idx ON public.stg_processos (cnj_digits);