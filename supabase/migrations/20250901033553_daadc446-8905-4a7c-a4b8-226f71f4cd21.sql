-- Criar view canônica para facilitar acesso aos dados do AssistJur.IA
CREATE OR REPLACE VIEW assistjur.por_processo_view AS
SELECT 
  cnj,
  reclamante_limpo as reclamante,
  '' as reclamada, -- Campo não existe na staging, retornamos vazio
  testemunhas_ativo_limpo as testemunhas_ativas,
  testemunhas_passivo_limpo as testemunhas_passivas,
  COALESCE(array_length(testemunhas_ativo_limpo, 1), 0) + COALESCE(array_length(testemunhas_passivo_limpo, 1), 0) as qtd_testemunhas,
  classificacao_final as classificacao,
  insight_estrategico as classificacao_estrategica,
  created_at,
  organization_id as org_id
FROM assistjur.por_processo_staging;