-- Materialized view and secure view for feature flag evaluation metrics

-- Ensure pg_cron extension is available
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;

-- Materialized view aggregating evaluations in the last 30 days
CREATE MATERIALIZED VIEW IF NOT EXISTS public.feature_flag_evaluations_mv AS
WITH events AS (
    SELECT
        (metadata ->> 'tenant_id')::uuid AS tenant_id,
        resource::uuid AS flag_id,
        actor,
        ts
    FROM public.audit_log
    WHERE action = 'evaluated'
      AND ts >= now() - INTERVAL '30 days'
)
SELECT tenant_id,
       flag_id,
       window,
       COUNT(*) AS evaluations_count,
       COUNT(DISTINCT actor) AS unique_users,
       MAX(ts) AS last_evaluated
FROM (
    SELECT tenant_id, flag_id, actor, ts, '7d'::text AS window
    FROM events
    WHERE ts >= now() - INTERVAL '7 days'
    UNION ALL
    SELECT tenant_id, flag_id, actor, ts, '30d'::text AS window
    FROM events
) e
GROUP BY tenant_id, flag_id, window;

CREATE UNIQUE INDEX IF NOT EXISTS feature_flag_evaluations_mv_idx
    ON public.feature_flag_evaluations_mv (tenant_id, flag_id, window);

-- Secure view exposing metrics for the authenticated tenant
CREATE OR REPLACE VIEW public.feature_flag_metrics WITH (security_invoker=true) AS
SELECT tenant_id,
       flag_id,
       window,
       evaluations_count,
       unique_users,
       last_evaluated
FROM public.feature_flag_evaluations_mv
WHERE tenant_id = (auth.jwt() ->> 'tenant_id')::uuid;

COMMENT ON VIEW public.feature_flag_metrics IS 'Aggregated feature flag evaluation metrics for the current tenant';

-- Refresh materialized view every hour
SELECT cron.schedule(
    'refresh_feature_flag_evaluations_mv',
    '0 * * * *',
    $$REFRESH MATERIALIZED VIEW CONCURRENTLY public.feature_flag_evaluations_mv$$
);
