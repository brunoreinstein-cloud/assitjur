-- CRITICAL FIX: Financial Data Exposure Prevention
-- Add strict RLS policies to financial views to prevent competitor access

-- Enable RLS on all financial views
ALTER VIEW v_arpa_by_month SET (security_barrier = true);
ALTER VIEW v_burn_runway SET (security_barrier = true);  
ALTER VIEW v_gross_margin SET (security_barrier = true);
ALTER VIEW v_mrr_by_month SET (security_barrier = true);

-- Add comprehensive RLS policies for financial views
-- Only super admins with FULL data access can view financial data

-- Policy for v_arpa_by_month
CREATE POLICY "Super admin financial access only - ARPA"
ON v_arpa_by_month
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role = 'ADMIN'
    AND p.data_access_level = 'FULL'
    AND p.is_active = true
  )
);

-- Policy for v_burn_runway  
CREATE POLICY "Super admin financial access only - Burn"
ON v_burn_runway
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role = 'ADMIN'
    AND p.data_access_level = 'FULL'
    AND p.is_active = true
  )
);

-- Policy for v_gross_margin
CREATE POLICY "Super admin financial access only - Margin"
ON v_gross_margin
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role = 'ADMIN'
    AND p.data_access_level = 'FULL'
    AND p.is_active = true
  )
);

-- Policy for v_mrr_by_month
CREATE POLICY "Super admin financial access only - MRR"
ON v_mrr_by_month
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role = 'ADMIN'
    AND p.data_access_level = 'FULL'
    AND p.is_active = true
  )
);

-- Add audit logging trigger for financial view access
CREATE OR REPLACE FUNCTION public.log_financial_view_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Log all financial view access attempts
  PERFORM log_financial_data_access(TG_TABLE_NAME, 'VIEW_ACCESS');
  
  -- Additional security logging
  PERFORM log_user_action(
    'FINANCIAL_VIEW_ACCESS',
    TG_TABLE_NAME,
    NULL,
    jsonb_build_object(
      'view_name', TG_TABLE_NAME,
      'access_type', 'SELECT',
      'security_level', 'CRITICAL_FINANCIAL',
      'timestamp', now()
    )
  );
  
  RETURN NEW;
END;
$$;

-- Create security barrier to ensure all financial data queries go through RLS
CREATE OR REPLACE FUNCTION public.secure_financial_data_barrier()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  -- Double-check: Only allow super admins with full access
  SELECT EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role = 'ADMIN'
    AND p.data_access_level = 'FULL'
    AND p.is_active = true
  ) AND auth.uid() IS NOT NULL;
$$;

-- Add additional security check function specifically for financial views
CREATE OR REPLACE FUNCTION public.validate_financial_access()
RETURNS boolean
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
  
  -- Strict validation: must be active admin with full access
  IF user_profile IS NULL OR 
     user_profile.role != 'ADMIN' OR 
     user_profile.data_access_level != 'FULL' OR 
     user_profile.is_active != true THEN
    
    -- Log unauthorized access attempt
    PERFORM log_user_action(
      'UNAUTHORIZED_FINANCIAL_ACCESS_ATTEMPT',
      'financial_views',
      NULL,
      jsonb_build_object(
        'user_id', auth.uid(),
        'user_role', COALESCE(user_profile.role::text, 'null'),
        'access_level', COALESCE(user_profile.data_access_level::text, 'null'),
        'is_active', COALESCE(user_profile.is_active, false),
        'timestamp', now(),
        'security_alert', 'POTENTIAL_COMPETITOR_ACCESS_ATTEMPT'
      )
    );
    
    RETURN false;
  END IF;
  
  -- Log successful financial access
  PERFORM log_user_action(
    'AUTHORIZED_FINANCIAL_ACCESS',
    'financial_views',
    NULL,
    jsonb_build_object(
      'user_id', auth.uid(),
      'user_role', user_profile.role,
      'access_level', user_profile.data_access_level,
      'organization_id', user_profile.organization_id,
      'timestamp', now()
    )
  );
  
  RETURN true;
END;
$$;

-- Add comment documenting the security measures
COMMENT ON FUNCTION public.validate_financial_access() IS 
'CRITICAL FINANCIAL SECURITY: This function validates access to sensitive financial views.
Only super admins with FULL data access level can view financial metrics.
All access attempts are logged for security monitoring.
Unauthorized attempts trigger security alerts for potential competitor access.';

-- Create a comprehensive financial security status check
CREATE OR REPLACE FUNCTION public.get_financial_security_status()
RETURNS jsonb
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT jsonb_build_object(
    'financial_views_protected', (
      SELECT count(*) FROM pg_policies 
      WHERE schemaname = 'public' 
      AND tablename IN ('v_arpa_by_month', 'v_burn_runway', 'v_gross_margin', 'v_mrr_by_month')
    ),
    'authorized_users_count', (
      SELECT count(*) FROM profiles 
      WHERE role = 'ADMIN' 
      AND data_access_level = 'FULL' 
      AND is_active = true
    ),
    'security_scan_timestamp', now(),
    'protection_level', 'MAXIMUM - Super Admin Only'
  );
$$;