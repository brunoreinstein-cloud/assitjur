-- Audit logging infrastructure
-- Adds required fields and functions for secure audit logging

-- 1. Rename existing columns to match new schema
ALTER TABLE public.audit_logs RENAME COLUMN resource TO entity;
ALTER TABLE public.audit_logs RENAME COLUMN metadata TO fields_masked;
ALTER TABLE public.audit_logs RENAME COLUMN ip_address TO ip;
ALTER TABLE public.audit_logs RENAME COLUMN user_agent TO ua;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS entity_id uuid;

-- 2. Helper function to mask email addresses
CREATE OR REPLACE FUNCTION public.mask_email(email text)
RETURNS text AS $$
BEGIN
  IF email IS NULL THEN
    RETURN NULL;
  END IF;
  RETURN concat(left(email, 1), '****', substring(email from position('@' in email)));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 3. Function to log audit events
CREATE OR REPLACE FUNCTION public.log_audit(p_action text, p_entity text, p_entity_id uuid, p_fields_masked jsonb)
RETURNS void AS $$
DECLARE
  v_claims json;
  v_tenant uuid;
  v_user uuid;
  v_ip text;
  v_ua text;
  v_fields jsonb := p_fields_masked;
BEGIN
  v_claims := current_setting('request.jwt.claims', true)::json;
  v_tenant := (v_claims->>'tenant_id')::uuid;
  v_user := auth.uid();
  v_ip := current_setting('request.headers', true)::json->>'x-forwarded-for';
  v_ua := current_setting('request.headers', true)::json->>'user-agent';

  IF v_fields ? 'email' THEN
    v_fields := jsonb_set(v_fields, '{email}', to_jsonb(mask_email(v_fields->>'email')), true);
  END IF;

  INSERT INTO audit_logs (tenant_id, user_id, action, entity, entity_id, fields_masked, ip, ua)
  VALUES (v_tenant, v_user, p_action, p_entity, p_entity_id, v_fields, v_ip, v_ua);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Trigger: log permission changes on profiles
CREATE OR REPLACE FUNCTION public.audit_profile_role_change()
RETURNS trigger AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    PERFORM log_audit('UPDATE_PERMISSION', TG_TABLE_NAME, NEW.id, jsonb_build_object('old_role', OLD.role, 'new_role', NEW.role));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_audit_profile_role_change ON public.profiles;
CREATE TRIGGER trg_audit_profile_role_change
AFTER UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.audit_profile_role_change();

-- 5. Trigger: log deletions on processos
CREATE OR REPLACE FUNCTION public.audit_processos_delete()
RETURNS trigger AS $$
BEGIN
  PERFORM log_audit('DELETE', TG_TABLE_NAME, OLD.id, NULL);
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_audit_processos_delete ON public.processos;
CREATE TRIGGER trg_audit_processos_delete
AFTER DELETE ON public.processos
FOR EACH ROW
EXECUTE FUNCTION public.audit_processos_delete();
