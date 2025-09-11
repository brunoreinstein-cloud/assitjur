-- Demonstrates the security_invoker_report.sql by creating a view
-- without the security_invoker flag. The report should list this view.
BEGIN;

-- Create a sample view that defaults to security definer
CREATE OR REPLACE VIEW public.security_definer_test AS SELECT 1 AS col;

-- Run the report
WITH views AS (
  SELECT
    n.nspname  AS schema,
    c.relname  AS view,
    COALESCE(
      EXISTS (
        SELECT 1
        FROM unnest(c.reloptions) opt
        WHERE opt = 'security_invoker=true'
      ), FALSE
    ) AS is_security_invoker,
    pg_get_viewdef(c.oid, true) AS sql_def,
    c.oid AS oid
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE c.relkind = 'v'
)
SELECT
  v.schema,
  v.view,
  CASE WHEN v.is_security_invoker THEN 'true' ELSE 'false' END AS security_invoker,
  (SELECT COUNT(*) FROM pg_depend d WHERE d.refobjid = v.oid) AS dependents_count,
  v.sql_def
FROM views v
WHERE v.is_security_invoker = FALSE
ORDER BY v.schema, v.view;

-- Clean up
DROP VIEW public.security_definer_test;
ROLLBACK;
