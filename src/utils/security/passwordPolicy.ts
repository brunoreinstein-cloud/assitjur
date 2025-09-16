/**
 * Enhanced password policy with breach detection and progressive requirements.
 * Implements security best practices while maintaining usability.
 */

import { checkPasswordBreach, assessPasswordStrength } from '@/utils/security/breachDetection';
import { sanitizeInput } from '@/utils/security';

export const MIN_PASSWORD_LENGTH = 12;
export const RECOMMENDED_PASSWORD_LENGTH = 16;

export interface PasswordPolicyResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  strength: {
    score: number;
    level: string;
    suggestions: string[];
  };
  breachStatus?: {
    breached: boolean;
    breachCount?: number;
  };
}

export const validatePassword = async (
  password: string, 
  userRole: 'ADMIN' | 'ANALYST' | 'VIEWER' = 'VIEWER',
  checkBreaches = true
): Promise<PasswordPolicyResult> => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Sanitize input
  const cleanPassword = sanitizeInput(password);
  if (cleanPassword !== password) {
    errors.push('Senha contém caracteres não permitidos');
  }

  // Basic length requirement
  if (password.length < MIN_PASSWORD_LENGTH) {
    errors.push(`Senha deve ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres`);
  }

  // Progressive requirements based on role
  const adminRequired = userRole === 'ADMIN';
  const minLengthForRole = adminRequired ? RECOMMENDED_PASSWORD_LENGTH : MIN_PASSWORD_LENGTH;
  
  if (adminRequired && password.length < RECOMMENDED_PASSWORD_LENGTH) {
    errors.push(`Administradores devem usar senhas com pelo menos ${RECOMMENDED_PASSWORD_LENGTH} caracteres`);
  }

  // Character complexity requirements
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

  if (!hasUpper) errors.push('Senha deve conter pelo menos uma letra maiúscula');
  if (!hasLower) errors.push('Senha deve conter pelo menos uma letra minúscula');
  if (!hasNumber) errors.push('Senha deve conter pelo menos um número');
  if (!hasSpecial) errors.push('Senha deve conter pelo menos um caractere especial');

  // Enhanced security for admins
  if (adminRequired) {
    const specialCount = (password.match(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/g) || []).length;
    if (specialCount < 2) {
      errors.push('Administradores devem usar pelo menos 2 caracteres especiais');
    }
  }

  // Common patterns detection
  const commonPatterns = [
    /123|abc|qwerty|password|admin|login/i,
    /(.)\1{2,}/, // Repeated characters
    /^[a-zA-Z]+\d+$/, // Letters followed by numbers only
    /^\d+[a-zA-Z]+$/, // Numbers followed by letters only
  ];

  for (const pattern of commonPatterns) {
    if (pattern.test(password)) {
      if (adminRequired) {
        errors.push('Senha contém padrões comuns - use uma combinação mais complexa');
      } else {
        warnings.push('Considere usar uma combinação menos previsível');
      }
      break;
    }
  }

  // Get password strength assessment
  const strength = assessPasswordStrength(password);
  
  // Strength requirements by role
  if (adminRequired && strength.score < 70) {
    errors.push('Administradores devem usar senhas mais fortes (pontuação mínima: 70)');
  } else if (strength.score < 40) {
    warnings.push('Considere usar uma senha mais forte para maior segurança');
  }

  // Check for breaches if enabled and password meets basic requirements
  let breachStatus;
  if (checkBreaches && password.length >= MIN_PASSWORD_LENGTH) {
    try {
      const breachResult = await checkPasswordBreach(password);
      breachStatus = {
        breached: breachResult.breached,
        breachCount: breachResult.breachCount
      };

      if (breachResult.breached) {
        const breachCount = breachResult.breachCount || 0;
        if (breachCount > 100000) {
          errors.push('Esta senha foi exposta em grandes vazamentos de dados - escolha uma diferente');
        } else if (breachCount > 1000) {
          errors.push('Esta senha foi comprometida em vazamentos de dados - recomendamos uma diferente');
        } else if (breachCount > 0) {
          warnings.push('Esta senha aparece em vazamentos de dados conhecidos');
        }
      }
    } catch (error) {
      // Don't fail validation if breach check fails, just warn
      warnings.push('Não foi possível verificar vazamentos de dados');
    }
  }

  return { 
    valid: errors.length === 0, 
    errors,
    warnings,
    strength: {
      score: strength.score,
      level: strength.level,
      suggestions: strength.suggestions
    },
    breachStatus
  };
};


