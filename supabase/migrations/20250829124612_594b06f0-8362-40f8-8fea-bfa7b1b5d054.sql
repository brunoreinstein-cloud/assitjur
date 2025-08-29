-- Phase 1: Schema corrections based on actual schema

-- 1.1 Create padroes_agregados table (main missing piece)
CREATE TABLE IF NOT EXISTS hubjuria.padroes_agregados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  
  -- Counters
  total_processos integer DEFAULT 0,
  processos_com_triangulacao integer DEFAULT 0,
  processos_com_troca_direta integer DEFAULT 0,
  processos_com_duplo_papel integer DEFAULT 0,
  processos_com_prova_emprestada integer DEFAULT 0,
  
  -- Professional witnesses (>10 testimonies)
  testemunhas_profissionais jsonb DEFAULT '[]'::jsonb,
  
  -- Frequent lawyers
  advogados_recorrentes jsonb DEFAULT '[]'::jsonb,
  
  -- Geographic concentration
  concentracao_uf jsonb DEFAULT '{}'::jsonb,
  concentracao_comarca jsonb DEFAULT '{}'::jsonb,
  
  -- Temporal trends
  tendencia_temporal jsonb DEFAULT '{}'::jsonb,
  
  -- Metadata
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  CONSTRAINT padroes_agregados_org_unique UNIQUE (org_id)
);

-- 1.2 Add missing normalized name column to por_testemunha
ALTER TABLE hubjuria.por_testemunha 
ADD COLUMN IF NOT EXISTS nome_testemunha_normalizado text;

-- Populate normalized names
UPDATE hubjuria.por_testemunha 
SET nome_testemunha_normalizado = initcap(trim(nome_testemunha))
WHERE nome_testemunha_normalizado IS NULL;

-- 1.3 Add composite unique constraints
ALTER TABLE hubjuria.por_processo 
DROP CONSTRAINT IF EXISTS por_processo_org_cnj_unique,
ADD CONSTRAINT por_processo_org_cnj_unique UNIQUE (org_id, cnj);

ALTER TABLE hubjuria.por_testemunha 
DROP CONSTRAINT IF EXISTS por_testemunha_org_nome_unique,
ADD CONSTRAINT por_testemunha_org_nome_unique UNIQUE (org_id, nome_testemunha_normalizado);

-- 1.4 Create optimized indexes
CREATE INDEX IF NOT EXISTS idx_por_processo_org_uf_comarca 
ON hubjuria.por_processo (org_id, uf, comarca);

CREATE INDEX IF NOT EXISTS idx_por_processo_advogados_gin 
ON hubjuria.por_processo USING gin (advogados_parte_ativa);

CREATE INDEX IF NOT EXISTS idx_por_processo_testemunhas_gin 
ON hubjuria.por_processo USING gin (testemunhas_ativo_limpo, testemunhas_passivo_limpo);

CREATE INDEX IF NOT EXISTS idx_por_testemunha_org_qtd 
ON hubjuria.por_testemunha (org_id, qtd_depoimentos DESC);

CREATE INDEX IF NOT EXISTS idx_por_testemunha_cnjs_gin 
ON hubjuria.por_testemunha USING gin (cnjs_como_testemunha);

-- 1.5 Enable RLS on padroes_agregados
ALTER TABLE hubjuria.padroes_agregados ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their organization aggregates"
ON hubjuria.padroes_agregados FOR SELECT
USING (EXISTS (
  SELECT 1 FROM profiles p 
  WHERE p.user_id = auth.uid() 
  AND p.organization_id = padroes_agregados.org_id
));

CREATE POLICY "Only admins can manage aggregates"
ON hubjuria.padroes_agregados FOR ALL
USING (EXISTS (
  SELECT 1 FROM profiles p 
  WHERE p.user_id = auth.uid() 
  AND p.organization_id = padroes_agregados.org_id 
  AND p.role = 'ADMIN'::user_role
));

-- 1.6 Create update trigger for padroes_agregados
CREATE TRIGGER update_padroes_agregados_updated_at
BEFORE UPDATE ON hubjuria.padroes_agregados
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();