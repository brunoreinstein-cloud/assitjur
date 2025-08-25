-- Insert default organization settings for existing organizations that don't have settings yet
INSERT INTO public.org_settings (
  org_id,
  openai_enabled,
  model,
  temperature,
  top_p,
  max_output_tokens,
  streaming,
  rate_per_min,
  budget_month_cents,
  schema_json,
  ab_weights,
  updated_by
)
SELECT 
  o.id as org_id,
  false as openai_enabled,
  'gpt-4o-mini' as model,
  0.7 as temperature,
  0.9 as top_p,
  2000 as max_output_tokens,
  false as streaming,
  60 as rate_per_min,
  10000 as budget_month_cents,
  '{}' as schema_json,
  '{}' as ab_weights,
  p.user_id as updated_by
FROM organizations o
LEFT JOIN org_settings os ON o.id = os.org_id
JOIN profiles p ON o.id = p.organization_id AND p.role = 'ADMIN'
WHERE os.id IS NULL;

-- Insert default prompts for organizations that don't have any active prompts
INSERT INTO public.prompts (
  org_id,
  label,
  content,
  template_type,
  is_active,
  version,
  created_by
)
SELECT DISTINCT
  o.id as org_id,
  'Análise de Processo Padrão' as label,
  'Você é um assistente especializado em análise de processos jurídicos brasileiros.

Analise os dados fornecidos e retorne um JSON estruturado com as seguintes informações:

{
  "classificacao_risco": "ALTO | MEDIO | BAIXO",
  "score_confianca": 85,
  "observacoes": "Análise detalhada do processo baseada nos dados fornecidos",
  "recomendacoes": ["Ação 1", "Ação 2"],
  "fatores_risco": ["Fator 1", "Fator 2"]
}

**Variáveis disponíveis:**
- CNJ: {cnj}
- Nome: {nome}
- Comarca: {comarca}
- Ano: {ano}

**Diretrizes importantes:**
- Sempre mascare dados pessoais (CPF, nomes completos)
- Baseie a análise em padrões jurídicos brasileiros
- Considere o contexto da comarca e ano do processo
- Score de confiança deve refletir a qualidade dos dados fornecidos

Dados do processo:
CNJ: {cnj}
Nome: {nome}
Comarca: {comarca}
Ano: {ano}' as content,
  'processo' as template_type,
  true as is_active,
  1 as version,
  p.user_id as created_by
FROM organizations o
LEFT JOIN prompts pr ON o.id = pr.org_id AND pr.is_active = true
JOIN profiles p ON o.id = p.organization_id AND p.role = 'ADMIN'
WHERE pr.id IS NULL;