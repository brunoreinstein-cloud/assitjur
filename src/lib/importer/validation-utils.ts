import type { ValidationIssue, ValidationSeverity } from "@/lib/importer/types";

// Utility function to create consistent ValidationIssue objects
export function createValidationIssue({
  sheet,
  row,
  column,
  severity,
  rule,
  value,
  autofilled,
  originalColumn,
}: {
  sheet: string;
  row: number;
  column: string;
  severity: ValidationSeverity;
  rule: string;
  value: any;
  autofilled?: boolean;
  originalColumn?: string;
}): ValidationIssue {
  // Generate a descriptive message based on the rule and context
  let message = rule;

  // Enhanced messages for common validation rules
  if (rule.includes("obrigatório")) {
    message = `Campo "${column}" é obrigatório mas está vazio`;
  } else if (rule.includes("CNJ")) {
    message = `CNJ inválido: "${value}" - deve ter formato correto`;
  } else if (rule.includes("duplicado")) {
    message = `Valor duplicado encontrado: "${value}"`;
  } else if (rule.includes("lista vazia")) {
    message = `Lista "${column}" não pode estar vazia`;
  } else if (rule.includes("formato")) {
    message = `Formato inválido em "${column}": "${value}"`;
  } else if (autofilled) {
    message = `Campo "${column}" preenchido automaticamente com "${value}"`;
  }

  return {
    sheet,
    row,
    column,
    severity,
    rule,
    message,
    value,
    autofilled,
    originalColumn,
  };
}
