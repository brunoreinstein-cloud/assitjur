-- Create admin page tables for dataset management and organization control

-- Organizations table (already exists, but let's enhance it)
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS domain text,
ADD COLUMN IF NOT EXISTS require_2fa boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS export_limit text DEFAULT 'ROLE_BASED',
ADD COLUMN IF NOT EXISTS retention_months integer DEFAULT 24;

-- Dataset versions for base management
CREATE TABLE IF NOT EXISTS public.dataset_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  status text CHECK (status IN ('DRAFT','PUBLISHED')) NOT NULL DEFAULT 'DRAFT',
  hash text NOT NULL,
  version_number integer NOT NULL DEFAULT 1,
  description text,
  created_by uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  published_at timestamptz,
  is_active boolean DEFAULT false
);

-- Dataset files for upload tracking
CREATE TABLE IF NOT EXISTS public.dataset_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id uuid REFERENCES dataset_versions(id) ON DELETE CASCADE NOT NULL,
  storage_path text NOT NULL,
  original_filename text NOT NULL,
  file_size bigint,
  rows_count integer,
  validation_report jsonb,
  uploaded_by uuid NOT NULL,
  uploaded_at timestamptz DEFAULT now()
);

-- Pessoas table for normalized person data
CREATE TABLE IF NOT EXISTS public.pessoas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  nome_civil text NOT NULL,
  cpf_mask text,
  apelidos text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Processos table for normalized process data
CREATE TABLE IF NOT EXISTS public.processos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  version_id uuid REFERENCES dataset_versions(id) ON DELETE CASCADE,
  cnj text NOT NULL,
  cnj_normalizado text NOT NULL,
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
  reclamante_foi_testemunha boolean DEFAULT false,
  troca_direta boolean DEFAULT false,
  triangulacao_confirmada boolean DEFAULT false,
  prova_emprestada boolean DEFAULT false,
  classificacao_final text,
  score_risco integer,
  observacoes text,
  deleted_at timestamptz,
  deleted_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Import jobs for tracking upload processing
CREATE TABLE IF NOT EXISTS public.import_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  file_id uuid REFERENCES dataset_files(id) ON DELETE CASCADE NOT NULL,
  status text CHECK (status IN ('QUEUED','RUNNING','COMPLETED','FAILED')) DEFAULT 'QUEUED',
  progress integer DEFAULT 0,
  error_message text,
  started_at timestamptz,
  completed_at timestamptz,
  created_by uuid NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Import errors for detailed error tracking
CREATE TABLE IF NOT EXISTS public.import_errors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid REFERENCES import_jobs(id) ON DELETE CASCADE NOT NULL,
  row_number integer,
  column_name text,
  error_type text NOT NULL,
  error_message text NOT NULL,
  raw_value text,
  created_at timestamptz DEFAULT now()
);

-- System parameters for global configuration
CREATE TABLE IF NOT EXISTS public.system_parameters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  parameter_key text NOT NULL,
  parameter_value jsonb NOT NULL,
  description text,
  updated_by uuid NOT NULL,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(org_id, parameter_key)
);

-- Enable RLS on all tables
ALTER TABLE public.dataset_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dataset_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pessoas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_errors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_parameters ENABLE ROW LEVEL SECURITY;

-- RLS Policies for dataset_versions
CREATE POLICY "Users can view their organization dataset versions" ON public.dataset_versions
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.organization_id = dataset_versions.org_id
  )
);

CREATE POLICY "Only admins can manage dataset versions" ON public.dataset_versions
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.organization_id = dataset_versions.org_id 
    AND p.role = 'ADMIN'
  )
);

-- RLS Policies for dataset_files
CREATE POLICY "Users can view their organization dataset files" ON public.dataset_files
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles p
    JOIN dataset_versions dv ON dv.org_id = p.organization_id
    WHERE p.user_id = auth.uid() 
    AND dv.id = dataset_files.version_id
  )
);

CREATE POLICY "Only admins can manage dataset files" ON public.dataset_files
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles p
    JOIN dataset_versions dv ON dv.org_id = p.organization_id
    WHERE p.user_id = auth.uid() 
    AND dv.id = dataset_files.version_id
    AND p.role = 'ADMIN'
  )
);

-- RLS Policies for pessoas
CREATE POLICY "Users can view their organization pessoas" ON public.pessoas
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.organization_id = pessoas.org_id
  )
);

CREATE POLICY "Only admins can manage pessoas" ON public.pessoas
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.organization_id = pessoas.org_id 
    AND p.role = 'ADMIN'
  )
);

-- RLS Policies for processos
CREATE POLICY "Users can view their organization processos" ON public.processos
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.organization_id = processos.org_id
  )
);

CREATE POLICY "Only admins can manage processos" ON public.processos
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.organization_id = processos.org_id 
    AND p.role = 'ADMIN'
  )
);

-- RLS Policies for import_jobs
CREATE POLICY "Users can view their organization import jobs" ON public.import_jobs
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.organization_id = import_jobs.org_id
  )
);

CREATE POLICY "Only admins can manage import jobs" ON public.import_jobs
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.organization_id = import_jobs.org_id 
    AND p.role = 'ADMIN'
  )
);

-- RLS Policies for import_errors
CREATE POLICY "Users can view their organization import errors" ON public.import_errors
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles p
    JOIN import_jobs ij ON ij.org_id = p.organization_id
    WHERE p.user_id = auth.uid() 
    AND ij.id = import_errors.job_id
  )
);

-- RLS Policies for system_parameters
CREATE POLICY "Users can view their organization parameters" ON public.system_parameters
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.organization_id = system_parameters.org_id
  )
);

CREATE POLICY "Only admins can manage system parameters" ON public.system_parameters
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.organization_id = system_parameters.org_id 
    AND p.role = 'ADMIN'
  )
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_dataset_versions_org_id ON dataset_versions(org_id);
CREATE INDEX IF NOT EXISTS idx_dataset_versions_status ON dataset_versions(status);
CREATE INDEX IF NOT EXISTS idx_dataset_versions_is_active ON dataset_versions(is_active);
CREATE INDEX IF NOT EXISTS idx_dataset_files_version_id ON dataset_files(version_id);
CREATE INDEX IF NOT EXISTS idx_pessoas_org_id ON pessoas(org_id);
CREATE INDEX IF NOT EXISTS idx_processos_org_id ON processos(org_id);
CREATE INDEX IF NOT EXISTS idx_processos_cnj_normalizado ON processos(cnj_normalizado);
CREATE INDEX IF NOT EXISTS idx_processos_version_id ON processos(version_id);
CREATE INDEX IF NOT EXISTS idx_import_jobs_org_id ON import_jobs(org_id);
CREATE INDEX IF NOT EXISTS idx_import_jobs_status ON import_jobs(status);
CREATE INDEX IF NOT EXISTS idx_system_parameters_org_id ON system_parameters(org_id);

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_pessoas_updated_at BEFORE UPDATE ON pessoas
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_processos_updated_at BEFORE UPDATE ON processos
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default system parameters
INSERT INTO system_parameters (org_id, parameter_key, parameter_value, description, updated_by)
SELECT 
  o.id,
  'triangulation_window_months',
  '6'::jsonb,
  'Janela de triangulação em meses',
  '00000000-0000-0000-0000-000000000000'::uuid
FROM organizations o
ON CONFLICT (org_id, parameter_key) DO NOTHING;

INSERT INTO system_parameters (org_id, parameter_key, parameter_value, description, updated_by)
SELECT 
  o.id,
  'score_weights',
  '{"reclamante_foi_testemunha": 0.3, "troca_direta": 0.4, "triangulacao_confirmada": 0.2, "prova_emprestada": 0.1}'::jsonb,
  'Pesos para cálculo do score de risco',
  '00000000-0000-0000-0000-000000000000'::uuid
FROM organizations o
ON CONFLICT (org_id, parameter_key) DO NOTHING;

INSERT INTO system_parameters (org_id, parameter_key, parameter_value, description, updated_by)
SELECT 
  o.id,
  'cpf_mask_enabled',
  'true'::jsonb,
  'Habilitar máscara de CPF',
  '00000000-0000-0000-0000-000000000000'::uuid
FROM organizations o
ON CONFLICT (org_id, parameter_key) DO NOTHING;