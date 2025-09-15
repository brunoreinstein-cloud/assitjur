-- Fix remaining Security Definer Views with exact definitions and security_invoker=true

-- Fix hubjuria.vw_processos_quality
CREATE OR REPLACE VIEW hubjuria.vw_processos_quality
WITH (security_invoker=true) AS
SELECT id,
    org_id,
    version_id,
    cnj,
    cnj_normalizado,
    comarca,
    tribunal,
    vara,
    fase,
    status,
    reclamante_nome,
    reclamante_cpf_mask,
    reu_nome,
    advogados_ativo,
    advogados_passivo,
    testemunhas_ativo,
    testemunhas_passivo,
    data_audiencia,
    reclamante_foi_testemunha,
    troca_direta,
    triangulacao_confirmada,
    prova_emprestada,
    classificacao_final,
    score_risco,
    observacoes,
    deleted_at,
    deleted_by,
    created_at,
    updated_at,
    cnj_digits,
    (length(COALESCE(cnj_digits, ''::text)) = 20) AS cnj_valid,
    (COALESCE(NULLIF(TRIM(BOTH FROM reclamante_nome), ''::text), ''::text) <> ''::text) AS reclamante_valid,
    (COALESCE(NULLIF(TRIM(BOTH FROM reu_nome), ''::text), ''::text) <> ''::text) AS reu_valid,
    count(*) OVER (PARTITION BY org_id, cnj_digits) AS duplicate_count,
    (row_number() OVER (PARTITION BY org_id, cnj_digits ORDER BY created_at) = 1) AS is_canonical,
        CASE
            WHEN ((length(COALESCE(cnj_digits, ''::text)) = 20) AND (COALESCE(NULLIF(TRIM(BOTH FROM reclamante_nome), ''::text), ''::text) <> ''::text) AND (COALESCE(NULLIF(TRIM(BOTH FROM reu_nome), ''::text), ''::text) <> ''::text) AND (count(*) OVER (PARTITION BY org_id, cnj_digits) = 1)) THEN 100
            WHEN ((length(COALESCE(cnj_digits, ''::text)) = 20) AND (COALESCE(NULLIF(TRIM(BOTH FROM reclamante_nome), ''::text), ''::text) <> ''::text) AND (COALESCE(NULLIF(TRIM(BOTH FROM reu_nome), ''::text), ''::text) <> ''::text)) THEN 75
            ELSE 25
        END AS quality_score,
        CASE
            WHEN ((length(COALESCE(cnj_digits, ''::text)) <> 20) OR (COALESCE(NULLIF(TRIM(BOTH FROM reclamante_nome), ''::text), ''::text) = ''::text) OR (COALESCE(NULLIF(TRIM(BOTH FROM reu_nome), ''::text), ''::text) = ''::text)) THEN 'ERROR'::text
            WHEN (count(*) OVER (PARTITION BY org_id, cnj_digits) > 1) THEN 'WARNING'::text
            ELSE 'OK'::text
        END AS severity
FROM processos p
WHERE (deleted_at IS NULL);

-- Fix public.minha_view
CREATE OR REPLACE VIEW public.minha_view
WITH (security_invoker=true) AS
SELECT;

-- Fix public.v_mrr_by_month (needs to be fixed first as other views depend on it)
CREATE OR REPLACE VIEW public.v_mrr_by_month
WITH (security_invoker=true) AS
SELECT (date_trunc('month'::text, issued_at))::date AS month,
    (sum(((amount - tax_amount) - discounts)) FILTER (WHERE (status = 'paid'::text)))::numeric(12,2) AS revenue
FROM invoices
GROUP BY ((date_trunc('month'::text, issued_at))::date)
ORDER BY ((date_trunc('month'::text, issued_at))::date);

-- Fix public.v_gross_margin
CREATE OR REPLACE VIEW public.v_gross_margin
WITH (security_invoker=true) AS
SELECT m.month,
    m.revenue,
    (COALESCE(((((c.hosting + c.db) + c.llm_tokens) + c.support) + c.infra_other), (0)::numeric))::numeric(12,2) AS cogs,
        CASE
            WHEN (m.revenue > (0)::numeric) THEN ((m.revenue - COALESCE(((((c.hosting + c.db) + c.llm_tokens) + c.support) + c.infra_other), (0)::numeric)) / m.revenue)
            ELSE NULL::numeric
        END AS gm_pct
FROM (v_mrr_by_month m
     LEFT JOIN cogs_monthly c ON ((c.month = m.month)))
ORDER BY m.month;

-- Fix public.v_arpa_by_month
CREATE OR REPLACE VIEW public.v_arpa_by_month
WITH (security_invoker=true) AS
SELECT m.month,
    ((m.revenue / (NULLIF(cnt.active_customers, 0))::numeric))::numeric(12,2) AS arpa
FROM (v_mrr_by_month m
     LEFT JOIN ( SELECT (date_trunc('month'::text, subscriptions.started_at))::date AS month,
            count(DISTINCT subscriptions.customer_id) FILTER (WHERE (subscriptions.status = ANY (ARRAY['active'::text, 'trialing'::text, 'past_due'::text]))) AS active_customers
           FROM subscriptions
          GROUP BY ((date_trunc('month'::text, subscriptions.started_at))::date)) cnt USING (month))
ORDER BY m.month;

-- Fix public.v_burn_runway
CREATE OR REPLACE VIEW public.v_burn_runway
WITH (security_invoker=true) AS
WITH o AS (
         SELECT opex_monthly.month,
            COALESCE(((((opex_monthly.payroll + opex_monthly.sales_marketing) + opex_monthly.admin) + opex_monthly.tools) + opex_monthly.other), (0)::numeric) AS opex
           FROM opex_monthly
        ), gm AS (
         SELECT v_gross_margin.month,
            COALESCE(v_gross_margin.revenue, (0)::numeric) AS revenue,
            COALESCE(v_gross_margin.cogs, (0)::numeric) AS cogs
           FROM v_gross_margin
        )
SELECT COALESCE(gm.month, o.month) AS month,
    COALESCE(gm.revenue, (0)::numeric) AS revenue,
    COALESCE(gm.cogs, (0)::numeric) AS cogs,
    COALESCE(o.opex, (0)::numeric) AS opex,
    ((COALESCE(gm.revenue, (0)::numeric) - COALESCE(gm.cogs, (0)::numeric)) - COALESCE(o.opex, (0)::numeric)) AS net_cash_flow
FROM (gm
     FULL JOIN o USING (month))
ORDER BY COALESCE(gm.month, o.month);