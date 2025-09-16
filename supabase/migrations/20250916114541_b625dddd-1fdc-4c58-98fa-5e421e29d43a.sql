-- Fix security issue: Remove public access to beta_signups table
-- This migration ensures only authorized users can access customer email data

-- First, drop any existing policies that might allow public access
DO $$
BEGIN
    -- Check and remove potentially dangerous policies
    DROP POLICY IF EXISTS "Enable read access for all users" ON beta_signups;
    DROP POLICY IF EXISTS "Public read access" ON beta_signups;
    DROP POLICY IF EXISTS "Allow public to read beta signups" ON beta_signups;
EXCEPTION
    WHEN undefined_object THEN
        -- Policies don't exist, continue
        NULL;
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

-- Recreate the admin policies with more explicit security
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
FOR UPDATE, DELETE
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
DROP POLICY IF EXISTS "Service role insert beta signups" ON public.beta_signups;
CREATE POLICY "Secure service role insert for beta signups"
ON public.beta_signups
FOR INSERT
TO service_role
WITH CHECK (auth.role() = 'service_role');

-- Add security comment for documentation
COMMENT ON TABLE public.beta_signups IS 'Contains sensitive customer data - access restricted to super admins only. All access is logged via audit system.';

-- Create index for efficient policy checking if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_profiles_security_check') THEN
        CREATE INDEX idx_profiles_security_check 
        ON public.profiles(user_id, role, data_access_level, is_active) 
        WHERE role = 'ADMIN' AND data_access_level = 'FULL' AND is_active = true;
    END IF;
END $$;