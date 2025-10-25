-- Ensure tenant filters on assistjur views and RPC for testemunhas
-- Adds assistjur_processos_view and assistjur_testemunhas_view
-- and RPC rpc_get_assistjur_testemunhas with org checks

CREATE OR REPLACE VIEW assistjur.assistjur_processos_view AS
SELECT
  p.id,
  p.org_id,
  p.cnj,
  p.status,
  p.fase,
  p.uf,
  p.comarca,
  p.reclamantes,
  p.advogados_ativo,
  p.testemunhas_ativo,
  p.testemunhas_passivo,
  p.todas_testemunhas,
  p.triangulacao_confirmada,
  p.desenho_triangulacao,
  p.cnjs_triangulacao,
  p.contem_prova_emprestada,
  p.testemunhas_prova_emprestada,
  p.reclamante_foi_testemunha,
  p.qtd_reclamante_testemunha,
  p.cnjs_reclamante_testemunha,
  p.reclamante_testemunha_polo_passivo,
  p.cnjs_passivo,
  p.troca_direta,
  p.cnjs_troca_direta,
  p.classificacao_final,
  p.insight_estrategico,
  p.created_at,
  p.updated_at,
  p.upload_id,
  p.created_at::date AS data,
  (p.cnj || ' ' || COALESCE(p.comarca, '') || ' ' || COALESCE(p.fase, '')) AS search
FROM assistjur.por_processo p
WHERE p.org_id = COALESCE(
  (auth.jwt() ->> 'tenant_id')::uuid,
  (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1)
);

CREATE OR REPLACE VIEW assistjur.assistjur_testemunhas_view AS
SELECT
  t.id,
  t.org_id,
  t.nome_testemunha,
  t.qtd_depoimentos,
  t.cnjs_como_testemunha,
  t.ja_foi_reclamante,
  t.cnjs_como_reclamante,
  t.foi_testemunha_ativo,
  t.foi_testemunha_passivo,
  t.cnjs_passivo,
  t.foi_ambos_polos,
  t.participou_troca_favor,
  t.cnjs_troca_favor,
  t.participou_triangulacao,
  t.cnjs_triangulacao,
  t.e_prova_emprestada,
  t.classificacao,
  t.classificacao_estrategica,
  t.created_at,
  t.updated_at,
  t.upload_id,
  t.nome_testemunha AS nome,
  NULL::text AS documento,
  t.created_at::date AS data,
  t.nome_testemunha AS search
FROM assistjur.por_testemunha t
WHERE t.org_id = COALESCE(
  (auth.jwt() ->> 'tenant_id')::uuid,
  (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1)
);

CREATE OR REPLACE FUNCTION public.rpc_get_assistjur_testemunhas(
  p_org_id uuid,
  p_filters jsonb DEFAULT '{}'::jsonb,
  p_page integer DEFAULT 1,
  p_limit integer DEFAULT 50
)
RETURNS TABLE(data jsonb, total_count bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public','assistjur'
AS $function$
DECLARE
  v_offset integer;
  v_search text;
  v_total_count bigint;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.user_id = auth.uid()
      AND p.organization_id = p_org_id
  ) THEN
    RAISE EXCEPTION 'Access denied to organization data';
  END IF;

  v_offset := (p_page - 1) * p_limit;
  v_search := COALESCE(p_filters->>'search', '');

  SELECT COUNT(*) INTO v_total_count
  FROM assistjur.por_testemunha
  WHERE org_id = p_org_id
    AND (v_search = '' OR nome_testemunha ILIKE ('%' || v_search || '%'));

  RETURN QUERY
  SELECT
    jsonb_agg(
      jsonb_build_object(
        'nome_testemunha', t.nome_testemunha,
        'qtd_depoimentos', t.qtd_depoimentos,
        'cnjs_como_testemunha', t.cnjs_como_testemunha,
        'created_at', t.created_at
      ) ORDER BY t.created_at DESC
    ) AS data,
    v_total_count AS total_count
  FROM (
    SELECT
      nome_testemunha,
      qtd_depoimentos,
      cnjs_como_testemunha,
      created_at
    FROM assistjur.por_testemunha
    WHERE org_id = p_org_id
      AND (v_search = '' OR nome_testemunha ILIKE ('%' || v_search || '%'))
    ORDER BY created_at DESC
    LIMIT p_limit OFFSET v_offset
  ) t;
END;
$function$;

