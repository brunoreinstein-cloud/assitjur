import { z } from "zod";

// ============================================
// PROFILE SCHEMAS
// ============================================

export const personalInfoSchema = z.object({
  full_name: z
    .string()
    .min(3, "Nome deve ter pelo menos 3 caracteres")
    .max(100, "Nome muito longo"),
  email: z.string().email("Email inválido"),
  phone: z
    .string()
    .regex(
      /^\(\d{2}\) \d{4,5}-\d{4}$/,
      "Telefone inválido (formato: (11) 98765-4321)",
    )
    .optional()
    .or(z.literal("")),
  job_title: z
    .string()
    .max(100, "Cargo muito longo")
    .optional()
    .or(z.literal("")),
  language: z.enum(["pt-BR", "en-US", "es-ES"]),
  timezone: z.string().min(1, "Selecione um fuso horário"),
});

export const preferencesSchema = z.object({
  language: z.enum(["pt-BR", "en-US", "es-ES"]),
  timezone: z.string().min(1, "Selecione um fuso horário"),
  theme_preference: z.enum(["light", "dark", "system"]),
  email_notifications: z.object({
    system_alerts: z.boolean(),
    weekly_reports: z.boolean(),
    security_alerts: z.boolean(),
  }),
});

// ============================================
// ORGANIZATION SCHEMAS
// ============================================

export const organizationSchema = z.object({
  name: z
    .string()
    .min(3, "Nome deve ter pelo menos 3 caracteres")
    .max(100, "Nome muito longo"),
  code: z.string().min(2, "Código muito curto").max(20, "Código muito longo"),
  domain: z.string().url("Domínio inválido").optional().or(z.literal("")),
  cnpj: z
    .string()
    .regex(
      /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/,
      "CNPJ inválido (formato: 12.345.678/0001-90)",
    )
    .optional()
    .or(z.literal("")),
  primary_color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Cor primária inválida (formato: #RRGGBB)"),
  secondary_color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Cor secundária inválida (formato: #RRGGBB)"),
  session_timeout_minutes: z
    .number()
    .min(5, "Mínimo de 5 minutos")
    .max(480, "Máximo de 8 horas"),
  allow_concurrent_sessions: z.boolean(),
});

export type PersonalInfo = z.infer<typeof personalInfoSchema>;
export type Preferences = z.infer<typeof preferencesSchema>;
export type Organization = z.infer<typeof organizationSchema>;
