import React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Check, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

// Validation rules
export interface ValidationRule {
  test: (value: string) => boolean;
  message: string;
  level: 'error' | 'warning' | 'info';
}

// Common validation patterns
export const validationPatterns = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  cnj: /^\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}$/,
  cpf: /^\d{3}\.\d{3}\.\d{3}-\d{2}$/,
  cnpj: /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/,
  phone: /^\(\d{2}\)\s\d{4,5}-\d{4}$/,
  oab: /^[A-Z]{2}\d{3,6}$/,
  strongPassword: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
};

// Common validation rules
export const commonValidationRules = {
  required: (message = 'Campo obrigatório'): ValidationRule => ({
    test: (value) => value.trim().length > 0,
    message,
    level: 'error'
  }),

  email: (message = 'Email deve ter formato válido'): ValidationRule => ({
    test: (value) => !value || validationPatterns.email.test(value),
    message,
    level: 'error'
  }),

  cnj: (message = 'CNJ deve estar no formato correto'): ValidationRule => ({
    test: (value) => !value || validationPatterns.cnj.test(value),
    message,
    level: 'error'
  }),

  cpf: (message = 'CPF deve estar no formato correto'): ValidationRule => ({
    test: (value) => !value || validationPatterns.cpf.test(value),
    message,
    level: 'error'
  }),

  minLength: (min: number, message?: string): ValidationRule => ({
    test: (value) => value.length >= min,
    message: message || `Deve ter pelo menos ${min} caracteres`,
    level: 'error'
  }),

  maxLength: (max: number, message?: string): ValidationRule => ({
    test: (value) => value.length <= max,
    message: message || `Deve ter no máximo ${max} caracteres`,
    level: 'warning'
  }),

  strongPassword: (message = 'Senha deve ter pelo menos 8 caracteres, com maiúscula, minúscula, número e símbolo'): ValidationRule => ({
    test: (value) => validationPatterns.strongPassword.test(value),
    message,
    level: 'error'
  }),

  noXSS: (message = 'Entrada contém caracteres não permitidos'): ValidationRule => ({
    test: (value) => !/<[^>]*>|[<>'"`;]/.test(value),
    message,
    level: 'error'
  }),

  noSQLInjection: (message = 'Entrada contém padrões suspeitos'): ValidationRule => ({
    test: (value) => !/(\bUNION\b|\bSELECT\b|\bINSERT\b|\bDELETE\b|\bDROP\b)/i.test(value),
    message,
    level: 'error'
  })
};

// Input with validation
interface ValidatedInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  label?: string;
  rules?: ValidationRule[];
  value: string;
  onChange: (value: string) => void;
  showValidation?: boolean;
  sanitize?: boolean;
}

export function ValidatedInput({ 
  label, 
  rules = [], 
  value, 
  onChange, 
  showValidation = true,
  sanitize = true,
  className,
  ...props 
}: ValidatedInputProps) {
  const validationResults = rules.map(rule => ({
    ...rule,
    passed: rule.test(value)
  }));

  const hasErrors = validationResults.some(r => r.level === 'error' && !r.passed);
  const hasWarnings = validationResults.some(r => r.level === 'warning' && !r.passed);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = e.target.value;
    
    // Basic sanitization
    if (sanitize) {
      newValue = newValue
        .replace(/<[^>]*>/g, '') // Remove HTML tags
        .replace(/[<>'"`;]/g, ''); // Remove dangerous characters
    }
    
    onChange(newValue);
  };

  return (
    <div className="space-y-2">
      {label && (
        <Label className="flex items-center gap-2">
          {label}
          {sanitize && (
            <Shield className="w-3 h-3 text-muted-foreground" />
          )}
        </Label>
      )}
      
      <Input
        {...props}
        value={value}
        onChange={handleChange}
        className={cn(
          className,
          hasErrors && 'border-destructive focus-visible:ring-destructive',
          hasWarnings && !hasErrors && 'border-warning focus-visible:ring-warning'
        )}
      />
      
      {showValidation && validationResults.length > 0 && (
        <div className="space-y-1">
          {validationResults.map((result, index) => {
            if (result.passed) return null;
            
            const Icon = result.level === 'error' ? AlertCircle : 
                        result.level === 'warning' ? AlertCircle : Check;
            
            const colorClass = result.level === 'error' ? 'text-destructive' :
                              result.level === 'warning' ? 'text-warning' : 'text-muted-foreground';
            
            return (
              <div key={index} className={`flex items-center gap-2 text-sm ${colorClass}`}>
                <Icon className="w-3 h-3" />
                <span>{result.message}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Textarea with validation
interface ValidatedTextareaProps {
  label?: string;
  rules?: ValidationRule[];
  value: string;
  onChange: (value: string) => void;
  showValidation?: boolean;
  sanitize?: boolean;
  placeholder?: string;
  className?: string;
  rows?: number;
}

export function ValidatedTextarea({ 
  label, 
  rules = [], 
  value, 
  onChange, 
  showValidation = true,
  sanitize = true,
  className,
  ...props 
}: ValidatedTextareaProps) {
  const validationResults = rules.map(rule => ({
    ...rule,
    passed: rule.test(value)
  }));

  const hasErrors = validationResults.some(r => r.level === 'error' && !r.passed);
  const hasWarnings = validationResults.some(r => r.level === 'warning' && !r.passed);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    let newValue = e.target.value;
    
    // Basic sanitization
    if (sanitize) {
      newValue = newValue
        .replace(/<[^>]*>/g, '') // Remove HTML tags
        .replace(/[<>'"`;]/g, ''); // Remove dangerous characters
    }
    
    onChange(newValue);
  };

  return (
    <div className="space-y-2">
      {label && (
        <Label className="flex items-center gap-2">
          {label}
          {sanitize && (
            <Shield className="w-3 h-3 text-muted-foreground" />
          )}
        </Label>
      )}
      
      <Textarea
        {...props}
        value={value}
        onChange={handleChange}
        className={cn(
          className,
          hasErrors && 'border-destructive focus-visible:ring-destructive',
          hasWarnings && !hasErrors && 'border-warning focus-visible:ring-warning'
        )}
      />
      
      {showValidation && validationResults.length > 0 && (
        <div className="space-y-1">
          {validationResults.map((result, index) => {
            if (result.passed) return null;
            
            const Icon = result.level === 'error' ? AlertCircle : 
                        result.level === 'warning' ? AlertCircle : Check;
            
            const colorClass = result.level === 'error' ? 'text-destructive' :
                              result.level === 'warning' ? 'text-warning' : 'text-muted-foreground';
            
            return (
              <div key={index} className={`flex items-center gap-2 text-sm ${colorClass}`}>
                <Icon className="w-3 h-3" />
                <span>{result.message}</span>
              </div>
            );
          })}
        </div>
      )}
      
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{value.length} caracteres</span>
        {rules.some(r => r.message.includes('máximo')) && (
          <span>
            Max: {rules.find(r => r.message.includes('máximo'))?.message.match(/\d+/)?.[0] || '?'}
          </span>
        )}
      </div>
    </div>
  );
}

// Password strength indicator
export function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { test: /.{8,}/, label: 'Pelo menos 8 caracteres' },
    { test: /[a-z]/, label: 'Letra minúscula' },
    { test: /[A-Z]/, label: 'Letra maiúscula' },
    { test: /\d/, label: 'Número' },
    { test: /[@$!%*?&]/, label: 'Símbolo especial' }
  ];

  const passedChecks = checks.filter(check => check.test.test(password));
  const strength = passedChecks.length;

  const strengthColors = {
    0: 'bg-gray-200',
    1: 'bg-red-500',
    2: 'bg-orange-500', 
    3: 'bg-yellow-500',
    4: 'bg-lime-500',
    5: 'bg-green-500'
  };

  const strengthLabels = {
    0: 'Muito Fraca',
    1: 'Fraca',
    2: 'Razoável',
    3: 'Boa',
    4: 'Forte', 
    5: 'Muito Forte'
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Força da senha:</span>
        <Badge 
          variant="outline" 
          className={`text-xs ${strengthColors[strength as keyof typeof strengthColors]} border-transparent text-white font-medium`}
        >
          {strengthLabels[strength as keyof typeof strengthLabels]}
        </Badge>
      </div>
      
      <div className="flex gap-1">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className={`h-2 flex-1 rounded-full ${
              i < strength ? strengthColors[strength as keyof typeof strengthColors] : 'bg-gray-200'
            }`}
          />
        ))}
      </div>
      
      <div className="space-y-1">
        {checks.map((check, index) => (
          <div key={index} className="flex items-center gap-2 text-xs">
            <Check 
              className={`w-3 h-3 ${
                check.test.test(password) ? 'text-green-600' : 'text-gray-300'
              }`} 
            />
            <span className={check.test.test(password) ? 'text-green-600' : 'text-muted-foreground'}>
              {check.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}