import { FunctionsHttpError } from "@supabase/supabase-js";

// Map specific function error messages to user friendly Portuguese messages
const ERROR_MESSAGE_MAP: Record<string, string> = {
  "invalid uf filter": "Verifique os filtros",
  "invalid status filter": "Verifique os filtros",
  "invalid fase filter": "Verifique os filtros",
  "invalid search filter": "Verifique os filtros",
  "Invalid JSON payload": "Verifique os filtros",
  "Request body must be a JSON object": "Verifique os filtros",
  "Missing or invalid 'page'": "Preencha página >= 1",
  "Missing or invalid 'limit'": "Preencha página >= 1",
};

/**
 * Transforms a {@link FunctionsHttpError} into a user friendly message.
 * Also logs extra context and response in development for easier debugging.
 */
export function mapFunctionsError(error: FunctionsHttpError): string {
  if (import.meta.env.DEV) {
    console.error("FunctionsHttpError context:", error.context);
    // Note: FunctionsHttpError doesn't have a direct response property
    console.error("FunctionsHttpError details:", error);
  }

  const contextError = (error.context as any)?.error as string | undefined;
  return contextError && ERROR_MESSAGE_MAP[contextError]
    ? ERROR_MESSAGE_MAP[contextError]
    : "Erro ao executar função.";
}
