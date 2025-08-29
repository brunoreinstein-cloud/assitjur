-- Fix security definer view issue by adding proper search_path to all functions
-- This addresses the security warnings from the linter

-- Fix search_path for existing functions to make them more secure
ALTER FUNCTION public.update_updated_at_column() SET search_path = 'public';
ALTER FUNCTION public.cleanup_staging(uuid) SET search_path = 'public';
ALTER FUNCTION public.log_user_action(text, text, uuid, jsonb) SET search_path = 'public';
ALTER FUNCTION public.check_rate_limit(text, integer, integer) SET search_path = 'public';
ALTER FUNCTION public.sanitize_input(text) SET search_path = 'public';
ALTER FUNCTION public.handle_new_user() SET search_path = 'public';
ALTER FUNCTION public.get_pessoas_masked(uuid) SET search_path = 'public';
ALTER FUNCTION public.audit_critical_operations() SET search_path = 'public';
ALTER FUNCTION public.cleanup_old_data() SET search_path = 'public';
ALTER FUNCTION public.mask_cpf(text) SET search_path = 'public';
ALTER FUNCTION public.mask_name(text) SET search_path = 'public';
ALTER FUNCTION public.can_access_sensitive_data(uuid) SET search_path = 'public';
ALTER FUNCTION public.get_processos_masked(uuid) SET search_path = 'public';
ALTER FUNCTION public.upsert_staging_to_final(uuid, uuid) SET search_path = 'public';
ALTER FUNCTION public.upsert_padroes_agregados(uuid, jsonb) SET search_path = 'public';
ALTER FUNCTION public.get_next_version_number(uuid) SET search_path = 'public';
ALTER FUNCTION public.rpc_get_cleanup_preview(uuid) SET search_path = 'public';
ALTER FUNCTION public.rpc_cleanup_invalid_cnjs(uuid) SET search_path = 'public';
ALTER FUNCTION public.rpc_cleanup_empty_required_fields(uuid) SET search_path = 'public';
ALTER FUNCTION public.get_current_user_role() SET search_path = 'public';
ALTER FUNCTION public.get_current_user_org() SET search_path = 'public';
ALTER FUNCTION public.rpc_cleanup_duplicates(uuid) SET search_path = 'public';
ALTER FUNCTION public.rpc_cleanup_hard_delete_old(uuid) SET search_path = 'public';
ALTER FUNCTION public.rpc_cleanup_normalize_cnjs(uuid) SET search_path = 'public';

-- Create table for LGPD compliance tracking
CREATE TABLE IF NOT EXISTS public.lgpd_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL,
  user_id UUID NOT NULL,
  request_type TEXT NOT NULL CHECK (request_type IN ('ACCESS', 'RECTIFICATION', 'DELETION', 'PORTABILITY')),
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'REJECTED')),
  requested_by_email TEXT NOT NULL,
  justification TEXT,
  response_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '30 days')
);

-- Create table for data retention policies
CREATE TABLE IF NOT EXISTS public.data_retention_policies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL,
  table_name TEXT NOT NULL,
  retention_months INTEGER NOT NULL DEFAULT 24,
  auto_cleanup BOOLEAN NOT NULL DEFAULT false,
  last_cleanup_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(org_id, table_name)
);

-- Create table for audit access logs (for LGPD compliance)
CREATE TABLE IF NOT EXISTS public.data_access_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL,
  user_id UUID NOT NULL,
  accessed_table TEXT NOT NULL,
  accessed_records UUID[],
  access_type TEXT NOT NULL CHECK (access_type IN ('SELECT', 'INSERT', 'UPDATE', 'DELETE', 'EXPORT')),
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.lgpd_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_retention_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_access_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for LGPD requests
CREATE POLICY "Users can view their organization LGPD requests" 
ON public.lgpd_requests 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM profiles p
  WHERE p.user_id = auth.uid() 
  AND p.organization_id = lgpd_requests.org_id
));

CREATE POLICY "Users can create LGPD requests for their organization" 
ON public.lgpd_requests 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM profiles p
  WHERE p.user_id = auth.uid() 
  AND p.organization_id = lgpd_requests.org_id
));

CREATE POLICY "Only admins can manage LGPD requests" 
ON public.lgpd_requests 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles p
  WHERE p.user_id = auth.uid() 
  AND p.organization_id = lgpd_requests.org_id 
  AND p.role = 'ADMIN'
));

-- RLS Policies for data retention
CREATE POLICY "Only admins can manage retention policies" 
ON public.data_retention_policies 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles p
  WHERE p.user_id = auth.uid() 
  AND p.organization_id = data_retention_policies.org_id 
  AND p.role = 'ADMIN'
));

-- RLS Policies for access logs
CREATE POLICY "Admins can view organization access logs" 
ON public.data_access_logs 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM profiles p
  WHERE p.user_id = auth.uid() 
  AND p.organization_id = data_access_logs.org_id 
  AND p.role = 'ADMIN'
));

CREATE POLICY "System can insert access logs" 
ON public.data_access_logs 
FOR INSERT 
WITH CHECK (true);

-- Function to log data access for LGPD compliance
CREATE OR REPLACE FUNCTION public.log_data_access(
  p_table_name text,
  p_record_ids uuid[] DEFAULT NULL,
  p_access_type text DEFAULT 'SELECT'
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  user_profile profiles%ROWTYPE;
BEGIN
  -- Get current user profile
  SELECT * INTO user_profile
  FROM profiles 
  WHERE user_id = auth.uid();
  
  IF user_profile IS NOT NULL THEN
    INSERT INTO data_access_logs (
      org_id,
      user_id,
      accessed_table,
      accessed_records,
      access_type,
      ip_address,
      user_agent
    ) VALUES (
      user_profile.organization_id,
      auth.uid(),
      p_table_name,
      p_record_ids,
      p_access_type,
      inet '127.0.0.1',
      'AssistJur-App'
    );
  END IF;
END;
$$;