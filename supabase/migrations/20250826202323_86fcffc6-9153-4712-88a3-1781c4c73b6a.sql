-- Create hubjuria schema for Mapa de Testemunhas module
CREATE SCHEMA IF NOT EXISTS hubjuria;

-- Tabela: Por Processo
CREATE TABLE IF NOT EXISTS hubjuria.por_processo (
  cnj text PRIMARY KEY,
  status text,
  uf char(2),
  comarca text,
  fase text,
  reclamante_limpo text,
  advogados_parte_ativa text[],
  testemunhas_ativo_limpo text[],
  testemunhas_passivo_limpo text[],
  todas_testemunhas text[],
  reclamante_foi_testemunha boolean,
  qtd_vezes_reclamante_foi_testemunha int,
  cnjs_em_que_reclamante_foi_testemunha text[],
  reclamante_testemunha_polo_passivo boolean,
  cnjs_passivo text[],
  troca_direta boolean,
  desenho_troca_direta text,
  cnjs_troca_direta text[],
  triangulacao_confirmada boolean,
  desenho_triangulacao text,
  cnjs_triangulacao text[],
  testemunha_do_reclamante_ja_foi_testemunha_antes boolean,
  qtd_total_depos_unicos int,
  cnjs_depos_unicos text[],
  contem_prova_emprestada boolean,
  testemunhas_prova_emprestada text[],
  classificacao_final text,
  insight_estrategico text,
  org_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela: Por Testemunha
CREATE TABLE IF NOT EXISTS hubjuria.por_testemunha (
  nome_testemunha text PRIMARY KEY,
  qtd_depoimentos int,
  cnjs_como_testemunha text[],
  ja_foi_reclamante boolean,
  cnjs_como_reclamante text[],
  foi_testemunha_ativo boolean,
  cnjs_ativo text[],
  foi_testemunha_passivo boolean,
  cnjs_passivo text[],
  foi_testemunha_em_ambos_polos boolean,
  participou_troca_favor boolean,
  cnjs_troca_favor text[],
  participou_triangulacao boolean,
  cnjs_triangulacao text[],
  e_prova_emprestada boolean,
  classificacao text,
  classificacao_estrategica text,
  org_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Staging tables
CREATE TABLE IF NOT EXISTS hubjuria.stg_por_processo (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  raw jsonb,
  org_id uuid,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS hubjuria.stg_por_testemunha (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  raw jsonb,
  org_id uuid,
  created_at timestamptz DEFAULT now()
);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION hubjuria.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN 
  NEW.updated_at = now(); 
  RETURN NEW; 
END $$;

-- Apply triggers
DROP TRIGGER IF EXISTS trg_pp_set_updated ON hubjuria.por_processo;
CREATE TRIGGER trg_pp_set_updated 
  BEFORE UPDATE ON hubjuria.por_processo
  FOR EACH ROW EXECUTE FUNCTION hubjuria.set_updated_at();

DROP TRIGGER IF EXISTS trg_pt_set_updated ON hubjuria.por_testemunha;
CREATE TRIGGER trg_pt_set_updated 
  BEFORE UPDATE ON hubjuria.por_testemunha
  FOR EACH ROW EXECUTE FUNCTION hubjuria.set_updated_at();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_pp_uf ON hubjuria.por_processo(uf);
CREATE INDEX IF NOT EXISTS idx_pp_status ON hubjuria.por_processo(status);
CREATE INDEX IF NOT EXISTS idx_pp_org ON hubjuria.por_processo(org_id);
CREATE INDEX IF NOT EXISTS idx_pt_qtd ON hubjuria.por_testemunha(qtd_depoimentos DESC);
CREATE INDEX IF NOT EXISTS idx_pt_org ON hubjuria.por_testemunha(org_id);

-- Utility function to parse lists
CREATE OR REPLACE FUNCTION hubjuria.parse_list(src text)
RETURNS text[] LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE
    WHEN src IS NULL OR btrim(src) IN ('', '[]', ';') THEN array[]::text[]
    WHEN left(btrim(src),1)='[' THEN (
      SELECT coalesce(array_agg(x.elem::text), array[]::text[])
      FROM (SELECT trim(both '"' from json_array_elements(replace(src, '''','"')::json)::text) as elem) x
    )
    ELSE regexp_split_to_array(src, '\s*;\s*|\s*,\s*')
  END;
$$;

-- Enable RLS
ALTER TABLE hubjuria.por_processo ENABLE ROW LEVEL SECURITY;
ALTER TABLE hubjuria.por_testemunha ENABLE ROW LEVEL SECURITY;
ALTER TABLE hubjuria.stg_por_processo ENABLE ROW LEVEL SECURITY;
ALTER TABLE hubjuria.stg_por_testemunha ENABLE ROW LEVEL SECURITY;

-- RLS Policies using existing profiles table
CREATE POLICY "select_org_pp" ON hubjuria.por_processo
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.organization_id = por_processo.org_id
  ));

CREATE POLICY "mod_org_pp" ON hubjuria.por_processo
  FOR ALL USING (EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.organization_id = por_processo.org_id
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.organization_id = por_processo.org_id
  ));

CREATE POLICY "select_org_pt" ON hubjuria.por_testemunha
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.organization_id = por_testemunha.org_id
  ));

CREATE POLICY "mod_org_pt" ON hubjuria.por_testemunha
  FOR ALL USING (EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.organization_id = por_testemunha.org_id
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.organization_id = por_testemunha.org_id
  ));

CREATE POLICY "select_org_stg_pp" ON hubjuria.stg_por_processo
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.organization_id = stg_por_processo.org_id
  ));

CREATE POLICY "mod_org_stg_pp" ON hubjuria.stg_por_processo
  FOR ALL USING (EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.organization_id = stg_por_processo.org_id
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.organization_id = stg_por_processo.org_id
  ));

CREATE POLICY "select_org_stg_pt" ON hubjuria.stg_por_testemunha
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.organization_id = stg_por_testemunha.org_id
  ));

CREATE POLICY "mod_org_stg_pt" ON hubjuria.stg_por_testemunha
  FOR ALL USING (EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.organization_id = stg_por_testemunha.org_id
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.organization_id = stg_por_testemunha.org_id
  ));