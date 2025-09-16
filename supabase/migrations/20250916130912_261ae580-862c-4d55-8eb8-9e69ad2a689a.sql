-- URGENT FIX: Infinite recursion in profiles RLS policy (Fix #2)
-- Clean fix for the infinite recursion error

-- 1. Drop ALL existing policies on profiles to start clean
DROP POLICY IF EXISTS "Users can manage their own profiles" ON profiles;
DROP POLICY IF EXISTS "Service role can manage profiles" ON profiles;
DROP POLICY IF EXISTS "profiles_org_members_read" ON profiles;
DROP POLICY IF EXISTS "profiles_simple_access" ON profiles;
DROP POLICY IF EXISTS "service_role_full_access" ON profiles;
DROP POLICY IF EXISTS "users_can_insert_own_profile" ON profiles;
DROP POLICY IF EXISTS "users_can_update_own_profile" ON profiles;
DROP POLICY IF EXISTS "users_can_view_own_profile" ON profiles;

-- 2. Create minimal, non-recursive RLS policies for profiles
CREATE POLICY "profile_self_access"
ON public.profiles
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "profile_service_role_access"
ON public.profiles  
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- 3. Create simple, non-recursive security functions
CREATE OR REPLACE FUNCTION public.get_user_org_safe()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT organization_id FROM profiles WHERE user_id = auth.uid() LIMIT 1;
$function$;

-- Test the fix
DO $$
DECLARE
  test_org_id uuid;
BEGIN
  -- This should not cause infinite recursion
  SELECT get_user_org_safe() INTO test_org_id;
  RAISE NOTICE 'SUCCESS: Fixed infinite recursion in profiles table access';
END $$;