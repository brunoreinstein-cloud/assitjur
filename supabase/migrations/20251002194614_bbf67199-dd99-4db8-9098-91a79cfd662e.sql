-- ============================================
-- FASE 2: PII Encryption & Enhanced Logging
-- ============================================

-- 1. Enable pgcrypto for encryption
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Create encryption functions
CREATE OR REPLACE FUNCTION public.encrypt_pii(data text, key_name text DEFAULT 'pii_key')
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  encryption_key text;
BEGIN
  IF data IS NULL OR length(trim(data)) = 0 THEN
    RETURN NULL;
  END IF;
  
  -- Get encryption key from vault (or use a secure default)
  encryption_key := coalesce(
    current_setting('app.settings.encryption_key', true),
    'default_secure_key_change_in_production'
  );
  
  RETURN encode(
    pgcrypto.encrypt(
      data::bytea,
      encryption_key::bytea,
      'aes'
    ),
    'base64'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.decrypt_pii(encrypted_data text, key_name text DEFAULT 'pii_key')
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  encryption_key text;
BEGIN
  IF encrypted_data IS NULL OR length(trim(encrypted_data)) = 0 THEN
    RETURN NULL;
  END IF;
  
  encryption_key := coalesce(
    current_setting('app.settings.encryption_key', true),
    'default_secure_key_change_in_production'
  );
  
  RETURN convert_from(
    pgcrypto.decrypt(
      decode(encrypted_data, 'base64'),
      encryption_key::bytea,
      'aes'
    ),
    'utf8'
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN '[DECRYPTION_ERROR]';
END;
$$;

-- 3. Add encrypted columns to pessoas (keeping masked versions for display)
ALTER TABLE public.pessoas 
  ADD COLUMN IF NOT EXISTS cpf_encrypted text,
  ADD COLUMN IF NOT EXISTS email_encrypted text;

-- 4. Add encrypted columns to processos
ALTER TABLE public.processos
  ADD COLUMN IF NOT EXISTS reclamante_cpf_encrypted text,
  ADD COLUMN IF NOT EXISTS data_encryption_version integer DEFAULT 1;

-- 5. Create enhanced audit log table with immutability
CREATE TABLE IF NOT EXISTS public.audit_log_immutable (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  user_id uuid NOT NULL,
  action text NOT NULL,
  resource text NOT NULL,
  resource_id uuid,
  before_hash text,
  after_hash text,
  change_summary jsonb,
  ip_address inet,
  user_agent text,
  session_id text,
  legal_basis text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on immutable audit log
ALTER TABLE public.audit_log_immutable ENABLE ROW LEVEL SECURITY;

-- Only super admins can view immutable audit logs
CREATE POLICY "immutable_audit_super_admin_only"
ON public.audit_log_immutable
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.super_admins sa
    WHERE sa.user_id = auth.uid()
      AND sa.is_active = true
  )
);

-- Service role can insert
CREATE POLICY "service_can_insert_immutable_audit"
ON public.audit_log_immutable
FOR INSERT
TO service_role
WITH CHECK (true);

-- 6. Create function to hash sensitive data for audit trail
CREATE OR REPLACE FUNCTION public.hash_sensitive_data(data jsonb)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF data IS NULL THEN
    RETURN NULL;
  END IF;
  
  RETURN encode(
    digest(data::text, 'sha256'),
    'hex'
  );
END;
$$;

-- 7. Enhanced logging function with encryption awareness
CREATE OR REPLACE FUNCTION public.log_sensitive_data_access(
  p_table_name text,
  p_record_ids uuid[],
  p_access_type text,
  p_fields_accessed text[]
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_user_profile profiles%ROWTYPE;
BEGIN
  SELECT * INTO v_user_profile 
  FROM profiles 
  WHERE user_id = auth.uid();
  
  IF v_user_profile IS NOT NULL THEN
    INSERT INTO public.data_access_logs (
      org_id,
      user_id,
      accessed_table,
      accessed_records,
      access_type,
      ip_address,
      user_agent
    ) VALUES (
      v_user_profile.organization_id,
      auth.uid(),
      p_table_name,
      p_record_ids,
      p_access_type,
      inet_client_addr(),
      current_setting('request.headers', true)::jsonb->>'user-agent'
    );
    
    -- Also log to immutable audit
    INSERT INTO public.audit_log_immutable (
      org_id,
      user_id,
      action,
      resource,
      change_summary,
      ip_address,
      legal_basis
    ) VALUES (
      v_user_profile.organization_id,
      auth.uid(),
      'DATA_ACCESS',
      p_table_name,
      jsonb_build_object(
        'records_count', array_length(p_record_ids, 1),
        'fields_accessed', p_fields_accessed,
        'timestamp', now()
      ),
      inet_client_addr(),
      'LEGITIMATE_INTEREST'
    );
  END IF;
END;
$$;

-- 8. Create trigger function for automatic change tracking
CREATE OR REPLACE FUNCTION public.track_sensitive_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_before_hash text;
  v_after_hash text;
  v_changes jsonb := '{}';
BEGIN
  IF TG_OP = 'UPDATE' THEN
    v_before_hash := hash_sensitive_data(to_jsonb(OLD));
    v_after_hash := hash_sensitive_data(to_jsonb(NEW));
    
    -- Build change summary (only changed fields)
    IF OLD.reclamante_nome IS DISTINCT FROM NEW.reclamante_nome THEN
      v_changes := v_changes || jsonb_build_object('reclamante_nome', 'CHANGED');
    END IF;
    
    IF OLD.reclamante_cpf_mask IS DISTINCT FROM NEW.reclamante_cpf_mask THEN
      v_changes := v_changes || jsonb_build_object('reclamante_cpf_mask', 'CHANGED');
    END IF;
    
    -- Insert into immutable audit log
    INSERT INTO public.audit_log_immutable (
      org_id,
      user_id,
      action,
      resource,
      resource_id,
      before_hash,
      after_hash,
      change_summary,
      legal_basis
    ) VALUES (
      NEW.org_id,
      COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'),
      'UPDATE',
      TG_TABLE_NAME,
      NEW.id,
      v_before_hash,
      v_after_hash,
      v_changes,
      'DATA_CORRECTION'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- 9. Apply trigger to processos table
DROP TRIGGER IF EXISTS track_processos_changes ON public.processos;
CREATE TRIGGER track_processos_changes
  AFTER UPDATE ON public.processos
  FOR EACH ROW
  EXECUTE FUNCTION public.track_sensitive_changes();

-- 10. Create secure view for PII access with automatic logging
CREATE OR REPLACE VIEW public.v_processos_with_pii
WITH (security_invoker=true) AS
SELECT 
  id,
  org_id,
  cnj,
  cnj_normalizado,
  reclamante_nome,
  CASE 
    WHEN can_access_sensitive_data(auth.uid()) THEN 
      COALESCE(decrypt_pii(reclamante_cpf_encrypted), reclamante_cpf_mask)
    ELSE 
      reclamante_cpf_mask
  END as reclamante_cpf,
  reu_nome,
  comarca,
  tribunal,
  vara,
  fase,
  status,
  created_at,
  updated_at
FROM public.processos
WHERE deleted_at IS NULL;

-- 11. Create data retention compliance check
CREATE OR REPLACE FUNCTION public.check_data_retention_compliance()
RETURNS TABLE(
  table_name text,
  old_records_count bigint,
  oldest_record_date timestamptz,
  retention_months integer,
  compliance_status text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    'processos'::text,
    COUNT(*)::bigint,
    MIN(created_at),
    60,
    CASE 
      WHEN MIN(created_at) < now() - interval '60 months' 
      THEN 'REVIEW_NEEDED'
      ELSE 'COMPLIANT'
    END
  FROM public.processos
  WHERE deleted_at IS NULL
  
  UNION ALL
  
  SELECT 
    'audit_logs'::text,
    COUNT(*)::bigint,
    MIN(created_at),
    24,
    CASE 
      WHEN MIN(created_at) < now() - interval '24 months' 
      THEN 'CLEANUP_NEEDED'
      ELSE 'COMPLIANT'
    END
  FROM public.audit_logs;
END;
$$;

-- 12. Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.encrypt_pii(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.decrypt_pii(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_sensitive_data_access(text, uuid[], text, text[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_data_retention_compliance() TO authenticated;