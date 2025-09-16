-- Fix critical security issues: Enable RLS for user_sessions, pessoas, and processos tables
-- This migration implements proper Row-Level Security to protect sensitive data

-- 1. Fix user_sessions table - users should only see their own sessions
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DROP POLICY IF EXISTS "Users can manage their own sessions" ON public.user_sessions;

-- Users can only access their own sessions
CREATE POLICY "Users can view their own sessions"
ON public.user_sessions
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own sessions"
ON public.user_sessions
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own sessions"
ON public.user_sessions
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own sessions"
ON public.user_sessions
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Service role needs full access for system operations
CREATE POLICY "Service role full access to sessions"
ON public.user_sessions
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 2. Fix pessoas table - organization-based access control
-- Already has some policies, but let's ensure they're comprehensive
ALTER TABLE public.pessoas ENABLE ROW LEVEL SECURITY;

-- Drop and recreate for consistency
DROP POLICY IF EXISTS "pessoas_admin_full_access" ON public.pessoas;
DROP POLICY IF EXISTS "pessoas_authorized_read_only" ON public.pessoas;

-- Only users from same organization can access pessoas data
CREATE POLICY "pessoas_org_isolation"
ON public.pessoas
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles p 
        WHERE p.user_id = auth.uid() 
        AND p.organization_id = pessoas.org_id 
        AND p.is_active = true
        AND (
            p.role = 'ADMIN'::user_role 
            OR p.data_access_level IN ('FULL'::data_access_level, 'MASKED'::data_access_level)
        )
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM profiles p 
        WHERE p.user_id = auth.uid() 
        AND p.organization_id = pessoas.org_id 
        AND p.is_active = true
        AND p.role = 'ADMIN'::user_role
    )
);

-- Service role access for system operations
CREATE POLICY "Service role full access to pessoas"
ON public.pessoas
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 3. Fix processos table - organization-based access control  
-- Already has some policies, but let's ensure they're comprehensive
ALTER TABLE public.processos ENABLE ROW LEVEL SECURITY;

-- Drop and recreate for consistency
DROP POLICY IF EXISTS "processos_admin_full_access" ON public.processos;
DROP POLICY IF EXISTS "processos_authorized_read_only" ON public.processos;

-- Only users from same organization can access processos data
CREATE POLICY "processos_org_isolation"
ON public.processos
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles p 
        WHERE p.user_id = auth.uid() 
        AND p.organization_id = processos.org_id 
        AND p.is_active = true
        AND (
            p.role = 'ADMIN'::user_role 
            OR p.data_access_level IN ('FULL'::data_access_level, 'MASKED'::data_access_level)
        )
    )
    AND deleted_at IS NULL  -- Don't show soft-deleted records
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM profiles p 
        WHERE p.user_id = auth.uid() 
        AND p.organization_id = processos.org_id 
        AND p.is_active = true
        AND p.role = 'ADMIN'::user_role
    )
);

-- Service role access for system operations
CREATE POLICY "Service role full access to processos"
ON public.processos
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 4. Add security comments for documentation
COMMENT ON TABLE public.user_sessions IS 'User session data - RLS ensures users only see their own sessions';
COMMENT ON TABLE public.pessoas IS 'Personal data with CPF - RLS enforces organization isolation per LGPD requirements';
COMMENT ON TABLE public.processos IS 'Legal case data - RLS enforces organization isolation for sensitive legal information';

-- 5. Create audit trigger for security-sensitive tables
CREATE OR REPLACE FUNCTION log_security_access() RETURNS TRIGGER AS $$
BEGIN
    -- Log access to sensitive tables
    PERFORM log_user_action(
        TG_OP || '_' || TG_TABLE_NAME,
        TG_TABLE_NAME,
        CASE WHEN TG_OP = 'DELETE' THEN OLD.id ELSE NEW.id END,
        jsonb_build_object(
            'table', TG_TABLE_NAME,
            'operation', TG_OP,
            'user_id', auth.uid(),
            'timestamp', now()
        )
    );
    
    RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Add audit triggers to sensitive tables
DROP TRIGGER IF EXISTS audit_pessoas_security ON public.pessoas;
CREATE TRIGGER audit_pessoas_security
    AFTER INSERT OR UPDATE OR DELETE ON public.pessoas
    FOR EACH ROW EXECUTE FUNCTION log_security_access();

DROP TRIGGER IF EXISTS audit_processos_security ON public.processos;
CREATE TRIGGER audit_processos_security
    AFTER INSERT OR UPDATE OR DELETE ON public.processos
    FOR EACH ROW EXECUTE FUNCTION log_security_access();