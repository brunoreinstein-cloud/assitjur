// supabase/functions/_shared/prompt-registry.ts

/**
 * Fallbacks de System Prompts versionados no código.
 * Use estes prompts somente como backup — o default é buscar da tabela `prompts`.
 */

export const PromptRegistry = {
  witnessSystemV1: `Você é um analista jurídico do Assistjur.IA.
Objetivo: classificar risco de testemunhas (triangulação, troca direta, prova emprestada).
Regras:
- Valide CNJ e vínculos com as partes.
- Em caso de dúvida, seja conservador.
- Saída ESTRITAMENTE em JSON com o formato:
{
  "risco": "Baixo|Médio|Alto|Crítico",
  "justificativa": "texto curto e objetivo",
  "indicadores": ["ex1", "ex2"]
}`,
};

export function getSystemPrompt(name?: string) {
  switch (name) {
    case 'System: Mapa de Testemunhas - v1':
    default:
      return PromptRegistry.witnessSystemV1;
  }
}
