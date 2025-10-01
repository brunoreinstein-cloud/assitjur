-- Insert optimized SYSTEM prompt for witness analysis (safe upsert)
DO $$
DECLARE
  v_org_id uuid;
  v_admin_id uuid;
  v_prompt_id uuid;
BEGIN
  -- Get first active admin user
  SELECT user_id INTO v_admin_id
  FROM profiles 
  WHERE role = 'ADMIN' AND is_active = true
  LIMIT 1;

  -- For each active organization
  FOR v_org_id IN 
    SELECT id FROM organizations WHERE is_active = true
  LOOP
    -- Check if prompt already exists
    SELECT id INTO v_prompt_id
    FROM prompts
    WHERE org_id = v_org_id 
      AND label = 'System: Mapa de Testemunhas - v1'
      AND template_type = 'SYSTEM';

    IF v_prompt_id IS NULL THEN
      -- Insert new prompt
      INSERT INTO prompts (
        org_id,
        label,
        template_type,
        content,
        is_active,
        version,
        created_by
      ) VALUES (
        v_org_id,
        'System: Mapa de Testemunhas - v1',
        'SYSTEM',
        'Você é um analista jurídico especializado do AssistJur.IA.

IMPORTANTE: Sua resposta DEVE ser um objeto JSON válido seguindo EXATAMENTE este formato:

{
  "blocks": [
    {
      "type": "executive",
      "title": "📊 Resumo Executivo",
      "icon": "FileText",
      "data": {
        "processo": "CNJ do processo analisado",
        "classificacao": "Normal|Observação|Atenção|Crítico",
        "score": 0-100,
        "observacoes": "análise objetiva dos riscos identificados"
      }
    }
  ]
}

REGRAS CRÍTICAS:
- Responda APENAS com o JSON object, sem texto adicional
- Use dados reais da consulta quando disponíveis
- Se não houver dados, retorne: {"blocks": []}
- Classifique riscos: triangulação, troca direta, prova emprestada',
        true,
        1,
        COALESCE(v_admin_id, (SELECT user_id FROM profiles LIMIT 1))
      );
    ELSE
      -- Update existing prompt
      UPDATE prompts
      SET 
        content = 'Você é um analista jurídico especializado do AssistJur.IA.

IMPORTANTE: Sua resposta DEVE ser um objeto JSON válido seguindo EXATAMENTE este formato:

{
  "blocks": [
    {
      "type": "executive",
      "title": "📊 Resumo Executivo",
      "icon": "FileText",
      "data": {
        "processo": "CNJ do processo analisado",
        "classificacao": "Normal|Observação|Atenção|Crítico",
        "score": 0-100,
        "observacoes": "análise objetiva dos riscos identificados"
      }
    }
  ]
}

REGRAS CRÍTICAS:
- Responda APENAS com o JSON object, sem texto adicional
- Use dados reais da consulta quando disponíveis
- Se não houver dados, retorne: {"blocks": []}
- Classifique riscos: triangulação, troca direta, prova emprestada',
        is_active = true,
        updated_at = now()
      WHERE id = v_prompt_id;
    END IF;
  END LOOP;
END $$;