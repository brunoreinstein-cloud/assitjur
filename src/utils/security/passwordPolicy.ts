/**
 * Simplified password policy.
 * Product decision: reduce friction by requiring only a minimal length.
 * Adjust MIN_PASSWORD_LENGTH here if stricter rules are needed later.
 */

export const MIN_PASSWORD_LENGTH = 6;

export interface PasswordPolicyResult {
  valid: boolean;
  errors: string[];
}

export const validatePassword = async (password: string): Promise<PasswordPolicyResult> => {
  const errors: string[] = [];

  if (password.length < MIN_PASSWORD_LENGTH) {
    errors.push(`Senha deve ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres`);
  }

  return { valid: errors.length === 0, errors };
};

