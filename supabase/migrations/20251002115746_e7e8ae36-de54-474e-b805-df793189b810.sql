-- ============================================================
-- PHASE 2: MEDIUM PRIORITY SECURITY FIXES (FINAL)
-- ============================================================

-- ============================================================
-- FIX 1: Complete search_path injection protection
-- ============================================================

CREATE OR REPLACE FUNCTION public.safe_fn()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  RETURN;
END;
$function$;

CREATE OR REPLACE FUNCTION public.cleanup_staging(p_import_job_id uuid DEFAULT NULL::uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF p_import_job_id IS NOT NULL THEN
    DELETE FROM public.stg_processos WHERE import_job_id = p_import_job_id;
  ELSE
    TRUNCATE public.stg_processos;
  END IF;
END;
$function$;

-- ============================================================
-- FIX 2: Add input validation functions
-- ============================================================

CREATE OR REPLACE FUNCTION public.validate_org_id(input_org_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_org_id uuid;
BEGIN
  SELECT organization_id INTO user_org_id
  FROM profiles WHERE user_id = auth.uid();
  
  IF input_org_id != user_org_id THEN
    RAISE EXCEPTION 'SECURITY: org_id mismatch';
  END IF;
  
  RETURN input_org_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_pagination(page integer, page_limit integer)
RETURNS TABLE(validated_page integer, validated_limit integer, validated_offset integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  validated_page := GREATEST(1, COALESCE(page, 1));
  validated_limit := LEAST(1000, GREATEST(1, COALESCE(page_limit, 50)));
  validated_offset := (validated_page - 1) * validated_limit;
  
  RETURN QUERY SELECT validated_page, validated_limit, validated_offset;
END;
$$;

-- ============================================================
-- FIX 3: Add rate limiting table and functions
-- ============================================================

CREATE TABLE IF NOT EXISTS public.api_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  endpoint TEXT NOT NULL,
  request_count INTEGER DEFAULT 1,
  window_start TIMESTAMPTZ DEFAULT NOW(),
  blocked_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, endpoint, window_start)
);

ALTER TABLE public.api_rate_limits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own rate limits" ON public.api_rate_limits;
CREATE POLICY "Users can view own rate limits"
ON public.api_rate_limits FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can manage rate limits" ON public.api_rate_limits;
CREATE POLICY "System can manage rate limits"
ON public.api_rate_limits FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Drop old function signature if exists
DROP FUNCTION IF EXISTS public.check_rate_limit(text, integer, integer);

-- Create new rate limit function
CREATE OR REPLACE FUNCTION public.check_api_rate_limit(
  endpoint_name text,
  max_requests integer DEFAULT 100,
  window_minutes integer DEFAULT 1
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_window_start timestamptz;
  current_count integer;
  is_blocked boolean;
BEGIN
  current_window_start := date_trunc('minute', now());
  
  SELECT EXISTS(
    SELECT 1 FROM api_rate_limits
    WHERE user_id = auth.uid()
      AND endpoint = endpoint_name
      AND blocked_until > now()
  ) INTO is_blocked;
  
  IF is_blocked THEN
    RETURN false;
  END IF;
  
  INSERT INTO api_rate_limits (user_id, endpoint, window_start, request_count)
  VALUES (auth.uid(), endpoint_name, current_window_start, 1)
  ON CONFLICT (user_id, endpoint, window_start)
  DO UPDATE SET request_count = api_rate_limits.request_count + 1
  RETURNING request_count INTO current_count;
  
  IF current_count > max_requests THEN
    UPDATE api_rate_limits
    SET blocked_until = now() + (window_minutes || ' minutes')::interval
    WHERE user_id = auth.uid()
      AND endpoint = endpoint_name
      AND window_start = current_window_start;
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$;

-- ============================================================
-- FIX 4: Add data retention automation
-- ============================================================

CREATE OR REPLACE FUNCTION public.calculate_next_cleanup(
  last_cleanup timestamptz,
  retention_months integer
)
RETURNS timestamptz
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT last_cleanup + (retention_months || ' months')::interval;
$$;

-- ============================================================
-- FIX 5: Ensure all RLS policies are properly set
-- ============================================================

DROP POLICY IF EXISTS "Admins can view roles in their org" ON public.user_roles;
CREATE POLICY "Admins can view roles in their org"
ON public.user_roles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
      AND p.organization_id = user_roles.organization_id
      AND p.role = 'ADMIN'::user_role
      AND p.is_active = true
  )
  OR auth.role() = 'service_role'
);

DROP POLICY IF EXISTS "Users can update own MFA status" ON public.user_mfa_status;
CREATE POLICY "Users can update own MFA status"
ON public.user_mfa_status FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can delete old rate limits" ON public.api_rate_limits;
CREATE POLICY "System can delete old rate limits"
ON public.api_rate_limits FOR DELETE
USING (
  auth.role() = 'service_role' 
  OR window_start < now() - interval '1 day'
);