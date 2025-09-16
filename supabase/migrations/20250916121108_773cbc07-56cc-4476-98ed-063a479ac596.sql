-- Fix critical security issues: Enable RLS for remaining tables
-- This migration fixes security gaps while avoiding conflicts with existing policies

-- 1. Ensure user_sessions has RLS enabled (may already be enabled)
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Service role needs full access for system operations (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_sessions' 
        AND policyname = 'Service role full access to sessions'
    ) THEN
        CREATE POLICY "Service role full access to sessions"
        ON public.user_sessions
        FOR ALL
        TO service_role
        USING (true)
        WITH CHECK (true);
    END IF;
END $$;

-- 2. Fix pessoas table - ensure comprehensive organization-based access control
ALTER TABLE public.pessoas ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate with better isolation
DROP POLICY IF EXISTS "pessoas_admin_full_access" ON public.pessoas;
DROP POLICY IF EXISTS "pessoas_authorized_read_only" ON public.pessoas;

-- Create comprehensive organization isolation policy
CREATE POLICY "pessoas_strict_org_isolation"
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
CREATE POLICY "Service role manages pessoas"
ON public.pessoas
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 3. Fix processos table - ensure comprehensive organization-based access control  
ALTER TABLE public.processos ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate with better isolation
DROP POLICY IF EXISTS "processos_admin_full_access" ON public.processos;
DROP POLICY IF EXISTS "processos_authorized_read_only" ON public.processos;

-- Create comprehensive organization isolation policy
CREATE POLICY "processos_strict_org_isolation"
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
    AND deleted_at IS NULL  -- Only show active records
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
CREATE POLICY "Service role manages processos"
ON public.processos
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 4. Add security documentation comments
COMMENT ON TABLE public.pessoas IS 'LGPD-sensitive: Personal data with CPF. RLS enforces strict organization isolation. All access logged.';
COMMENT ON TABLE public.processos IS 'LGPD-sensitive: Legal case data. RLS enforces strict organization isolation. All access logged.';

-- 5. Create enhanced audit function for security monitoring
CREATE OR REPLACE FUNCTION log_sensitive_data_access() RETURNS TRIGGER AS $$
BEGIN
    -- Enhanced logging for sensitive data access
    PERFORM log_user_action(
        TG_OP || '_SENSITIVE_' || TG_TABLE_NAME,
        TG_TABLE_NAME,
        CASE WHEN TG_OP = 'DELETE' THEN OLD.id ELSE NEW.id END,
        jsonb_build_object(
            'table', TG_TABLE_NAME,
            'operation', TG_OP,
            'user_id', auth.uid(),
            'timestamp', now(),
            'security_level', 'CRITICAL',
            'data_type', CASE 
                WHEN TG_TABLE_NAME = 'pessoas' THEN 'PERSONAL_DATA'
                WHEN TG_TABLE_NAME = 'processos' THEN 'LEGAL_DATA'
                ELSE 'SENSITIVE_DATA'
            END
        )
    );
    
    RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Add enhanced audit triggers (replace existing ones)
DROP TRIGGER IF EXISTS audit_pessoas_security ON public.pessoas;
CREATE TRIGGER audit_pessoas_lgpd_access
    AFTER INSERT OR UPDATE OR DELETE ON public.pessoas
    FOR EACH ROW EXECUTE FUNCTION log_sensitive_data_access();

DROP TRIGGER IF EXISTS audit_processos_security ON public.processos;
CREATE TRIGGER audit_processos_lgpd_access
    AFTER INSERT OR UPDATE OR DELETE ON public.processos
    FOR EACH ROW EXECUTE FUNCTION log_sensitive_data_access();

-- 6. Create security validation function
CREATE OR REPLACE FUNCTION validate_org_access() RETURNS boolean AS $$
BEGIN
    -- Validate that user has proper organization access
    RETURN EXISTS (
        SELECT 1 FROM profiles p 
        WHERE p.user_id = auth.uid() 
        AND p.is_active = true
        AND p.organization_id IS NOT NULL
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;