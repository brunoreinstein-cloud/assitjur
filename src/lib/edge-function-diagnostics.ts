/**
 * Diagnóstico de Edge Functions
 * Verifica conectividade, autenticação e configuração das Edge Functions
 */

import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";

export interface EdgeFunctionDiagnostics {
  functionName: string;
  isReachable: boolean;
  hasAuth: boolean;
  authError?: string;
  configError?: string;
  testResult?: "success" | "error" | "not_tested";
  errorDetails?: any;
}

/**
 * Testa conectividade básica de uma Edge Function
 */
export async function testEdgeFunctionConnectivity(
  functionName: string,
): Promise<EdgeFunctionDiagnostics> {
  const diagnostics: EdgeFunctionDiagnostics = {
    functionName,
    isReachable: false,
    hasAuth: false,
  };

  try {
    // Verifica sessão
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      diagnostics.authError = sessionError.message;
      logger.error(`[EdgeDiagnostics] Erro de sessão para ${functionName}`, {
        error: sessionError,
      });
      return diagnostics;
    }

    if (!session) {
      diagnostics.authError = "Nenhuma sessão ativa";
      logger.warn(
        `[EdgeDiagnostics] Nenhuma sessão ativa para ${functionName}`,
      );
      return diagnostics;
    }

    diagnostics.hasAuth = true;

    // Tenta uma chamada básica
    logger.info(`[EdgeDiagnostics] Testando ${functionName}...`);
    const { data, error } = await supabase.functions.invoke(functionName, {
      body: {
        paginacao: { page: 1, limit: 1 },
        filtros: {},
      },
    });

    if (error) {
      diagnostics.testResult = "error";
      diagnostics.errorDetails = {
        message: error.message,
        context: error.context,
        status: error.status,
      };
      logger.error(`[EdgeDiagnostics] Erro ao testar ${functionName}`, {
        error,
        errorDetails: diagnostics.errorDetails,
      });
    } else {
      diagnostics.isReachable = true;
      diagnostics.testResult = "success";
      logger.info(`[EdgeDiagnostics] ${functionName} respondeu com sucesso`, {
        hasData: !!data,
        dataKeys: data ? Object.keys(data) : [],
      });
    }

    return diagnostics;
  } catch (error) {
    diagnostics.testResult = "error";
    diagnostics.errorDetails = error;
    logger.error(`[EdgeDiagnostics] Exceção ao testar ${functionName}`, {
      error,
    });
    return diagnostics;
  }
}

/**
 * Executa diagnóstico completo de todas as Edge Functions do Mapa
 */
export async function runMapaDiagnostics(): Promise<
  Record<string, EdgeFunctionDiagnostics>
> {
  logger.info(
    "🔍 [EdgeDiagnostics] ===== INICIANDO DIAGNÓSTICO COMPLETO =====",
  );

  const functions = [
    "mapa-testemunhas-processos",
    "mapa-testemunhas-testemunhas",
  ];

  const results: Record<string, EdgeFunctionDiagnostics> = {};

  for (const fn of functions) {
    logger.info(`🔍 [EdgeDiagnostics] Testando função: ${fn}`);
    results[fn] = await testEdgeFunctionConnectivity(fn);
  }

  logger.info("✅ [EdgeDiagnostics] ===== DIAGNÓSTICO CONCLUÍDO =====", {
    results,
  });

  // Log resumo
  const summary = Object.entries(results).map(([name, diag]) => ({
    function: name,
    reachable: diag.isReachable,
    authenticated: diag.hasAuth,
    testResult: diag.testResult,
    error: diag.errorDetails?.message || diag.authError || "none",
  }));

  console.table(summary);

  return results;
}

/**
 * Verifica configuração do Supabase Client
 */
export function logSupabaseConfig() {
  logger.info("🔍 [EdgeDiagnostics] ===== CONFIGURAÇÃO SUPABASE =====");

  const config = {
    hasSupabaseClient: !!supabase,
    functionsUrl: `${import.meta.env.VITE_SUPABASE_URL}/functions/v1` || "NOT_CONFIGURED",
    hasAuth: !!supabase?.auth,
  };

  logger.info("🔍 [EdgeDiagnostics] Config:", config);
  console.table(config);

  return config;
}
