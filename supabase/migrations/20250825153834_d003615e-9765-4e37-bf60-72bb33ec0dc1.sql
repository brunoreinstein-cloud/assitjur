-- Create RLS policies for the new tables created earlier

-- RLS Policies for dataset_versions
DROP POLICY IF EXISTS "Users can view their organization dataset versions" ON public.dataset_versions;
CREATE POLICY "Users can view their organization dataset versions" ON public.dataset_versions
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.organization_id = dataset_versions.org_id
  )
);

DROP POLICY IF EXISTS "Only admins can manage dataset versions" ON public.dataset_versions;
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
DROP POLICY IF EXISTS "Users can view their organization dataset files" ON public.dataset_files;
CREATE POLICY "Users can view their organization dataset files" ON public.dataset_files
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles p
    JOIN dataset_versions dv ON dv.org_id = p.organization_id
    WHERE p.user_id = auth.uid() 
    AND dv.id = dataset_files.version_id
  )
);

DROP POLICY IF EXISTS "Only admins can manage dataset files" ON public.dataset_files;
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
DROP POLICY IF EXISTS "Users can view their organization pessoas" ON public.pessoas;
CREATE POLICY "Users can view their organization pessoas" ON public.pessoas
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.organization_id = pessoas.org_id
  )
);

DROP POLICY IF EXISTS "Only admins can manage pessoas" ON public.pessoas;
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
DROP POLICY IF EXISTS "Users can view their organization processos" ON public.processos;
CREATE POLICY "Users can view their organization processos" ON public.processos
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.organization_id = processos.org_id
  )
);

DROP POLICY IF EXISTS "Only admins can manage processos" ON public.processos;
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
DROP POLICY IF EXISTS "Users can view their organization import jobs" ON public.import_jobs;
CREATE POLICY "Users can view their organization import jobs" ON public.import_jobs
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.organization_id = import_jobs.org_id
  )
);

DROP POLICY IF EXISTS "Only admins can manage import jobs" ON public.import_jobs;
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
DROP POLICY IF EXISTS "Users can view their organization import errors" ON public.import_errors;
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
DROP POLICY IF EXISTS "Users can view their organization parameters" ON public.system_parameters;
CREATE POLICY "Users can view their organization parameters" ON public.system_parameters
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.organization_id = system_parameters.org_id
  )
);

DROP POLICY IF EXISTS "Only admins can manage system parameters" ON public.system_parameters;
CREATE POLICY "Only admins can manage system parameters" ON public.system_parameters
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.organization_id = system_parameters.org_id 
    AND p.role = 'ADMIN'
  )
);

-- Storage policies for the hubjuria-bases bucket
INSERT INTO storage.objects (bucket_id, name, owner, metadata) VALUES ('hubjuria-bases', '.emptyFolderPlaceholder', null, '{}') ON CONFLICT DO NOTHING;

-- Create policies for hubjuria-bases bucket
CREATE POLICY "Users can view their organization files" ON storage.objects
FOR SELECT USING (
  bucket_id = 'hubjuria-bases' AND
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = auth.uid() 
    AND POSITION(p.organization_id::text IN name) = 1
  )
);

CREATE POLICY "Only admins can upload files" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'hubjuria-bases' AND
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role = 'ADMIN'
    AND POSITION(p.organization_id::text IN name) = 1
  )
);

CREATE POLICY "Only admins can delete files" ON storage.objects
FOR DELETE USING (
  bucket_id = 'hubjuria-bases' AND
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role = 'ADMIN'
    AND POSITION(p.organization_id::text IN name) = 1
  )
);

-- Insert default system parameters for existing organizations
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