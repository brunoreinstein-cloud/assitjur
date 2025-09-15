-- Fix Security Definer Views by making them Security Invoker
-- This ensures views execute with the permissions of the querying user, not the view creator

-- Fix assistjur.v_mapa_testemunhas
CREATE OR REPLACE VIEW assistjur.v_mapa_testemunhas
WITH (security_invoker=true) AS
SELECT id AS vinculo_id,
    testemunha_id,
    processo_id,
    status_oitiva,
    relevancia,
    risco,
    proxima_movimentacao,
    tags
FROM assistjur.processos_testemunhas pt;

-- Fix hubjuria.vw_pessoas_quality  
CREATE OR REPLACE VIEW hubjuria.vw_pessoas_quality
WITH (security_invoker=true) AS
SELECT id,
    org_id,
    nome_civil,
    cpf_mask,
    apelidos,
    created_at,
    updated_at,
    COALESCE(NULLIF(TRIM(BOTH FROM nome_civil), ''), '') <> '' AS nome_valid,
    count(*) OVER (PARTITION BY org_id, lower(TRIM(BOTH FROM nome_civil)), cpf_mask) AS duplicate_count,
    row_number() OVER (PARTITION BY org_id, lower(TRIM(BOTH FROM nome_civil)), cpf_mask ORDER BY created_at) = 1 AS is_canonical,
    CASE
        WHEN COALESCE(NULLIF(TRIM(BOTH FROM nome_civil), ''), '') <> '' AND count(*) OVER (PARTITION BY org_id, lower(TRIM(BOTH FROM nome_civil)), cpf_mask) = 1 THEN 100
        WHEN COALESCE(NULLIF(TRIM(BOTH FROM nome_civil), ''), '') <> '' THEN 75
        ELSE 25
    END AS quality_score,
    CASE
        WHEN COALESCE(NULLIF(TRIM(BOTH FROM nome_civil), ''), '') = '' THEN 'ERROR'
        WHEN count(*) OVER (PARTITION BY org_id, lower(TRIM(BOTH FROM nome_civil)), cpf_mask) > 1 THEN 'WARNING'
        ELSE 'OK'
    END AS severity
FROM pessoas pe;

-- Note: Extension views (pg_stat_statements, pg_stat_statements_info) are system views 
-- and should not be modified as they are managed by PostgreSQL extensions.