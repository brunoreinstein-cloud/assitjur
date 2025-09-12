-- Extend audit_log table with detailed fields and append-only protection
ALTER TABLE public.audit_log
  RENAME COLUMN actor TO user_id;
ALTER TABLE public.audit_log
  ALTER COLUMN user_id TYPE uuid USING user_id::uuid;
ALTER TABLE public.audit_log
  ADD COLUMN IF NOT EXISTS org_id uuid;
ALTER TABLE public.audit_log
  ADD COLUMN IF NOT EXISTS before_hash text;
ALTER TABLE public.audit_log
  ADD COLUMN IF NOT EXISTS after_hash text;
ALTER TABLE public.audit_log
  ADD COLUMN IF NOT EXISTS ip text;
ALTER TABLE public.audit_log
  ADD COLUMN IF NOT EXISTS user_agent text;
ALTER TABLE public.audit_log
  RENAME COLUMN ts TO created_at;
ALTER TABLE public.audit_log
  ALTER COLUMN created_at SET DEFAULT now();

DROP INDEX IF EXISTS idx_audit_log_ts;
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON public.audit_log(created_at DESC);

-- Prevent updates or deletes to ensure append-only behaviour
CREATE OR REPLACE FUNCTION public.audit_log_no_modifications()
RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'audit_log is append-only';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS audit_log_prevent_modification ON public.audit_log;
CREATE TRIGGER audit_log_prevent_modification
BEFORE UPDATE OR DELETE ON public.audit_log
FOR EACH ROW EXECUTE FUNCTION public.audit_log_no_modifications();
