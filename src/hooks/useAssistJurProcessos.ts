import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { mockProcessosData, mockStatsData } from '@/lib/mock-data/assistjur-processos';

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
  initialPage = 1
) {
  const { profile } = useAuth();
  const [page, setPage] = useState(initialPage);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['assistjur-processos', profile?.organization_id, filters, page, limit],
    queryFn: async () => {
      // Validação robusta de org_id
      if (!profile?.organization_id) {
        console.error('❌ AssistJur Processos: org_id não encontrado', { profile });
        throw new Error('Organização não encontrada. Faça login novamente.');
      }

      console.log('🔄 AssistJur Processos: Iniciando requisição', {
        org_id: profile.organization_id,
        filters,
        page,
        limit
      });

      try {
        // Get session for Bearer token
        const { data: { session } } = await supabase.auth.getSession();
        const jwt = session?.access_token;
        if (!jwt) {
          throw new Error('Sessão expirada. Faça login novamente.');
        }

        const URL = "https://fgjypmlszuzkgvhuszxn.functions.supabase.co/assistjur-processos";
        
        const response = await fetch(URL, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${jwt}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ 
            filters,
            page,
            limit
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        // Log detalhado do resultado
        console.log('📊 AssistJur Processos: Resposta recebida', {
          data,
          status: 'success'
        });

        // Sistema de fallback inteligente - usar mock apenas se status 200 mas data vazio
        if (!data || !data.data || data.data.length === 0) {
          console.log('⚠️ AssistJur Processos: Dados vazios, usando fallback mock', {
            dataEmpty: !data?.data || data.data.length === 0,
            willUseMock: true
          });
          
          toast.info('Exibindo dados de exemplo. Verifique se há dados importados.');
          
          return {
            data: mockProcessosData,
            count: mockProcessosData.length,
            totalPages: 1
          };
        }

        console.log('✅ AssistJur Processos: Dados carregados com sucesso', {
          count: data.data?.length || 0,
          totalCount: data.count || 0
        });

        return data;
      } catch (err: any) {
        console.error('💥 AssistJur Processos: Erro fatal na requisição', {
          error: err,
          message: err.message,
          stack: err.stack
        });
        
        // Tratamento de erros específicos
        if (err.message?.includes('Sessão expirada')) {
          toast.error('Sessão expirada. Faça login novamente.');
        } else if (err.message?.includes('Acesso negado')) {
          toast.error('Acesso negado. Verifique suas permissões.');
        } else if (err.message?.includes('HTTP 500')) {
          toast.error('Erro interno do servidor. Tente novamente em alguns minutos.');
        } else {
          toast.error(`Erro na requisição: ${err.message || 'Erro desconhecido'}`);
        }
        
        throw err;
      }
    },
    enabled: !!profile?.organization_id,
    retry: (failureCount, error: any) => {
      // Não fazer retry em erros de autenticação/autorização
      if (error?.message?.includes('Sessão expirada') || error?.message?.includes('Acesso negado')) {
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
    setPage
  };
}

// Hook para estatísticas
export function useAssistJurStats() {
  const { profile } = useAuth();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['assistjur-stats', profile?.organization_id],
    queryFn: async () => {
      if (!profile?.organization_id) {
        console.error('❌ AssistJur Stats: org_id não encontrado');
        return null;
      }

      console.log('📈 AssistJur Stats: Carregando estatísticas', {
        org_id: profile.organization_id
      });

      try {
        const { data, error } = await supabase.functions.invoke('assistjur-stats');

        if (error) {
          console.error('❌ AssistJur Stats: Erro na Edge Function', { error });
          
          // Fallback para dados mock em caso de erro
          console.log('⚠️ AssistJur Stats: Usando dados mock como fallback');
          return mockStatsData;
        }

        console.log('✅ AssistJur Stats: Estatísticas carregadas', { data });
        return data || mockStatsData;
      } catch (err) {
        console.error('💥 AssistJur Stats: Erro fatal', { error: err });
        return mockStatsData;
      }
    },
    enabled: !!profile?.organization_id,
    staleTime: 5 * 60 * 1000,
  });

  return {
    stats,
    statsLoading
  };
}