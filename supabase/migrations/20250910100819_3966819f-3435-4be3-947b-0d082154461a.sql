-- Add organization-level isolation to profiles table for enhanced security
-- Update the SELECT policy to also check organization membership
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id OR
  (organization_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM profiles p2
    WHERE p2.user_id = auth.uid() 
      AND p2.organization_id = profiles.organization_id
      AND p2.role = 'ADMIN'
  ))
);

-- Update the UPDATE policy similarly
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"  
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Add audit logging for profile access
CREATE OR REPLACE FUNCTION public.log_profile_access()
RETURNS TRIGGER AS $$
BEGIN
  -- Log profile access attempts for security monitoring
  PERFORM log_user_action(
    'ACCESS_PROFILE',
    'profiles', 
    NEW.id,
    jsonb_build_object(
      'accessed_user_id', NEW.user_id,
      'organization_id', NEW.organization_id
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;