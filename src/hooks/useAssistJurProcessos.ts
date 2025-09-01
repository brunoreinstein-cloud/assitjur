import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

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

export function useAssistJurProcessos(filters: ProcessosFilters = {}, limit = 50) {
  const { profile } = useAuth();
  const [page, setPage] = useState(1);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['assistjur-processos', profile?.organization_id, filters, page, limit],
    queryFn: async () => {
      if (!profile?.organization_id) {
        throw new Error('Organização não encontrada');
      }

      const { data, error } = await supabase.functions.invoke('assistjur-processos', {
        body: {
          filters,
          page,
          limit
        }
      });

      if (error) throw error;
      return data;
    },
    enabled: !!profile?.organization_id,
  });

  return {
    data: data?.data || [],
    totalCount: data?.count || 0,
    currentPage: page,
    totalPages: data?.totalPages || 1,
    isLoading,
    error,
    refetch,
    setPage
  };
}

// Hook para estatísticas
export function useAssistJurStats() {
  const { profile } = useAuth();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['assistjur-stats', profile?.organization_id],
    queryFn: async () => {
      if (!profile?.organization_id) return null;

      const { data, error } = await supabase.functions.invoke('assistjur-stats');

      if (error) throw error;
      return data;
    },
    enabled: !!profile?.organization_id,
  });

  return {
    stats,
    statsLoading
  };
}