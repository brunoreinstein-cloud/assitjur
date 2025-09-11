-- List all views that run with SECURITY DEFINER (security_invoker=false)
-- along with the number of objects depending on them and their SQL definitions.
-- Returns zero rows if all views are defined with security_invoker=true.
--
-- Usage: run this script in the Supabase SQL editor or psql.

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
