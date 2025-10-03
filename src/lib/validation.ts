/**
 * Sistema de validação centralizado com Zod
 * Implementa schemas reutilizáveis para validação runtime
 */

import { z } from "zod";

// Schemas básicos reutilizáveis
export const schemas = {
  // Identificadores
  uuid: z.string().uuid("UUID inválido"),
  orgId: z.string().min(1, "ID da organização é obrigatório"),

  // CNJ
  cnj: z.string().refine((val) => {
    const cleaned = val.replace(/[^\d]/g, "");
    return cleaned.length === 20 && /^\d{20}$/.test(cleaned);
  }, "CNJ deve ter 20 dígitos numéricos"),

  // Campos de texto
  nonEmptyString: z.string().min(1, "Campo obrigatório").trim(),
  optionalString: z.string().optional(),

  // Arrays
  stringArray: z.array(z.string()),
  nonEmptyStringArray: z
    .array(z.string())
    .min(1, "Pelo menos um item é necessário"),

  // Paginação
  page: z.number().int().min(1, "Página deve ser >= 1"),
  limit: z.number().int().min(1).max(100, "Limite máximo de 100 itens"),

  // Filtros
  filters: z
    .object({
      search: z.string().optional(),
      classificacao: z.array(z.string()).optional(),
      qtdMin: z.number().int().min(0).optional(),
      qtdMax: z.number().int().min(0).optional(),
    })
    .optional(),
};

// Schemas para entidades principais
export const ProcessoSchema = z.object({
  cnj: schemas.cnj,
  reclamante: schemas.nonEmptyString,
  reclamada: schemas.nonEmptyString,
  testemunhas_ativas: schemas.stringArray,
  testemunhas_passivas: schemas.stringArray,
  qtd_testemunhas: z.number().int().min(0),
  classificacao: schemas.nonEmptyString,
  classificacao_estrategica: schemas.optionalString,
  created_at: z.string(),
});

export const ProcessosRequestSchema = z.object({
  filters: schemas.filters,
  page: schemas.page.default(1),
  limit: schemas.limit.default(50),
});

export const AuthProfileSchema = z.object({
  id: schemas.uuid,
  organization_id: schemas.orgId,
  role: z.enum(["admin", "user", "viewer"]),
  email: z.string().email("E-mail inválido"),
});

// Helper para validação segura
export function validateData<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);

  if (!result.success) {
    const errorMessage = result.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join(", ");

    throw new Error(`Dados inválidos: ${errorMessage}`);
  }

  return result.data;
}

// Validação com fallback para dados opcionais
export function validateOptional<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  fallback: T,
): T {
  try {
    return validateData(schema, data);
  } catch {
    return fallback;
  }
}

// Tipos inferidos dos schemas
export type Processo = z.infer<typeof ProcessoSchema>;
export type ProcessosRequest = z.infer<typeof ProcessosRequestSchema>;
export type AuthProfile = z.infer<typeof AuthProfileSchema>;
