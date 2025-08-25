-- Create tables for OpenAI integration management

-- Organization OpenAI settings
CREATE TABLE public.org_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL,
  openai_enabled BOOLEAN NOT NULL DEFAULT false,
  model TEXT NOT NULL DEFAULT 'gpt-4o-mini',
  fallback TEXT[] DEFAULT '{}',
  temperature FLOAT NOT NULL DEFAULT 0.7,
  top_p FLOAT NOT NULL DEFAULT 0.9,
  max_output_tokens INTEGER NOT NULL DEFAULT 2000,
  streaming BOOLEAN NOT NULL DEFAULT false,
  rate_per_min INTEGER NOT NULL DEFAULT 60,
  budget_month_cents INTEGER NOT NULL DEFAULT 10000,
  schema_json JSONB NOT NULL DEFAULT '{}',
  prompt_active_id UUID,
  ab_weights JSONB DEFAULT '{}',
  updated_by UUID NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(org_id)
);

-- OpenAI API Keys (only metadata, actual keys stored in secrets)
CREATE TABLE public.openai_keys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL,
  alias TEXT NOT NULL,
  last_four TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Prompt templates with versioning
CREATE TABLE public.prompts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL,
  label TEXT NOT NULL,
  content TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT false,
  template_type TEXT NOT NULL DEFAULT 'general', -- 'processo', 'testemunha', 'general'
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- OpenAI API usage logs
CREATE TABLE public.openai_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL,
  user_id UUID NOT NULL,
  prompt_id UUID,
  prompt_version INTEGER,
  model TEXT NOT NULL,
  streaming BOOLEAN NOT NULL DEFAULT false,
  tokens_in INTEGER NOT NULL DEFAULT 0,
  tokens_out INTEGER NOT NULL DEFAULT 0,
  cost_cents INTEGER NOT NULL DEFAULT 0,
  duration_ms INTEGER NOT NULL DEFAULT 0,
  status_code INTEGER NOT NULL DEFAULT 200,
  error_code TEXT,
  hash_base TEXT,
  request_type TEXT NOT NULL DEFAULT 'chat', -- 'chat', 'test', 'playground'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Test cases and snapshots
CREATE TABLE public.openai_test_cases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL,
  name TEXT NOT NULL,
  input_data JSONB NOT NULL,
  expected_output JSONB,
  last_result JSONB,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.org_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.openai_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.openai_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.openai_test_cases ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Users can view their organization data
CREATE POLICY "Users can view their organization settings" 
ON public.org_settings 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM profiles p 
  WHERE p.user_id = auth.uid() AND p.organization_id = org_settings.org_id
));

CREATE POLICY "Users can view their organization keys" 
ON public.openai_keys 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM profiles p 
  WHERE p.user_id = auth.uid() AND p.organization_id = openai_keys.org_id
));

CREATE POLICY "Users can view their organization prompts" 
ON public.prompts 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM profiles p 
  WHERE p.user_id = auth.uid() AND p.organization_id = prompts.org_id
));

CREATE POLICY "Users can view their organization logs" 
ON public.openai_logs 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM profiles p 
  WHERE p.user_id = auth.uid() AND p.organization_id = openai_logs.org_id
));

CREATE POLICY "Users can view their organization test cases" 
ON public.openai_test_cases 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM profiles p 
  WHERE p.user_id = auth.uid() AND p.organization_id = openai_test_cases.org_id
));

-- RLS Policies - Only ADMINs can manage data
CREATE POLICY "Only admins can manage org settings" 
ON public.org_settings 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles p 
  WHERE p.user_id = auth.uid() AND p.organization_id = org_settings.org_id AND p.role = 'ADMIN'
));

CREATE POLICY "Only admins can manage openai keys" 
ON public.openai_keys 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles p 
  WHERE p.user_id = auth.uid() AND p.organization_id = openai_keys.org_id AND p.role = 'ADMIN'
));

CREATE POLICY "Only admins can manage prompts" 
ON public.prompts 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles p 
  WHERE p.user_id = auth.uid() AND p.organization_id = prompts.org_id AND p.role = 'ADMIN'
));

CREATE POLICY "Only admins can manage test cases" 
ON public.openai_test_cases 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles p 
  WHERE p.user_id = auth.uid() AND p.organization_id = openai_test_cases.org_id AND p.role = 'ADMIN'
));

-- System can insert logs
CREATE POLICY "System can insert openai logs" 
ON public.openai_logs 
FOR INSERT 
WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX idx_org_settings_org_id ON public.org_settings(org_id);
CREATE INDEX idx_openai_keys_org_id ON public.openai_keys(org_id);
CREATE INDEX idx_prompts_org_id ON public.prompts(org_id);
CREATE INDEX idx_openai_logs_org_id ON public.openai_logs(org_id);
CREATE INDEX idx_openai_logs_created_at ON public.openai_logs(created_at DESC);
CREATE INDEX idx_openai_test_cases_org_id ON public.openai_test_cases(org_id);

-- Create trigger for updated_at
CREATE TRIGGER update_org_settings_updated_at
  BEFORE UPDATE ON public.org_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_openai_keys_updated_at
  BEFORE UPDATE ON public.openai_keys
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_prompts_updated_at
  BEFORE UPDATE ON public.prompts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_openai_test_cases_updated_at
  BEFORE UPDATE ON public.openai_test_cases
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();