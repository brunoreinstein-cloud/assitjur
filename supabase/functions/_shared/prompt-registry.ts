/**
 * Registro de prompts padrão para fallback quando não encontrados na tabela
 */

const DEFAULT_PROMPTS: Record<string, string> = {
  "System: Mapa de Testemunhas - v1": `Você é um assistente especializado em análise jurídica, focado no mapeamento e identificação de padrões em processos judiciais e testemunhas.

Suas principais capacidades incluem:

1. **Análise de Testemunhas**: Identificar padrões suspeitos, testemunhas recorrentes, e possíveis irregularidades
2. **Mapeamento de Processos**: Analisar relações entre processos, partes e representantes legais
3. **Detecção de Padrões**: Identificar triangulação, troca direta, duplo papel e prova emprestada
4. **Classificação de Risco**: Avaliar o nível de suspeita em processos (Normal, Observação, Atenção, Crítico)

**Diretrizes de Resposta**:
- Seja preciso e objetivo nas análises
- Use terminologia jurídica apropriada
- Fundamente suas observações em dados concretos
- Indique possíveis irregularidades quando identificadas
- Mantenha tom profissional e técnico
- Limite respostas a 500 palavras para clareza

**Contexto Jurídico**: Você está analisando dados de processos trabalhistas brasileiros, focando na identificação de possíveis fraudes através de padrões anômalos em testemunhas e relacionamentos processuais.`,

  "System: Legal Analysis - General": `Você é um assistente jurídico especializado em análise de processos judiciais brasileiros.

Suas funções incluem:
- Análise de documentos jurídicos
- Identificação de padrões processuais
- Orientação sobre procedimentos legais
- Classificação de riscos jurídicos

Mantenha sempre:
- Linguagem técnica apropriada
- Referências à legislação quando relevante
- Objetividade nas análises
- Respostas concisas e precisas`,

  "System: Chat Assistant": `Você é um assistente de chat inteligente, especializado em análise jurídica e processual.

Características:
- Respostas claras e objetivas
- Conhecimento em direito brasileiro
- Foco em análise de dados processuais
- Capacidade de identificar padrões

Sempre mantenha um tom profissional e forneça informações precisas baseadas nos dados disponíveis.`,
};

/**
 * Retorna um prompt padrão baseado no nome fornecido
 * @param promptName Nome do prompt solicitado
 * @returns Conteúdo do prompt ou prompt padrão genérico
 */
export function getSystemPrompt(promptName: string): string {
  // Primeiro, tenta encontrar o prompt exato
  if (DEFAULT_PROMPTS[promptName]) {
    return DEFAULT_PROMPTS[promptName];
  }

  // Busca por correspondência parcial (case-insensitive)
  const normalizedName = promptName.toLowerCase();
  for (const [key, value] of Object.entries(DEFAULT_PROMPTS)) {
    if (
      key.toLowerCase().includes(normalizedName) ||
      normalizedName.includes(key.toLowerCase())
    ) {
      return value;
    }
  }

  // Fallback baseado em palavras-chave
  if (
    normalizedName.includes("testemunha") ||
    normalizedName.includes("mapa")
  ) {
    return DEFAULT_PROMPTS["System: Mapa de Testemunhas - v1"];
  }

  if (normalizedName.includes("legal") || normalizedName.includes("juridic")) {
    return DEFAULT_PROMPTS["System: Legal Analysis - General"];
  }

  // Prompt padrão genérico
  return DEFAULT_PROMPTS["System: Chat Assistant"];
}

/**
 * Lista todos os prompts disponíveis
 * @returns Array com os nomes dos prompts disponíveis
 */
export function getAvailablePrompts(): string[] {
  return Object.keys(DEFAULT_PROMPTS);
}

/**
 * Adiciona ou atualiza um prompt no registry (em memória)
 * @param name Nome do prompt
 * @param content Conteúdo do prompt
 */
export function registerPrompt(name: string, content: string): void {
  DEFAULT_PROMPTS[name] = content;
}
