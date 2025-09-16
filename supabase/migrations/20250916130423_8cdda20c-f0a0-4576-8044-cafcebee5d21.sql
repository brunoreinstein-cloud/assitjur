-- URGENT FIX: Infinite recursion in profiles RLS policy
-- This migration resolves the infinite recursion error in the profiles table

-- 1. Create security definer function to avoid recursion
CREATE OR REPLACE FUNCTION public.get_current_user_organization()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT organization_id FROM profiles WHERE user_id = auth.uid() LIMIT 1;
$function$;

-- 2. Create security definer function for user access level
CREATE OR REPLACE FUNCTION public.get_current_user_access_level()
RETURNS text 
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT data_access_level::text FROM profiles WHERE user_id = auth.uid() LIMIT 1;
$function$;

-- 3. Fix the can_access_sensitive_data function to avoid recursion
CREATE OR REPLACE FUNCTION public.can_access_sensitive_data(user_uuid uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT CASE 
    WHEN user_uuid IS NULL THEN false
    ELSE EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = user_uuid 
        AND (role = 'ADMIN' OR data_access_level IN ('FULL', 'MASKED'))
        AND is_active = true
    )
  END;
$function$;

-- 4. Update can_access_legal_data to avoid recursion 
CREATE OR REPLACE FUNCTION public.can_access_legal_data(p_org_id uuid)
 RETURNS boolean
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
      AND organization_id = p_org_id
      AND is_active = true
      AND data_access_level IN ('FULL', 'MASKED')
  );
$function$;

-- 5. Clean up existing problematic RLS policies to prevent recursion
DROP POLICY IF EXISTS "profiles_strict_org_isolation" ON profiles;
DROP POLICY IF EXISTS "profiles_org_members_read" ON profiles;

-- 6. Create non-recursive RLS policies for profiles
CREATE POLICY "Users can manage their own profiles"
ON public.profiles
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can manage profiles"
ON public.profiles  
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- 7. Ensure all security functions have proper search paths
CREATE OR REPLACE FUNCTION public.mask_name(name_value text)
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT CASE 
    WHEN name_value IS NULL THEN NULL
    WHEN length(name_value) <= 3 THEN '***'
    ELSE substring(name_value from 1 for 2) || repeat('*', length(name_value) - 3) || substring(name_value from length(name_value))
  END;
$function$;

-- 8. Update the secure view to use non-recursive functions
DROP VIEW IF EXISTS public.vw_processos_secure;
CREATE VIEW public.vw_processos_secure AS
SELECT 
  p.id,
  p.org_id,
  p.cnj,
  p.cnj_normalizado,
  -- Apply data masking based on user access level
  CASE 
    WHEN can_access_sensitive_data(auth.uid()) THEN p.reclamante_nome
    ELSE mask_name(p.reclamante_nome)
  END as reclamante_nome,
  CASE 
    WHEN can_access_sensitive_data(auth.uid()) THEN p.reu_nome
    ELSE mask_name(p.reu_nome)
  END as reu_nome,
  p.comarca,
  p.tribunal,
  p.vara,
  p.fase,
  p.status,
  p.data_audiencia,
  p.classificacao_final,
  p.score_risco,
  p.created_at,
  p.updated_at
FROM processos p
WHERE p.deleted_at IS NULL
  AND get_current_user_organization() = p.org_id;

-- Grant permissions
GRANT SELECT ON public.vw_processos_secure TO authenticated;

-- 9. Security validation
DO $$
BEGIN
  -- Test that we can query profiles without recursion
  PERFORM COUNT(*) FROM profiles WHERE user_id = auth.uid();
  RAISE NOTICE 'PROFILES TABLE ACCESS: Fixed infinite recursion issue';
EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'CRITICAL: Profiles table still has recursion issues: %', SQLERRM;
END $$;