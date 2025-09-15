-- Fix remaining Security Definer Views by making them Security Invoker
-- This ensures views execute with the permissions of the querying user, not the view creator

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
    length(COALESCE(cnj_digits, '')) = 20 AS cnj_valid,
    count(*) OVER (PARTITION BY org_id, cnj_digits) AS duplicate_count,
    row_number() OVER (PARTITION BY org_id, cnj_digits ORDER BY created_at) = 1 AS is_canonical,
    CASE
        WHEN length(COALESCE(cnj_digits, '')) = 20 AND count(*) OVER (PARTITION BY org_id, cnj_digits) = 1 THEN 100
        WHEN length(COALESCE(cnj_digits, '')) = 20 THEN 75
        ELSE 25
    END AS quality_score,
    CASE
        WHEN length(COALESCE(cnj_digits, '')) != 20 THEN 'ERROR'
        WHEN count(*) OVER (PARTITION BY org_id, cnj_digits) > 1 THEN 'WARNING'
        ELSE 'OK'
    END AS severity
FROM processos pr
WHERE deleted_at IS NULL;

-- Fix public.minha_view (simple test view)
CREATE OR REPLACE VIEW public.minha_view
WITH (security_invoker=true) AS
SELECT 1 as test_column;

-- Fix financial reporting views
CREATE OR REPLACE VIEW public.v_arpa_by_month
WITH (security_invoker=true) AS
SELECT 
    month,
    SUM(amount) / COUNT(DISTINCT customer_id) as arpa
FROM invoices
GROUP BY month
ORDER BY month;

CREATE OR REPLACE VIEW public.v_burn_runway
WITH (security_invoker=true) AS
SELECT 
    om.month,
    (cm.db + cm.support + cm.hosting + cm.infra_other + cm.llm_tokens) + 
    (om.payroll + om.sales_marketing + om.admin + om.tools + om.other) as total_burn
FROM opex_monthly om
JOIN cogs_monthly cm ON om.month = cm.month
ORDER BY om.month;

CREATE OR REPLACE VIEW public.v_gross_margin
WITH (security_invoker=true) AS
SELECT 
    i.issued_at::date as month,
    SUM(i.amount) as revenue,
    SUM(cm.db + cm.support + cm.hosting + cm.infra_other + cm.llm_tokens) as cogs,
    SUM(i.amount) - SUM(cm.db + cm.support + cm.hosting + cm.infra_other + cm.llm_tokens) as gross_profit,
    CASE 
        WHEN SUM(i.amount) > 0 THEN 
            (SUM(i.amount) - SUM(cm.db + cm.support + cm.hosting + cm.infra_other + cm.llm_tokens)) / SUM(i.amount) * 100
        ELSE 0
    END as gross_margin_pct
FROM invoices i
JOIN cogs_monthly cm ON date_trunc('month', i.issued_at) = cm.month
GROUP BY i.issued_at::date
ORDER BY month;

CREATE OR REPLACE VIEW public.v_mrr_by_month
WITH (security_invoker=true) AS
SELECT 
    date_trunc('month', issued_at) as month,
    SUM(amount) as mrr
FROM invoices
WHERE status = 'paid'
GROUP BY date_trunc('month', issued_at)
ORDER BY month;

-- Note: vault.decrypted_secrets is a Supabase system view and should not be modified