import { z } from "zod";

/**
 * Environment variables schema - Define todas as variáveis obrigatórias
 * 
 * IMPORTANTE: Adicione novas variáveis aqui para garantir que existam no build
 */
const envSchema = z.object({
  // Supabase (OBRIGATÓRIAS)
  VITE_SUPABASE_URL: z.string().url("VITE_SUPABASE_URL deve ser uma URL válida"),
  VITE_SUPABASE_ANON_KEY: z.string().min(1, "VITE_SUPABASE_ANON_KEY é obrigatória"),
  
  // Opcionais com defaults
  VITE_SENTRY_DSN: z.string().optional(),
  VITE_POSTHOG_KEY: z.string().optional(),
  VITE_POSTHOG_HOST: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Valida as variáveis de ambiente
 * 
 * @throws {z.ZodError} Se alguma variável obrigatória estiver faltando
 */
export function validateEnv(): Env {
  try {
    return envSchema.parse({
      VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
      VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
      VITE_SENTRY_DSN: import.meta.env.VITE_SENTRY_DSN,
      VITE_POSTHOG_KEY: import.meta.env.VITE_POSTHOG_KEY,
      VITE_POSTHOG_HOST: import.meta.env.VITE_POSTHOG_HOST,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map((e) => `  - ${e.path.join(".")}: ${e.message}`).join("\n");
      
      throw new Error(
        `❌ Variáveis de ambiente inválidas ou faltando:\n\n${missingVars}\n\n` +
        `📝 Crie um arquivo .env na raiz do projeto com as variáveis necessárias.\n` +
        `📖 Consulte .env.example para referência.\n`
      );
    }
    throw error;
  }
}

/**
 * Valida as variáveis de ambiente e retorna tipadas
 * 
 * IMPORTANTE: Chame esta função no início do main.tsx
 */
export function getValidatedEnv(): Env {
  try {
    return validateEnv();
  } catch (error) {
    // Em desenvolvimento, mostrar erro mas não quebrar
    if (import.meta.env.DEV) {
      console.warn('⚠️ Variáveis de ambiente não configuradas:', error);
      return {
        VITE_SUPABASE_URL: 'https://dummy.supabase.local',
        VITE_SUPABASE_ANON_KEY: 'dummy-key',
        VITE_SENTRY_DSN: undefined,
        VITE_POSTHOG_KEY: undefined,
        VITE_POSTHOG_HOST: undefined,
      };
    }
    throw error;
  }
}
