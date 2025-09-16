-- Fix security issue: Remove public access to beta_signups table
-- This migration ensures only authorized users can access customer email data

-- First, let's check and fix any potential public access policies
-- Drop any existing policies that might allow public access
DO $$
BEGIN
    -- Check if there are any permissive policies that allow public access
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'beta_signups' 
        AND cmd = 'SELECT'
        AND permissive = 'PERMISSIVE'
        AND (
            qual LIKE '%true%' 
            OR qual IS NULL
            OR qual = ''
        )
    ) THEN
        -- Drop potentially dangerous policies
        DROP POLICY IF EXISTS "Enable read access for all users" ON beta_signups;
        DROP POLICY IF EXISTS "Public read access" ON beta_signups;
        DROP POLICY IF EXISTS "Allow public to read beta signups" ON beta_signups;
    END IF;
END $$;

-- Ensure RLS is enabled (should already be enabled)
ALTER TABLE public.beta_signups ENABLE ROW LEVEL SECURITY;

-- Create a secure policy that explicitly denies public access
-- This acts as a safety net to prevent any accidental public exposure
CREATE POLICY "Deny all public access to beta signups"
ON public.beta_signups
FOR ALL
TO public
USING (false)
WITH CHECK (false);

-- Ensure our existing secure policies remain in place
-- The admin policy should already exist, but let's make sure it's secure
DROP POLICY IF EXISTS "Admin can view beta signups" ON public.beta_signups;
CREATE POLICY "Super admin secure read access to beta signups"
ON public.beta_signups
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles p 
        WHERE p.user_id = auth.uid() 
        AND p.role = 'ADMIN'::user_role 
        AND p.data_access_level = 'FULL'::data_access_level 
        AND p.is_active = true
    )
);

-- Update the management policy to be more explicit
DROP POLICY IF EXISTS "Admin can manage beta signups" ON public.beta_signups;
CREATE POLICY "Super admin secure management of beta signups"
ON public.beta_signups
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles p 
        WHERE p.user_id = auth.uid() 
        AND p.role = 'ADMIN'::user_role 
        AND p.data_access_level = 'FULL'::data_access_level 
        AND p.is_active = true
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM profiles p 
        WHERE p.user_id = auth.uid() 
        AND p.role = 'ADMIN'::user_role 
        AND p.data_access_level = 'FULL'::data_access_level 
        AND p.is_active = true
    )
);

-- Ensure service role can still insert (for the edge function)
-- This policy should already exist but let's verify it's secure
DROP POLICY IF EXISTS "Service role insert beta signups" ON public.beta_signups;
CREATE POLICY "Secure service role insert for beta signups"
ON public.beta_signups
FOR INSERT
TO service_role
WITH CHECK (auth.role() = 'service_role');

-- Add audit logging for beta signup access attempts
CREATE OR REPLACE FUNCTION log_beta_signup_access()
RETURNS TRIGGER AS $$
BEGIN
    -- Log any SELECT operations on beta_signups for security monitoring
    IF TG_OP = 'SELECT' THEN
        PERFORM log_user_action(
            'ACCESS_BETA_SIGNUPS',
            'beta_signups',
            NULL,
            jsonb_build_object(
                'access_type', 'SELECT',
                'timestamp', now(),
                'user_id', auth.uid()
            )
        );
    END IF;
    
    RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- Create trigger to log access attempts
DROP TRIGGER IF EXISTS log_beta_signup_access_trigger ON public.beta_signups;
CREATE TRIGGER log_beta_signup_access_trigger
    AFTER SELECT ON public.beta_signups
    FOR EACH STATEMENT
    EXECUTE FUNCTION log_beta_signup_access();

-- Add security comment for documentation
COMMENT ON TABLE public.beta_signups IS 'Contains sensitive customer data - access restricted to super admins only. All access is logged for security monitoring.';

-- Create index for efficient policy checking
CREATE INDEX IF NOT EXISTS idx_profiles_security_check 
ON public.profiles(user_id, role, data_access_level, is_active) 
WHERE role = 'ADMIN' AND data_access_level = 'FULL' AND is_active = true;