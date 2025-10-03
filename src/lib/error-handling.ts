/**
 * Sistema de tratamento de erros centralizado para AssistJur.IA
 * Implementa padrões consistentes de logging, validação e recuperação
 */

import { logger } from "@/lib/logger";
import { toast } from "sonner";

// Tipos de erro padronizados
export type ErrorCategory =
  | "validation"
  | "network"
  | "authentication"
  | "authorization"
  | "business"
  | "system"
  | "user_input";

export interface AppError extends Error {
  category: ErrorCategory;
  code?: string;
  context?: Record<string, any>;
  userMessage?: string;
  retryable?: boolean;
  cause?: Error;
}

export class AssistJurError extends Error implements AppError {
  category: ErrorCategory;
  code?: string;
  context?: Record<string, any>;
  userMessage?: string;
  retryable?: boolean;
  cause?: Error;

  constructor(
    message: string,
    category: ErrorCategory,
    options?: {
      code?: string;
      context?: Record<string, any>;
      userMessage?: string;
      retryable?: boolean;
      cause?: Error;
    },
  ) {
    super(message);
    this.name = "AssistJurError";
    this.category = category;
    this.code = options?.code;
    this.context = options?.context;
    this.userMessage = options?.userMessage;
    this.retryable = options?.retryable ?? false;
    this.cause = options?.cause;
  }
}

// Factory functions para tipos comuns de erro
export const createError = {
  validation: (message: string, context?: Record<string, any>) =>
    new AssistJurError(message, "validation", {
      userMessage: "Dados inválidos fornecidos",
      context,
    }),

  network: (message: string, retryable = true, context?: Record<string, any>) =>
    new AssistJurError(message, "network", {
      userMessage: "Falha de conexão. Verifique sua internet.",
      retryable,
      context,
    }),

  authentication: (message: string, context?: Record<string, any>) =>
    new AssistJurError(message, "authentication", {
      userMessage: "Sessão expirada. Faça login novamente.",
      context,
    }),

  authorization: (message: string, context?: Record<string, any>) =>
    new AssistJurError(message, "authorization", {
      userMessage: "Acesso negado. Verifique suas permissões.",
      context,
    }),

  business: (
    message: string,
    userMessage?: string,
    context?: Record<string, any>,
  ) =>
    new AssistJurError(message, "business", {
      userMessage: userMessage || "Operação não permitida",
      context,
    }),

  system: (message: string, context?: Record<string, any>) =>
    new AssistJurError(message, "system", {
      userMessage:
        "Erro interno do sistema. Tente novamente em alguns minutos.",
      context,
    }),
};

// Handler centralizado de erros
export class ErrorHandler {
  static handle(error: unknown, service?: string): AppError {
    let appError: AppError;

    if (error instanceof AssistJurError) {
      appError = error;
    } else if (error instanceof Error) {
      // Converte erros comuns em AppError
      if (error.message?.includes("fetch")) {
        appError = createError.network(error.message, true, {
          originalError: error.message,
        });
      } else if (
        error.message?.includes("auth") ||
        error.message?.includes("session")
      ) {
        appError = createError.authentication(error.message, {
          originalError: error.message,
        });
      } else {
        appError = createError.system(error.message, {
          originalError: error.message,
        });
      }
    } else {
      appError = createError.system("Erro desconhecido", {
        originalError: String(error),
      });
    }

    // Log estruturado
    logger.error(
      appError.message,
      {
        category: appError.category,
        code: appError.code,
        context: appError.context,
        retryable: appError.retryable,
        stack: appError.stack,
      },
      service,
    );

    return appError;
  }

  static handleAndNotify(error: unknown, service?: string): AppError {
    const appError = this.handle(error, service);

    // Notificação ao usuário
    if (appError.userMessage) {
      toast.error(appError.userMessage);
    }

    return appError;
  }
}

// Wrapper para operações assíncronas
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  service?: string,
  notify = true,
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (notify) {
      throw ErrorHandler.handleAndNotify(error, service);
    } else {
      throw ErrorHandler.handle(error, service);
    }
  }
}

// Type guards para validações
export function isNotNull<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

export function isNotEmpty(value: string | null | undefined): value is string {
  return isNotNull(value) && value.trim().length > 0;
}

export function isValidArray<T>(value: T[] | null | undefined): value is T[] {
  return Array.isArray(value) && value.length > 0;
}

// Validações específicas do domínio
export function isValidOrgId(
  orgId: string | null | undefined,
): orgId is string {
  return isNotEmpty(orgId) && orgId.length > 0;
}

export function isValidCNJ(cnj: string | null | undefined): cnj is string {
  if (!isNotEmpty(cnj)) return false;
  // Remove pontuação e verifica se tem 20 dígitos
  const cleaned = cnj.replace(/[^\d]/g, "");
  return cleaned.length === 20 && /^\d{20}$/.test(cleaned);
}

// Wrapper para operações de API
export async function apiCall<T>(
  apiOperation: () => Promise<T>,
  service: string,
  options?: {
    retries?: number;
    timeout?: number;
    fallback?: T;
  },
): Promise<T> {
  const { retries = 2, timeout = 30000, fallback } = options || {};

  let lastError: AppError | undefined;

  for (let attempt = 1; attempt <= retries + 1; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const result = await Promise.race([
        apiOperation(),
        new Promise<never>((_, reject) =>
          controller.signal.addEventListener("abort", () =>
            reject(createError.network("Timeout na requisição", false)),
          ),
        ),
      ]);

      clearTimeout(timeoutId);
      return result;
    } catch (error) {
      lastError = ErrorHandler.handle(error, service);

      if (!lastError.retryable || attempt === retries + 1) {
        break;
      }

      // Exponential backoff
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  if (fallback !== undefined) {
    logger.warn(
      `Usando fallback após ${retries + 1} tentativas`,
      {
        service,
        error: lastError?.message ?? "Unknown error",
      },
      service,
    );
    return fallback;
  }

  throw lastError ?? new Error("Unknown error");
}
