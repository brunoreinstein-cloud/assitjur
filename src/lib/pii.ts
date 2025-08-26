// PII masking utilities for LGPD compliance

export const maskCPF = (cpf: string | null | undefined): string => {
  if (!cpf) return '';
  
  // Remove any existing formatting
  const cleaned = cpf.replace(/\D/g, '');
  
  if (cleaned.length === 11) {
    // Format: 000******00
    return cleaned.replace(/(\d{3})\d{6}(\d{2})/, '$1******$2');
  }
  
  // If not 11 digits, mask most characters
  if (cleaned.length >= 3) {
    return cleaned.substring(0, 2) + '*'.repeat(Math.max(1, cleaned.length - 4)) + cleaned.slice(-2);
  }
  
  return '*'.repeat(cpf.length);
};

export const maskCNPJ = (cnpj: string | null | undefined): string => {
  if (!cnpj) return '';
  
  const cleaned = cnpj.replace(/\D/g, '');
  
  if (cleaned.length === 14) {
    // Format: 00*********0000
    return cleaned.replace(/(\d{2})\d{9}(\d{4})/, '$1*********$2');
  }
  
  // If not 14 digits, mask most characters
  if (cleaned.length >= 6) {
    return cleaned.substring(0, 2) + '*'.repeat(Math.max(1, cleaned.length - 6)) + cleaned.slice(-4);
  }
  
  return '*'.repeat(cnpj.length);
};

export const maskEmail = (email: string | null | undefined): string => {
  if (!email) return '';
  
  const [localPart, domain] = email.split('@');
  if (!localPart || !domain) return email;
  
  // Keep first 1-2 characters of local part
  const keepChars = Math.min(2, localPart.length);
  const maskedLocal = localPart.substring(0, keepChars) + '*'.repeat(Math.max(1, localPart.length - keepChars));
  
  return `${maskedLocal}@${domain}`;
};

export const maskPhone = (phone: string | null | undefined): string => {
  if (!phone) return '';
  
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.length >= 8) {
    // Keep area code (if present) and last 2 digits
    if (cleaned.length === 11) {
      // (00) 0****-**00
      return cleaned.replace(/(\d{2})(\d{1})\d{4}(\d{2})/, '($1) $2****-**$3');
    } else if (cleaned.length === 10) {
      // (00) ****-**00
      return cleaned.replace(/(\d{2})\d{4}(\d{2})/, '($1) ****-**$2');
    } else {
      // General masking: keep first 2 and last 2
      return cleaned.substring(0, 2) + '*'.repeat(cleaned.length - 4) + cleaned.slice(-2);
    }
  }
  
  return '*'.repeat(phone.length);
};

export const maskOAB = (oab: string | null | undefined): string => {
  if (!oab) return '';
  
  // Extract numbers from OAB
  const numbers = oab.replace(/\D/g, '');
  
  if (numbers.length >= 4) {
    // Keep first and last digits, mask middle
    return oab.replace(/\d/g, (digit, index, str) => {
      const numberIndex = str.substring(0, index + 1).replace(/\D/g, '').length - 1;
      if (numberIndex === 0 || numberIndex === numbers.length - 1) {
        return digit;
      }
      return '*';
    });
  }
  
  return oab.replace(/\d/g, '*');
};

export const maskName = (name: string | null | undefined): string => {
  if (!name) return '';
  
  const words = name.split(/\s+/);
  
  return words.map(word => {
    if (word.length <= 3) {
      // Short words (like "da", "de", "do") - mask all but first char
      return word.charAt(0) + '*'.repeat(Math.max(0, word.length - 1));
    }
    
    // Longer words - keep first 2 chars and last char
    return word.substring(0, 2) + '*'.repeat(Math.max(0, word.length - 3)) + word.slice(-1);
  }).join(' ');
};

// Main PII detection and masking function
export const applyPIIMask = (text: string | null | undefined): string => {
  if (!text) return '';
  
  let result = text;
  
  // CPF pattern: 000.000.000-00 or 00000000000
  result = result.replace(/\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g, (match) => maskCPF(match));
  
  // CNPJ pattern: 00.000.000/0000-00 or 00000000000000
  result = result.replace(/\b\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}\b/g, (match) => maskCNPJ(match));
  
  // Email pattern
  result = result.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, (match) => maskEmail(match));
  
  // Phone patterns
  result = result.replace(/\(\d{2}\)?\s*\d{4,5}-?\d{4}\b/g, (match) => maskPhone(match));
  
  // OAB pattern: OAB/XX 000000 or similar
  result = result.replace(/\bOAB\/?\w{2}\s*\d+/gi, (match) => maskOAB(match));
  
  return result;
};

// Utility to check if PII masking should be applied to a specific field
export const shouldMaskField = (fieldName: string): boolean => {
  const sensitiveFields = [
    'reclamante_limpo',
    'nome_testemunha',
    'advogados_parte_ativa',
    'advogados_passivo',
    'testemunhas_ativo_limpo',
    'testemunhas_passivo_limpo',
    'todas_testemunhas',
    'testemunhas_prova_emprestada',
    'reu_nome',
    'cnjs_como_reclamante',
    'cnjs_como_testemunha',
    'cnjs_ativo',
    'cnjs_passivo',
  ];
  
  return sensitiveFields.some(field => 
    fieldName.toLowerCase().includes(field.toLowerCase())
  );
};
