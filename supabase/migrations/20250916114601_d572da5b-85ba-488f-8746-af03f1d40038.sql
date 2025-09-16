-- Fix security issue: Remove public access to beta_signups table
-- This migration ensures only authorized users can access customer email data

-- Ensure RLS is enabled
ALTER TABLE public.beta_signups ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them securely
DROP POLICY IF EXISTS "Admin can view beta signups" ON public.beta_signups;
DROP POLICY IF EXISTS "Admin can manage beta signups" ON public.beta_signups;
DROP POLICY IF EXISTS "Service role insert beta signups" ON public.beta_signups;

-- Create explicit deny policy for public access
CREATE POLICY "Deny all public access to beta signups"
ON public.beta_signups
FOR ALL
TO public
USING (false)
WITH CHECK (false);

-- Create secure admin read policy
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

-- Create secure admin update policy
CREATE POLICY "Super admin secure update of beta signups"
ON public.beta_signups
FOR UPDATE
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

-- Create secure admin delete policy
CREATE POLICY "Super admin secure delete of beta signups"
ON public.beta_signups
FOR DELETE
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

-- Ensure service role can still insert (for the edge function)
CREATE POLICY "Secure service role insert for beta signups"
ON public.beta_signups
FOR INSERT
TO service_role
WITH CHECK (auth.role() = 'service_role');

-- Add security comment
COMMENT ON TABLE public.beta_signups IS 'Contains sensitive customer data - access restricted to super admins only. All access is logged via audit system.';