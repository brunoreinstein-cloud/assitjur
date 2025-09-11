-- Replace assistjur_processos_view with parameterized function
DROP VIEW IF EXISTS assistjur.assistjur_processos_view;

CREATE OR REPLACE FUNCTION assistjur.listar_processos(
  p_org_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  org_id uuid,
  cnj text,
  status text,
  fase text,
  uf text,
  comarca text,
  reclamantes text[],
  advogados_ativo text[],
  testemunhas_ativo text[],
  testemunhas_passivo text[],
  todas_testemunhas text[],
  triangulacao_confirmada boolean,
  desenho_triangulacao text,
  cnjs_triangulacao text[],
  contem_prova_emprestada boolean,
  testemunhas_prova_emprestada text[],
  reclamante_foi_testemunha boolean,
  qtd_reclamante_testemunha integer,
  cnjs_reclamante_testemunha text[],
  reclamante_testemunha_polo_passivo boolean,
  cnjs_passivo text[],
  troca_direta boolean,
  cnjs_troca_direta text[],
  classificacao_final text,
  insight_estrategico text,
  created_at timestamptz,
  updated_at timestamptz,
  upload_id uuid,
  data date,
  search text
)
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
  SELECT
    p.*,
    p.created_at::date AS data,
    (p.cnj || ' ' || COALESCE(p.comarca, '') || ' ' || COALESCE(p.fase, '')) AS search
  FROM assistjur.por_processo p
  WHERE p.org_id = COALESCE(
    p_org_id,
    (auth.jwt() ->> 'tenant_id')::uuid,
    (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1)
  );
$$;

COMMENT ON FUNCTION assistjur.listar_processos IS 'Lista processos aplicando filtro de tenant e usuário.';
