-- Criar tabela de versões no schema public (não há schema assistjur ainda)
CREATE TABLE IF NOT EXISTS public.versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  number integer NOT NULL,
  status text NOT NULL CHECK (status IN ('draft','published','archived')),
  summary jsonb DEFAULT '{}'::jsonb,
  file_checksum text,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  published_at timestamptz,
  CONSTRAINT unique_version_number UNIQUE (org_id, number)
);

-- Adicionar RLS
ALTER TABLE public.versions ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view org versions" ON public.versions 
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() AND organization_id = versions.org_id
  )
);

CREATE POLICY "Only admins can manage versions" ON public.versions 
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND organization_id = versions.org_id 
    AND role = 'ADMIN'
  )
);

-- Adicionar version_id às tabelas existentes
ALTER TABLE public.processos ADD COLUMN IF NOT EXISTS version_id uuid REFERENCES public.versions(id);

-- Índices para performance
CREATE INDEX IF NOT EXISTS ix_processos_version ON public.processos(org_id, version_id);
CREATE INDEX IF NOT EXISTS ix_versions_org_status ON public.versions(org_id, status);

-- Views "live" para dados publicados
CREATE OR REPLACE VIEW public.processos_live AS
  SELECT p.* FROM public.processos p
  JOIN public.versions v ON v.id = p.version_id 
  WHERE v.status = 'published' AND v.org_id = p.org_id;

-- Função para buscar próximo número de versão
CREATE OR REPLACE FUNCTION public.get_next_version_number(p_org_id uuid)
RETURNS integer
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(MAX(number), 0) + 1 
  FROM versions 
  WHERE org_id = p_org_id;
$$;