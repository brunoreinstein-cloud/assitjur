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

-- 2. Ensure beta_signups RLS is properly configured
-- The existing admin-only policy should work, but let's make sure RLS is enabled
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

-- 5. Add audit logging for sensitive table access
CREATE OR REPLACE FUNCTION log_sensitive_table_access()
RETURNS TRIGGER AS $$
BEGIN
  -- Log access to sensitive tables
  PERFORM log_user_action(
    'SENSITIVE_TABLE_ACCESS',
    TG_TABLE_NAME,
    CASE 
      WHEN TG_OP = 'DELETE' THEN OLD.id
      ELSE NEW.id
    END,
    jsonb_build_object(
      'operation', TG_OP,
      'table', TG_TABLE_NAME,
      'timestamp', now()
    )
  );
  
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- Apply audit logging to sensitive tables
CREATE TRIGGER audit_beta_signups_access
  AFTER SELECT ON beta_signups
  FOR EACH ROW EXECUTE FUNCTION log_sensitive_table_access();

CREATE TRIGGER audit_user_invitations_access
  AFTER SELECT ON user_invitations
  FOR EACH ROW EXECUTE FUNCTION log_sensitive_table_access();