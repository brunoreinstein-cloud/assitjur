// Security utilities for input sanitization and validation
import { createHash } from "node:crypto";

/**
 * Masks an email leaving only first character and domain visible.
 * @example
 * maskEmail('john@example.com'); //=> 'j***@example.com'
 */
export const maskEmail = (email: string) =>
  email.replace(/(.).+(@.+)/, (_m, a, b) => `${a}***${b}`);

/**
 * Masks a CPF string preserving first three and last two digits.
 * Expects only numbers.
 * @example
 * maskCPF('12345678901'); //=> '123******01'
 */
export const maskCPF = (cpf: string) =>
  cpf.replace(/^(\d{3})\d{6}(\d{2})$/, (_m, a, b) => `${a}******${b}`);

/**
 * Hashes a string using SHA-256. Uses Web Crypto when available and
 * falls back to Node's `createHash` in non-browser environments.
 */
export const hashString = async (input: string): Promise<string> => {
  if (globalThis.crypto?.subtle) {
    const data = new TextEncoder().encode(input);
    const hashBuffer = await globalThis.crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  }
  return createHash("sha256").update(input).digest("hex");
};

/**
 * Verifies a string against a previously generated hash using SHA-256.
 */
export const verifyHash = async (value: string, hash: string): Promise<boolean> => {
  const computed = await hashString(value);
  return computed === hash;
};

/**
 * Recursively removes known PII fields from an object.
 * Keys removed: cpf, cnpj, email, password.
 * @example
 * stripPII({ name: 'Ana', email: 'ana@test.com', cpf: '12345678901' });
 * //=> { name: 'Ana' }
 */
export const stripPII = <T>(obj: T): T => {
  const piiKeys = ["cpf", "cnpj", "email", "password"];

  if (Array.isArray(obj)) {
    return obj.map(item => stripPII(item)) as unknown as T;
  }

  if (obj && typeof obj === "object") {
    const clean: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj as Record<string, any>)) {
      if (piiKeys.includes(key.toLowerCase())) continue;
      clean[key] = stripPII(value);
    }
    return clean as unknown as T;
  }

  return obj;
};

export interface PrivilegedUser {
  role: string;
  permissions?: string[];
}

export interface ProtectedResource {
  allowedRoles: string[];
}

/**
 * Ensures the user has at least one of the roles permitted for the resource.
 * Throws an error if the user lacks privilege.
 * @example
 * assertLeastPrivilege({ role: 'admin' }, { allowedRoles: ['admin'] });
 */
export const assertLeastPrivilege = (
  user: PrivilegedUser,
  resource: ProtectedResource
): true => {
  const userRoles = [user.role, ...(user.permissions ?? [])];
  const allowed = resource.allowedRoles.some(r => userRoles.includes(r));
  if (!allowed) {
    throw new Error("Access denied: insufficient privileges");
  }
  return true;
};

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
  'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://api.openai.com"],
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
