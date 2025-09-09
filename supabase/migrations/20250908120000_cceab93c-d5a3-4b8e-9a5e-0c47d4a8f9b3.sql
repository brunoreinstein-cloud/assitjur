-- Ensure tenant filters on assistjur views and RPC for testemunhas
-- Adds assistjur_processos_view and assistjur_testemunhas_view
-- and RPC rpc_get_assistjur_testemunhas with org checks

CREATE OR REPLACE VIEW assistjur.assistjur_processos_view AS
SELECT
  p.*,
  p.created_at::date AS data,
  (p.cnj || ' ' || COALESCE(p.comarca, '') || ' ' || COALESCE(p.fase, '')) AS search
FROM assistjur.por_processo p
WHERE p.org_id = COALESCE(
  (auth.jwt() ->> 'tenant_id')::uuid,
  (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1)
);

CREATE OR REPLACE VIEW assistjur.assistjur_testemunhas_view AS
SELECT
  t.*,
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
    SELECT *
    FROM assistjur.por_testemunha
    WHERE org_id = p_org_id
      AND (v_search = '' OR nome_testemunha ILIKE ('%' || v_search || '%'))
    ORDER BY created_at DESC
    LIMIT p_limit OFFSET v_offset
  ) t;
END;
$function$;

