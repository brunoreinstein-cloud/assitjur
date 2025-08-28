export interface FieldCorrection {
  field: string;
  original: string | null;
  corrected: string;
  reason: string;
  confidence: number;
}

export interface OrgSettings {
  defaultReuNome?: string;
  applyDefaultReuOnTestemunha: boolean;
  requireReuOnProcesso: boolean;
}

/**
 * Preenche campos em branco com valores inteligentes baseados no contexto
 */
export function fillEmptyFields(
  row: Record<string, any>, 
  rowIndex: number,
  sheetType: 'processo' | 'testemunha',
  orgSettings?: OrgSettings
): FieldCorrection[] {
  const corrections: FieldCorrection[] = [];

  // Preenche réu padrão se configurado
  if (orgSettings?.defaultReuNome && 
      (!row.reu_nome || row.reu_nome.trim() === '')) {
    
    const shouldApply = sheetType === 'processo' || 
                       (sheetType === 'testemunha' && orgSettings.applyDefaultReuOnTestemunha);
    
    if (shouldApply) {
      corrections.push({
        field: 'reu_nome',
        original: row.reu_nome || null,
        corrected: orgSettings.defaultReuNome,
        reason: 'Aplicado réu padrão da organização',
        confidence: 0.9
      });
    }
  }

  // Preenche reclamante em testemunhas baseado no contexto
  if (sheetType === 'testemunha' && 
      (!row.reclamante_nome || row.reclamante_nome.trim() === '')) {
    
    // Se tem nome da testemunha e não tem reclamante, pode tentar inferir
    if (row.nome_testemunha && row.nome_testemunha.trim() !== '') {
      // Busca padrões como "Fulano (reclamante)" ou "Fulano - autor"
      const testemunhaName = row.nome_testemunha.trim();
      const patterns = [
        /^(.+?)\s*\(\s*reclamante\s*\)$/i,
        /^(.+?)\s*-\s*autor$/i,
        /^(.+?)\s*,\s*reclamante$/i
      ];
      
      for (const pattern of patterns) {
        const match = testemunhaName.match(pattern);
        if (match) {
          corrections.push({
            field: 'reclamante_nome',
            original: row.reclamante_nome || null,
            corrected: match[1].trim(),
            reason: 'Inferido do nome da testemunha',
            confidence: 0.7
          });
          break;
        }
      }
    }
  }

  // Normaliza nomes em branco para null
  const nameFields = ['reclamante_nome', 'reu_nome', 'nome_testemunha'];
  nameFields.forEach(field => {
    if (row[field] && typeof row[field] === 'string' && row[field].trim() === '') {
      corrections.push({
        field,
        original: row[field],
        corrected: null as any,
        reason: 'Campo vazio convertido para null',
        confidence: 1.0
      });
    }
  });

  // Preenche fase padrão se vazio
  if (!row.fase || row.fase.trim() === '') {
    corrections.push({
      field: 'fase',
      original: row.fase || null,
      corrected: 'Em andamento',
      reason: 'Fase padrão aplicada',
      confidence: 0.6
    });
  }

  // Preenche status padrão se vazio
  if (!row.status || row.status.trim() === '') {
    corrections.push({
      field: 'status',
      original: row.status || null,
      corrected: 'Ativo',
      reason: 'Status padrão aplicado',
      confidence: 0.6
    });
  }

  return corrections;
}

/**
 * Corrige capitalização de nomes
 */
export function correctNameCapitalization(name: string): FieldCorrection | null {
  if (!name || typeof name !== 'string') return null;

  const original = name.trim();
  if (!original) return null;

  // Lista de preposições e artigos que devem ficar em minúscula
  const lowercaseWords = new Set([
    'de', 'da', 'do', 'das', 'dos', 'e', 'ou', 'y', 'del', 'la', 'el',
    'von', 'van', 'di', 'le', 'du', 'mc', 'mac', 'o'
  ]);

  // Converte para Title Case respeitando regras
  const words = original.toLowerCase().split(/\s+/);
  const correctedWords = words.map((word, index) => {
    // Primeira palavra sempre maiúscula
    if (index === 0) {
      return capitalizeWord(word);
    }
    
    // Verifica se é preposição/artigo
    if (lowercaseWords.has(word)) {
      return word;
    }
    
    return capitalizeWord(word);
  });

  const corrected = correctedWords.join(' ');
  
  if (corrected !== original) {
    return {
      field: 'nome',
      original,
      corrected,
      reason: 'Capitalização corrigida',
      confidence: 0.8
    };
  }

  return null;
}

/**
 * Capitaliza uma palavra respeitando casos especiais
 */
function capitalizeWord(word: string): string {
  if (!word) return word;
  
  // Casos especiais
  if (word.toLowerCase().startsWith('mc')) {
    return 'Mc' + word.substring(2).charAt(0).toUpperCase() + word.substring(3).toLowerCase();
  }
  
  if (word.toLowerCase().startsWith('mac')) {
    return 'Mac' + word.substring(3).charAt(0).toUpperCase() + word.substring(4).toLowerCase();
  }
  
  // Caso normal
  return word.charAt(0).toUpperCase() + word.substring(1).toLowerCase();
}

/**
 * Corrige formatação de CPF
 */
export function correctCPFFormat(cpf: string): FieldCorrection | null {
  if (!cpf || typeof cpf !== 'string') return null;

  const original = cpf.trim();
  const digitsOnly = original.replace(/\D/g, '');
  
  if (digitsOnly.length !== 11) return null;

  // Formata como XXX.XXX.XXX-XX
  const formatted = `${digitsOnly.substring(0, 3)}.${digitsOnly.substring(3, 6)}.${digitsOnly.substring(6, 9)}-${digitsOnly.substring(9, 11)}`;
  
  if (formatted !== original) {
    return {
      field: 'cpf',
      original,
      corrected: formatted,
      reason: 'Formatação de CPF padronizada',
      confidence: 0.95
    };
  }

  return null;
}