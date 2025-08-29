-- Criar schema assistjur
CREATE SCHEMA IF NOT EXISTS assistjur;

-- Tabela final: Por Processo
CREATE TABLE assistjur.por_processo (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL,
  cnj TEXT NOT NULL,
  status TEXT,
  fase TEXT,
  uf TEXT,
  comarca TEXT,
  reclamantes TEXT[] DEFAULT '{}',
  advogados_ativo TEXT[] DEFAULT '{}',
  testemunhas_ativo TEXT[] DEFAULT '{}',
  testemunhas_passivo TEXT[] DEFAULT '{}',
  todas_testemunhas TEXT[] DEFAULT '{}',
  
  -- Flags analíticas derivadas
  triangulacao_confirmada BOOLEAN DEFAULT false,
  desenho_triangulacao TEXT,
  cnjs_triangulacao TEXT[] DEFAULT '{}',
  contem_prova_emprestada BOOLEAN DEFAULT false,
  testemunhas_prova_emprestada TEXT[] DEFAULT '{}',
  reclamante_foi_testemunha BOOLEAN DEFAULT false,
  qtd_reclamante_testemunha INTEGER DEFAULT 0,
  cnjs_reclamante_testemunha TEXT[] DEFAULT '{}',
  reclamante_testemunha_polo_passivo BOOLEAN DEFAULT false,
  cnjs_passivo TEXT[] DEFAULT '{}',
  troca_direta BOOLEAN DEFAULT false,
  cnjs_troca_direta TEXT[] DEFAULT '{}',
  classificacao_final TEXT,
  insight_estrategico TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  upload_id UUID,
  
  UNIQUE(org_id, cnj)
);

-- Tabela final: Por Testemunha  
CREATE TABLE assistjur.por_testemunha (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL,
  nome_testemunha TEXT NOT NULL,
  qtd_depoimentos INTEGER NOT NULL DEFAULT 0,
  cnjs_como_testemunha TEXT[] DEFAULT '{}',
  ja_foi_reclamante BOOLEAN DEFAULT false,
  cnjs_como_reclamante TEXT[] DEFAULT '{}',
  foi_testemunha_ativo BOOLEAN DEFAULT false,
  foi_testemunha_passivo BOOLEAN DEFAULT false,
  cnjs_passivo TEXT[] DEFAULT '{}',
  foi_ambos_polos BOOLEAN DEFAULT false,
  participou_troca_favor BOOLEAN DEFAULT false,
  cnjs_troca_favor TEXT[] DEFAULT '{}',
  participou_triangulacao BOOLEAN DEFAULT false,
  cnjs_triangulacao TEXT[] DEFAULT '{}',
  e_prova_emprestada BOOLEAN DEFAULT false,
  classificacao TEXT,
  classificacao_estrategica TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  upload_id UUID,
  
  UNIQUE(org_id, nome_testemunha, cnjs_como_testemunha)
);

-- Tabela staging: Por Processo
CREATE TABLE assistjur._stg_processo (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL,
  upload_id UUID NOT NULL,
  row_number INTEGER NOT NULL,
  
  -- Dados brutos normalizados
  cnj TEXT,
  status TEXT,
  fase TEXT,
  uf TEXT,
  comarca TEXT,
  reclamantes TEXT[] DEFAULT '{}',
  advogados_ativo TEXT[] DEFAULT '{}',
  testemunhas_ativo TEXT[] DEFAULT '{}',
  testemunhas_passivo TEXT[] DEFAULT '{}',
  todas_testemunhas TEXT[] DEFAULT '{}',
  
  -- Flags e validações
  is_valid BOOLEAN DEFAULT false,
  validation_errors JSONB DEFAULT '[]',
  precisa_completar BOOLEAN DEFAULT false,
  is_stub BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela staging: Por Testemunha
CREATE TABLE assistjur._stg_testemunha (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL,
  upload_id UUID NOT NULL,
  row_number INTEGER NOT NULL,
  
  -- Dados brutos normalizados
  nome_testemunha TEXT,
  qtd_depoimentos INTEGER,
  cnjs_como_testemunha TEXT[] DEFAULT '{}',
  
  -- Flags e validações
  is_valid BOOLEAN DEFAULT false,
  validation_errors JSONB DEFAULT '[]',
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de logs de importação
CREATE TABLE assistjur._ingest_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL,
  upload_id UUID NOT NULL,
  
  -- Metadata do arquivo
  filename TEXT NOT NULL,
  file_size BIGINT,
  
  -- Resultados da importação
  total_sheets INTEGER DEFAULT 0,
  total_rows INTEGER DEFAULT 0,
  valid_rows INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  warning_count INTEGER DEFAULT 0,
  success_rate DECIMAL(5,2),
  
  -- Detalhes técnicos
  processing_duration_ms INTEGER,
  validation_report JSONB,
  issues JSONB DEFAULT '[]',
  
  -- Estados
  status TEXT NOT NULL DEFAULT 'processing', -- processing, completed, failed
  error_message TEXT,
  
  -- Auditoria
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Índices para performance
CREATE INDEX idx_assistjur_por_processo_org_cnj ON assistjur.por_processo(org_id, cnj);
CREATE INDEX idx_assistjur_por_processo_upload ON assistjur.por_processo(upload_id);
CREATE INDEX idx_assistjur_por_testemunha_org_nome ON assistjur.por_testemunha(org_id, nome_testemunha);
CREATE INDEX idx_assistjur_por_testemunha_upload ON assistjur.por_testemunha(upload_id);
CREATE INDEX idx_assistjur_stg_processo_upload ON assistjur._stg_processo(upload_id);
CREATE INDEX idx_assistjur_stg_testemunha_upload ON assistjur._stg_testemunha(upload_id);
CREATE INDEX idx_assistjur_ingest_logs_org_status ON assistjur._ingest_logs(org_id, status);

-- Triggers para updated_at
CREATE TRIGGER update_assistjur_por_processo_updated_at
  BEFORE UPDATE ON assistjur.por_processo
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_assistjur_por_testemunha_updated_at  
  BEFORE UPDATE ON assistjur.por_testemunha
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies
ALTER TABLE assistjur.por_processo ENABLE ROW LEVEL SECURITY;
ALTER TABLE assistjur.por_testemunha ENABLE ROW LEVEL SECURITY;
ALTER TABLE assistjur._stg_processo ENABLE ROW LEVEL SECURITY;
ALTER TABLE assistjur._stg_testemunha ENABLE ROW LEVEL SECURITY;
ALTER TABLE assistjur._ingest_logs ENABLE ROW LEVEL SECURITY;

-- Policies para tabelas finais
CREATE POLICY "Users can view their org data" ON assistjur.por_processo
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.organization_id = org_id)
  );

CREATE POLICY "Admins can manage their org data" ON assistjur.por_processo
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.organization_id = org_id AND p.role = 'ADMIN')
  );

CREATE POLICY "Users can view their org data" ON assistjur.por_testemunha
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.organization_id = org_id)
  );

CREATE POLICY "Admins can manage their org data" ON assistjur.por_testemunha
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.organization_id = org_id AND p.role = 'ADMIN')
  );

-- Policies para staging (apenas admins)
CREATE POLICY "Admins can manage staging data" ON assistjur._stg_processo
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.organization_id = org_id AND p.role = 'ADMIN')
  );

CREATE POLICY "Admins can manage staging data" ON assistjur._stg_testemunha
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.organization_id = org_id AND p.role = 'ADMIN')
  );

-- Policies para logs
CREATE POLICY "Users can view their org logs" ON assistjur._ingest_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.organization_id = org_id)
  );

CREATE POLICY "System can insert logs" ON assistjur._ingest_logs
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can manage logs" ON assistjur._ingest_logs
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.organization_id = org_id AND p.role = 'ADMIN')
  );