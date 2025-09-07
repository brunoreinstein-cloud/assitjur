-- Seed de system prompts padrão por organização
-- Ajuste o UUID da sua org ou converta para um SELECT por domínio
DO $$
DECLARE org_uuid uuid;
BEGIN
  SELECT id INTO org_uuid FROM public.organizations 
  WHERE domain = 'assistjur' LIMIT 1;

  IF org_uuid IS NOT NULL THEN
    INSERT INTO public.prompts (id, org_id, name, type, content, tags)
    VALUES (
      gen_random_uuid(),
      org_uuid,
      'System: Mapa de Testemunhas - v1',
      'SYSTEM',
      $prompt$
Você é um analista jurídico do Assistjur.IA.
Objetivo: classificar risco de testimonhas (triangulação, troca direta, prova emprestada).
Regras:
- Sempre validar CNJ e relação com partes.
- Em caso de dúvida, seja conservador.
- Saída em JSON com { risco, justificativa, indicadores }.
$prompt$,
      ARRAY['witness','risk','v1']
    )
    ON CONFLICT DO NOTHING;
  END IF;
END $$;
