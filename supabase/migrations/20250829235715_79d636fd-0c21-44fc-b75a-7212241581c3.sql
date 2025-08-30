-- Create automated data retention system
-- This addresses Fase 2 requirements for LGPD compliance

-- Create table for retention policies configuration
CREATE TABLE IF NOT EXISTS public.retention_policies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL,
  table_name TEXT NOT NULL,
  retention_months INTEGER NOT NULL DEFAULT 24,
  auto_cleanup BOOLEAN NOT NULL DEFAULT false,
  cleanup_field TEXT NOT NULL DEFAULT 'created_at',
  conditions JSONB DEFAULT '{}',
  last_cleanup_at TIMESTAMP WITH TIME ZONE,
  next_cleanup_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(org_id, table_name)
);

-- Create cleanup job logs
CREATE TABLE IF NOT EXISTS public.cleanup_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL,
  policy_id UUID NOT NULL REFERENCES retention_policies(id),
  table_name TEXT NOT NULL,
  records_affected INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('STARTED', 'COMPLETED', 'FAILED', 'SKIPPED')),
  error_message TEXT,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'
);

-- Enable RLS
ALTER TABLE public.retention_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cleanup_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for retention_policies
CREATE POLICY "Admins can manage retention policies" 
ON public.retention_policies 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles p
  WHERE p.user_id = auth.uid() 
  AND p.organization_id = retention_policies.org_id 
  AND p.role = 'ADMIN'
));

CREATE POLICY "Users can view their org retention policies" 
ON public.retention_policies 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM profiles p
  WHERE p.user_id = auth.uid() 
  AND p.organization_id = retention_policies.org_id
));

-- RLS Policies for cleanup_logs
CREATE POLICY "Admins can view cleanup logs" 
ON public.cleanup_logs 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM profiles p
  WHERE p.user_id = auth.uid() 
  AND p.organization_id = cleanup_logs.org_id 
  AND p.role = 'ADMIN'
));

CREATE POLICY "System can insert cleanup logs" 
ON public.cleanup_logs 
FOR INSERT 
WITH CHECK (true);

-- Function to calculate next cleanup date
CREATE OR REPLACE FUNCTION public.calculate_next_cleanup(
  last_cleanup timestamp with time zone,
  retention_months integer
) RETURNS timestamp with time zone
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT CASE 
    WHEN last_cleanup IS NULL THEN now() + interval '1 day'
    ELSE last_cleanup + interval '1 month'
  END;
$$;

-- Function to execute retention policy cleanup
CREATE OR REPLACE FUNCTION public.execute_retention_cleanup(
  p_policy_id uuid
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  policy_record retention_policies%ROWTYPE;
  records_count integer := 0;
  cleanup_log_id uuid;
  cutoff_date timestamp with time zone;
  sql_query text;
BEGIN
  -- Get policy details
  SELECT * INTO policy_record 
  FROM retention_policies 
  WHERE id = p_policy_id AND auto_cleanup = true;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Policy not found or auto cleanup disabled'
    );
  END IF;
  
  -- Calculate cutoff date
  cutoff_date := now() - (policy_record.retention_months || ' months')::interval;
  
  -- Start cleanup log
  INSERT INTO cleanup_logs (
    org_id, policy_id, table_name, status
  ) VALUES (
    policy_record.org_id, p_policy_id, policy_record.table_name, 'STARTED'
  ) RETURNING id INTO cleanup_log_id;
  
  BEGIN
    -- Build and execute cleanup query based on table
    CASE policy_record.table_name
      WHEN 'processos' THEN
        -- Soft delete old processos
        UPDATE processos 
        SET deleted_at = now(), deleted_by = '00000000-0000-0000-0000-000000000000'
        WHERE org_id = policy_record.org_id 
          AND deleted_at IS NULL
          AND created_at < cutoff_date;
        GET DIAGNOSTICS records_count = ROW_COUNT;
        
      WHEN 'audit_logs' THEN
        -- Hard delete old audit logs
        DELETE FROM audit_logs 
        WHERE organization_id = policy_record.org_id 
          AND created_at < cutoff_date;
        GET DIAGNOSTICS records_count = ROW_COUNT;
        
      WHEN 'openai_logs' THEN
        -- Hard delete old OpenAI logs
        DELETE FROM openai_logs 
        WHERE org_id = policy_record.org_id 
          AND created_at < cutoff_date;
        GET DIAGNOSTICS records_count = ROW_COUNT;
        
      WHEN 'data_access_logs' THEN
        -- Hard delete old access logs
        DELETE FROM data_access_logs 
        WHERE org_id = policy_record.org_id 
          AND created_at < cutoff_date;
        GET DIAGNOSTICS records_count = ROW_COUNT;
        
      ELSE
        -- Skip unknown tables
        records_count := 0;
    END CASE;
    
    -- Update policy last cleanup
    UPDATE retention_policies 
    SET 
      last_cleanup_at = now(),
      next_cleanup_at = calculate_next_cleanup(now(), retention_months),
      updated_at = now()
    WHERE id = p_policy_id;
    
    -- Complete cleanup log
    UPDATE cleanup_logs 
    SET 
      status = 'COMPLETED',
      records_affected = records_count,
      completed_at = now(),
      metadata = jsonb_build_object(
        'cutoff_date', cutoff_date,
        'retention_months', policy_record.retention_months
      )
    WHERE id = cleanup_log_id;
    
    RETURN jsonb_build_object(
      'success', true,
      'records_affected', records_count,
      'cutoff_date', cutoff_date,
      'message', 'Cleanup completed successfully'
    );
    
  EXCEPTION WHEN OTHERS THEN
    -- Log error
    UPDATE cleanup_logs 
    SET 
      status = 'FAILED',
      error_message = SQLERRM,
      completed_at = now()
    WHERE id = cleanup_log_id;
    
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Cleanup failed: ' || SQLERRM
    );
  END;
END;
$$;

-- Function to setup default retention policies for new organizations
CREATE OR REPLACE FUNCTION public.setup_default_retention_policies(
  p_org_id uuid
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO retention_policies (org_id, table_name, retention_months, auto_cleanup) VALUES
    (p_org_id, 'processos', 60, false), -- 5 years for legal processes
    (p_org_id, 'audit_logs', 24, true),  -- 2 years for audit logs
    (p_org_id, 'openai_logs', 12, true), -- 1 year for AI logs
    (p_org_id, 'data_access_logs', 24, true), -- 2 years for access logs
    (p_org_id, 'lgpd_requests', 36, false) -- 3 years for LGPD requests
  ON CONFLICT (org_id, table_name) DO NOTHING;
END;
$$;

-- Trigger to setup default policies for new organizations
CREATE OR REPLACE FUNCTION public.setup_retention_for_new_org()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  PERFORM setup_default_retention_policies(NEW.id);
  RETURN NEW;
END;
$$;

-- Create trigger on organizations table
DROP TRIGGER IF EXISTS setup_retention_policies_trigger ON organizations;
CREATE TRIGGER setup_retention_policies_trigger
  AFTER INSERT ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION setup_retention_for_new_org();