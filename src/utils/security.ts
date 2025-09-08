// Security utilities for input sanitization and validation

export const sanitizeInput = (input: string): string => {
  if (!input) return '';
  
  return input
    // Remove HTML tags
    .replace(/<[^>]*>/g, '')
    // Remove potentially dangerous characters
    .replace(/[<>'"`;]/g, '')
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    .trim();
};

export const sanitizeJSON = (obj: any): any => {
  if (typeof obj === 'string') {
    return sanitizeInput(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(sanitizeJSON);
  }
  
  if (obj && typeof obj === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[sanitizeInput(key)] = sanitizeJSON(value);
    }
    return sanitized;
  }
  
  return obj;
};

// Rate limiting for client-side
class RateLimiter {
  private requests: { [key: string]: number[] } = {};

  checkLimit(key: string, maxRequests: number, windowMs: number): boolean {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Clean old requests
    this.requests[key] = (this.requests[key] || []).filter(time => time > windowStart);
    
    // Check if over limit
    if (this.requests[key].length >= maxRequests) {
      return false;
    }
    
    // Add current request
    this.requests[key].push(now);
    return true;
  }
  
  getWaitTime(key: string, maxRequests: number, windowMs: number): number {
    const requests = this.requests[key] || [];
    if (requests.length < maxRequests) return 0;
    
    const oldestRequest = Math.min(...requests);
    const timeToWait = (oldestRequest + windowMs) - Date.now();
    return Math.max(0, timeToWait);
  }
}

export const clientRateLimiter = new RateLimiter();

// Content Security Policy helpers
export const CSP_DIRECTIVES = {
  'default-src': ["'self'"],
  'script-src': ["'self'", "https://api.openai.com"],
  'style-src': ["'self'", "'unsafe-inline'"],
  'img-src': ["'self'", "data:", "https:"],
  'connect-src': ["'self'", "https://api.supabase.com", "https://api.openai.com", "wss:"],
  'font-src': ["'self'", "https:"],
  'object-src': ["'none'"],
  'media-src': ["'self'"],
  'frame-src': ["'none'"]
};

// Input validation patterns
export const VALIDATION_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  CNJ: /^\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}$/,
  CPF: /^\d{3}\.\d{3}\.\d{3}-\d{2}$/,
  CNPJ: /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/,
  PHONE: /^\(\d{2}\)\s?\d{4,5}-?\d{4}$/,
  OAB: /^[A-Z]{2}\s?\d{3,6}$/,
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  SAFE_TEXT: /^[a-zA-Z0-9\s\.\,\-\(\)]+$/,
  NO_SCRIPT: /^(?!.*<script).*$/i
};

// Validate file uploads
export const validateFile = (file: File): { valid: boolean; error?: string } => {
  const allowedTypes = [
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'application/pdf'
  ];
  
  const maxSize = 50 * 1024 * 1024; // 50MB
  
  if (!allowedTypes.includes(file.type)) {
    return { 
      valid: false, 
      error: 'Tipo de arquivo não permitido. Use CSV, Excel, TXT ou PDF.' 
    };
  }
  
  if (file.size > maxSize) {
    return { 
      valid: false, 
      error: 'Arquivo muito grande. Tamanho máximo: 50MB.' 
    };
  }
  
  // Check for suspicious file names
  if (/[<>:"|?*\\\/]/.test(file.name)) {
    return { 
      valid: false, 
      error: 'Nome do arquivo contém caracteres não permitidos.' 
    };
  }
  
  return { valid: true };
};

// URL validation
export const validateURL = (url: string): { valid: boolean; error?: string } => {
  try {
    const urlObj = new URL(url);
    
    // Only allow HTTPS in production
    if (process.env.NODE_ENV === 'production' && urlObj.protocol !== 'https:') {
      return { valid: false, error: 'Apenas URLs HTTPS são permitidas.' };
    }
    
    // Block suspicious domains
    const blockedDomains = ['localhost', '127.0.0.1', '0.0.0.0'];
    if (blockedDomains.some(domain => urlObj.hostname.includes(domain))) {
      return { valid: false, error: 'Domínio não permitido.' };
    }
    
    return { valid: true };
  } catch {
    return { valid: false, error: 'URL inválida.' };
  }
};

// Mask sensitive data
export const maskSensitiveData = (text: string, patterns?: Record<string, RegExp>): string => {
  const defaultPatterns = {
    cpf: /\d{3}\.\d{3}\.\d{3}-\d{2}/g,
    cnpj: /\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}/g,
    email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    phone: /\(\d{2}\)\s?\d{4,5}-?\d{4}/g,
    oab: /OAB\/[A-Z]{2}\s?\d+/g,
    ...patterns
  };
  
  let maskedText = text;
  
  maskedText = maskedText.replace(defaultPatterns.cpf, '***.***.***-**');
  maskedText = maskedText.replace(defaultPatterns.cnpj, '**.***.***/**-**');
  maskedText = maskedText.replace(defaultPatterns.email, '***@***.***');
  maskedText = maskedText.replace(defaultPatterns.phone, '(**) ****-****');
  maskedText = maskedText.replace(defaultPatterns.oab, 'OAB/** ****');
  
  return maskedText;
};

// Encrypt sensitive data for localStorage
export const encryptForStorage = (data: string): string => {
  // Simple Base64 encoding (in production, use proper encryption)
  return btoa(encodeURIComponent(data));
};

export const decryptFromStorage = (encrypted: string): string => {
  try {
    return decodeURIComponent(atob(encrypted));
  } catch {
    return '';
  }
};