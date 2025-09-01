-- Criar view canônica para facilitar acesso aos dados do AssistJur.IA
CREATE OR REPLACE VIEW assistjur.por_processo_view AS
SELECT 
  cnj,
  reclamante_limpo as reclamante,
  '' as reclamada, -- Campo não existe na staging, retornamos vazio
  CASE 
    WHEN testemunhas_ativo_limpo IS NOT NULL AND testemunhas_ativo_limpo != '' 
    THEN string_to_array(testemunhas_ativo_limpo, ',')
    ELSE ARRAY[]::text[]
  END as testemunhas_ativas,
  CASE 
    WHEN testemunhas_passivo_limpo IS NOT NULL AND testemunhas_passivo_limpo != '' 
    THEN string_to_array(testemunhas_passivo_limpo, ',')
    ELSE ARRAY[]::text[]
  END as testemunhas_passivas,
  CASE 
    WHEN testemunhas_ativo_limpo IS NOT NULL AND testemunhas_ativo_limpo != '' 
    THEN array_length(string_to_array(testemunhas_ativo_limpo, ','), 1)
    ELSE 0
  END + 
  CASE 
    WHEN testemunhas_passivo_limpo IS NOT NULL AND testemunhas_passivo_limpo != '' 
    THEN array_length(string_to_array(testemunhas_passivo_limpo, ','), 1)
    ELSE 0
  END as qtd_testemunhas,
  classificacao_final as classificacao,
  insight_estrategico as classificacao_estrategica,
  created_at,
  organization_id as org_id
FROM assistjur.por_processo_staging;