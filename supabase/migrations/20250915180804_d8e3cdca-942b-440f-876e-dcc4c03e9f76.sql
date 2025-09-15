-- Phase 2: Fix remaining security warnings

-- 1. Fix all functions missing search_path
CREATE OR REPLACE FUNCTION public.mask_name(name_value text)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT CASE 
    WHEN name_value IS NULL THEN NULL
    WHEN length(name_value) <= 3 THEN '***'
    ELSE substring(name_value from 1 for 2) || repeat('*', length(name_value) - 3) || substring(name_value from length(name_value))
  END;
$function$;

CREATE OR REPLACE FUNCTION public.can_access_sensitive_data(user_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 
    FROM profiles 
    WHERE user_id = user_uuid 
    AND (role = 'ADMIN' OR data_access_level IN ('FULL', 'MASKED'))
  );
$function$;

CREATE OR REPLACE FUNCTION public.is_org_admin_simple(check_org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.organization_id = check_org_id 
    AND p.role = 'ADMIN'
    AND p.is_active = true
  );
$function$;

CREATE OR REPLACE FUNCTION public.is_admin_simple(check_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = check_user_id 
    AND p.role = 'ADMIN' 
    AND p.is_active = true
  );
$function$;

CREATE OR REPLACE FUNCTION public.has_financial_access()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
  -- Only service role and admin users with FULL data access can view financial data
  SELECT 
    auth.role() = 'service_role' OR 
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.user_id = auth.uid() 
        AND p.role = 'ADMIN' 
        AND p.data_access_level = 'FULL'
        AND p.is_active = true
    );
$function$;

CREATE OR REPLACE FUNCTION public.get_current_user_profile()
RETURNS profiles
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT p.* FROM profiles p WHERE p.user_id = auth.uid() LIMIT 1;
$function$;

CREATE OR REPLACE FUNCTION public.generate_invitation_token()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');
$function$;

CREATE OR REPLACE FUNCTION public.get_next_version_number(p_org_id uuid)
RETURNS integer
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT COALESCE(MAX(number), 0) + 1 
  FROM versions 
  WHERE org_id = p_org_id;
$function$;

-- 2. Add missing table policies for tables without any policies
ALTER TABLE assistjur.por_processo_staging ENABLE ROW LEVEL SECURITY;
ALTER TABLE assistjur.por_testemunha_staging ENABLE ROW LEVEL SECURITY;

-- Add policies for any other tables that may not have them
CREATE TABLE IF NOT EXISTS user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  session_token text NOT NULL,  
  expires_at timestamp with time zone NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- 3. Secure any remaining sensitive functions
CREATE OR REPLACE FUNCTION public.get_mrr_by_month_secure()
RETURNS TABLE(month date, revenue numeric)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT v.month, v.revenue
  FROM public.v_mrr_by_month v
  WHERE public.has_financial_access();
$function$;