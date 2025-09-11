-- Ensure all views are created with security_invoker=true.
-- Recreates any existing view missing the security_invoker reloption.
DO $$
DECLARE
  r RECORD;
  v_def text;
BEGIN
  FOR r IN
    SELECT n.nspname AS schema, c.relname AS view, c.oid
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relkind = 'v'
      AND NOT EXISTS (
        SELECT 1 FROM unnest(COALESCE(c.reloptions, ARRAY[]::text[])) opt
        WHERE opt = 'security_invoker=true'
      )
  LOOP
    SELECT pg_get_viewdef(r.oid, true) INTO v_def;
    EXECUTE format(
      'CREATE OR REPLACE VIEW %I.%I WITH (security_invoker=true) AS %s;',
      r.schema, r.view, v_def
    );
  END LOOP;
END $$;
