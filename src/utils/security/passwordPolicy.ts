export const MIN_PASSWORD_LENGTH = 8;
export const MIN_PASSWORD_ENTROPY = 40; // bits

const BANNED_TERMS = ['oab', 'cnj', 'cpf', 'processo'];

export interface PasswordPolicyResult {
  valid: boolean;
  errors: string[];
}

export const calculateEntropy = (password: string): number => {
  if (!password) return 0;
  const len = password.length;
  const frequencies: Record<string, number> = {};
  for (const char of password) {
    frequencies[char] = (frequencies[char] || 0) + 1;
  }
  let entropy = 0;
  for (const freq of Object.values(frequencies)) {
    const p = freq / len;
    entropy -= p * Math.log2(p);
  }
  return entropy * len;
};

const sha1 = async (text: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-1', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
};

export const isPasswordPwned = async (password: string, timeoutMs = 5000): Promise<boolean> => {
  const hash = await sha1(password);
  const prefix = hash.slice(0, 5);
  const suffix = hash.slice(5);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      method: 'GET',
      headers: { 'Add-Padding': 'true' },
      signal: controller.signal
    });
    const text = await res.text();
    const lines = text.split('\n');
    for (const line of lines) {
      const [hashSuffix, count] = line.split(':');
      if (hashSuffix === suffix) {
        return parseInt(count) > 0;
      }
    }
    return false;
  } finally {
    clearTimeout(timer);
  }
};

export const validatePassword = async (password: string): Promise<PasswordPolicyResult> => {
  const errors: string[] = [];

  if (password.length < MIN_PASSWORD_LENGTH) {
    errors.push(`Senha deve ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres`);
  }

  const entropy = calculateEntropy(password);
  if (entropy < MIN_PASSWORD_ENTROPY) {
    errors.push('Senha com entropia insuficiente');
  }

  if (BANNED_TERMS.some(term => password.toLowerCase().includes(term))) {
    errors.push('Senha contém termos jurídicos comuns');
  }

  try {
    const pwned = await isPasswordPwned(password);
    if (pwned) {
      errors.push('Senha comprometida em vazamentos');
    }
  } catch (err) {
    console.warn('HIBP check failed', err);
  }

  return { valid: errors.length === 0, errors };
};

