-- Create upsert function for padroes_agregados
CREATE OR REPLACE FUNCTION public.upsert_padroes_agregados(
  p_org_id uuid,
  p_data jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Upsert into padroes_agregados table
  INSERT INTO hubjuria.padroes_agregados (
    org_id,
    total_processos,
    processos_com_triangulacao,
    processos_com_troca_direta,
    processos_com_duplo_papel,
    processos_com_prova_emprestada,
    testemunhas_profissionais,
    advogados_recorrentes,
    concentracao_uf,
    concentracao_comarca,
    tendencia_temporal,
    updated_at
  ) VALUES (
    p_org_id,
    (p_data->>'total_processos')::integer,
    (p_data->>'processos_com_triangulacao')::integer,
    (p_data->>'processos_com_troca_direta')::integer,
    (p_data->>'processos_com_duplo_papel')::integer,
    (p_data->>'processos_com_prova_emprestada')::integer,
    p_data->'testemunhas_profissionais',
    p_data->'advogados_recorrentes',
    p_data->'concentracao_uf',
    p_data->'concentracao_comarca',
    p_data->'tendencia_temporal',
    now()
  )
  ON CONFLICT (org_id) 
  DO UPDATE SET
    total_processos = EXCLUDED.total_processos,
    processos_com_triangulacao = EXCLUDED.processos_com_triangulacao,
    processos_com_troca_direta = EXCLUDED.processos_com_troca_direta,
    processos_com_duplo_papel = EXCLUDED.processos_com_duplo_papel,
    processos_com_prova_emprestada = EXCLUDED.processos_com_prova_emprestada,
    testemunhas_profissionais = EXCLUDED.testemunhas_profissionais,
    advogados_recorrentes = EXCLUDED.advogados_recorrentes,
    concentracao_uf = EXCLUDED.concentracao_uf,
    concentracao_comarca = EXCLUDED.concentracao_comarca,
    tendencia_temporal = EXCLUDED.tendencia_temporal,
    updated_at = now();
END;
$function$