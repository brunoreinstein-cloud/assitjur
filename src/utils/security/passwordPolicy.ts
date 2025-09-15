/**
 * Simplified password policy.
 * Product decision: reduce friction by requiring only a minimal length.
 * Adjust MIN_PASSWORD_LENGTH here if stricter rules are needed later.
 */

export const MIN_PASSWORD_LENGTH = 12;

export interface PasswordPolicyResult {
  valid: boolean;
  errors: string[];
}

export const validatePassword = async (password: string): Promise<PasswordPolicyResult> => {
  const errors: string[] = [];

  if (password.length < MIN_PASSWORD_LENGTH) {
    errors.push(`Senha deve ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres`);
  }

  // Check for at least one uppercase letter
  if (!/[A-Z]/.test(password)) {
    errors.push('Senha deve conter pelo menos uma letra maiúscula');
  }

  // Check for at least one lowercase letter
  if (!/[a-z]/.test(password)) {
    errors.push('Senha deve conter pelo menos uma letra minúscula');
  }

  // Check for at least one number
  if (!/\d/.test(password)) {
    errors.push('Senha deve conter pelo menos um número');
  }

  // Check for at least one special character
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Senha deve conter pelo menos um caractere especial');
  }

  return { valid: errors.length === 0, errors };
};


