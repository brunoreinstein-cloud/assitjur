// Utility functions for masking PII (Personal Identifiable Information)

export function maskCPF(cpf: string): string {
  if (!cpf) return cpf;
  return cpf.replace(/(\d{3})\.\d{3}\.\d{3}-(\d{2})/, '$1.***.***-$2');
}

export function maskCNPJ(cnpj: string): string {
  if (!cnpj) return cnpj;
  return cnpj.replace(/(\d{2})\.\d{3}\.\d{3}\/\d{4}-(\d{2})/, '$1.***.***/**-$2');
}

export function maskEmail(email: string): string {
  if (!email) return email;
  const [user, domain] = email.split('@');
  if (user.length <= 2) return `${user}***@${domain}`;
  return `${user.slice(0, 2)}***@${domain}`;
}

export function maskPhone(phone: string): string {
  if (!phone) return phone;
  return phone.replace(/(\d{2})\d{4,5}(\d{4})/, '$1****$2');
}

export function maskOAB(oab: string): string {
  if (!oab) return oab;
  return oab.replace(/(\d{2,3})\d+/, '$1***');
}

export function maskPII(text: string): string {
  if (!text) return text;
  
  let masked = text;
  
  // CPF pattern: XXX.XXX.XXX-XX
  masked = masked.replace(/\d{3}\.\d{3}\.\d{3}-\d{2}/g, (match) => maskCPF(match));
  
  // CNPJ pattern: XX.XXX.XXX/XXXX-XX
  masked = masked.replace(/\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}/g, (match) => maskCNPJ(match));
  
  // Email pattern
  masked = masked.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, (match) => maskEmail(match));
  
  // Phone patterns
  masked = masked.replace(/\(\d{2}\)\s?\d{4,5}-?\d{4}/g, (match) => maskPhone(match));
  
  // OAB pattern (simplified)
  masked = masked.replace(/OAB[-\/]?\s?\d{3,6}/gi, (match) => {
    const numbers = match.match(/\d{3,6}/)?.[0] || '';
    return match.replace(numbers, maskOAB(numbers));
  });
  
  return masked;
}

export function applyPIIMask(data: any, shouldMask: boolean): any {
  if (!shouldMask || !data) return data;
  
  if (typeof data === 'string') {
    return maskPII(data);
  }
  
  if (Array.isArray(data)) {
    return data.map(item => applyPIIMask(item, shouldMask));
  }
  
  if (typeof data === 'object') {
    const masked: any = {};
    for (const [key, value] of Object.entries(data)) {
      masked[key] = applyPIIMask(value, shouldMask);
    }
    return masked;
  }
  
  return data;
}