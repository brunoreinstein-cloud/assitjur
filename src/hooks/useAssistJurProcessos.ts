import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  mockProcessosData,
  mockStatsData,
} from "@/lib/mock-data/assistjur-processos";
import {
  apiCall,
  isValidOrgId,
  createError,
} from "@/lib/error-handling";
import { validateData, ProcessosRequestSchema } from "@/lib/validation";

// Tipos baseados na tabela assistjur.por_processo_staging
export interface AssistJurProcesso {
  cnj: string;
  reclamante: string;
  reclamada: string; // Mapeado de reu_nome
  testemunhas_ativas: string[];
  testemunhas_passivas: string[];
  qtd_testemunhas: number;
  classificacao: string;
  classificacao_estrategica: string;
  created_at: string;
}

export interface ProcessosFilters {
  search?: string;
  classificacao?: string[];
  qtdMin?: number;
  qtdMax?: number;
}

export function useAssistJurProcessos(
  filters: ProcessosFilters = {},
  limit = 50,
  initialPage = 1,
) {
  const { profile } = useAuth();
  const [page, setPage] = useState(initialPage);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [
      "assistjur-processos",
      profile?.organization_id,
      filters,
      page,
      limit,
    ],
    queryFn: async () => {
      // Validação com type guards
      if (!isValidOrgId(profile?.organization_id)) {
        throw createError.authentication("Organização não encontrada", {
          profile: profile?.id,
        });
      }

      // Validação dos parâmetros de entrada
      const validatedRequest = validateData(ProcessosRequestSchema, {
        filters,
        page,
        limit,
      });

      return await apiCall(
        async () => {
          const {
            data: { session },
          } = await supabase.auth.getSession();
          if (!session?.access_token) {
            throw createError.authentication("Sessão expirada");
          }

          const URL =
            "https://fgjypmlszuzkgvhuszxn.functions.supabase.co/assistjur-processos";

          const response = await fetch(URL, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${session.access_token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(validatedRequest),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw createError.system(
              errorData.detail ||
                `HTTP ${response.status}: ${response.statusText}`,
              { status: response.status },
            );
          }

          const data = await response.json();

          // Sistema de fallback inteligente
          if (!data?.data || data.data.length === 0) {
            return {
              data: mockProcessosData,
              count: mockProcessosData.length,
              totalPages: 1,
            };
          }

          return data;
        },
        "AssistJurProcessos",
        {
          retries: 2,
          timeout: 30000,
          fallback: {
            data: mockProcessosData,
            count: mockProcessosData.length,
            totalPages: 1,
          },
        },
      );
    },
    enabled: !!profile?.organization_id,
    retry: (failureCount, error: any) => {
      // Não fazer retry em erros de autenticação/autorização
      if (
        error?.message?.includes("Sessão expirada") ||
        error?.message?.includes("Acesso negado")
      ) {
        return false;
      }
      return failureCount < 2;
    },
    staleTime: 5 * 60 * 1000,
  });

  return {
    data: data?.data || [],
    totalCount: data?.count || 0,
    currentPage: page,
    totalPages: data?.totalPages || 1,
    isLoading,
    error,
    refetch,
    setPage,
  };
}

// Hook para estatísticas
export function useAssistJurStats() {
  const { profile } = useAuth();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["assistjur-stats", profile?.organization_id],
    queryFn: async () => {
      if (!isValidOrgId(profile?.organization_id)) {
        throw createError.authentication(
          "Organização não encontrada para estatísticas",
        );
      }

      return await apiCall(
        async () => {
          const { data, error } =
            await supabase.functions.invoke("assistjur-stats");

          if (error) {
            throw createError.system("Erro na Edge Function de estatísticas", {
              supabaseError: error,
            });
          }

          return data || mockStatsData;
        },
        "AssistJurStats",
        {
          retries: 1,
          fallback: mockStatsData,
        },
      );
    },
    enabled: !!profile?.organization_id,
    staleTime: 5 * 60 * 1000,
  });

  return {
    stats,
    statsLoading,
  };
}
