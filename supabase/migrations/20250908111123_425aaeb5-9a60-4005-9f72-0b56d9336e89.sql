-- Check for views with security definer property
SELECT schemaname, viewname, definition 
FROM pg_views 
WHERE schemaname IN ('public', 'assistjur') 
AND (definition ILIKE '%security definer%' OR definition ILIKE '%security%');

-- List all views to understand the current state
SELECT schemaname, viewname FROM pg_views WHERE schemaname IN ('public', 'assistjur');

-- Check functions that might create views with security definer
SELECT proname, prosecdef 
FROM pg_proc p 
JOIN pg_namespace n ON p.pronamespace = n.oid 
WHERE n.nspname IN ('public', 'assistjur') 
AND prosecdef = true;