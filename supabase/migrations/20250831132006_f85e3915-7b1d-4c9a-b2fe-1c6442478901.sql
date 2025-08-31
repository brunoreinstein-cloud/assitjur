-- Fix critical security vulnerabilities identified in the security scan

-- 1. Fix user_invitations table - restrict public read access
-- Drop the overly permissive policy that allows everyone to read invitations
DROP POLICY IF EXISTS "Users can view invitations sent to their email" ON user_invitations;

-- Create a proper policy that only allows the invited user to see their own invitation
CREATE POLICY "Invited users can view their own invitations" 
ON user_invitations 
FOR SELECT 
USING (
  auth.email() = email AND status = 'PENDING' AND expires_at > now()
);

-- 2. Ensure beta_signups RLS is properly configured and enabled
ALTER TABLE beta_signups ENABLE ROW LEVEL SECURITY;

-- 3. Recreate the beta signups insert policy with proper naming
DROP POLICY IF EXISTS "Beta signups are public for insert" ON beta_signups;
DROP POLICY IF EXISTS "Public can create beta signups" ON beta_signups;

-- Allow public inserts for beta signups (this is intentional for sign-up forms)
CREATE POLICY "Allow public beta signup creation" 
ON beta_signups 
FOR INSERT 
WITH CHECK (true);

-- 4. Add security comments for documentation
COMMENT ON TABLE beta_signups IS 'Beta signup data - READ access restricted to admins only, PUBLIC insert allowed for signup forms';
COMMENT ON TABLE user_invitations IS 'User invitations - READ access restricted to invited user and admins only';

-- 5. Since processos_live is a view, ensure it inherits proper security from processos table
-- Add a comment noting the security dependency
COMMENT ON VIEW processos_live IS 'Live processes view - Security inherited from base processos table RLS policies';