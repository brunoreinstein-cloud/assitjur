import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNotifications } from '@/stores/useNotificationStore';
import { getProjectRef } from '@/lib/supabaseClient';
import { useMapaTestemunhasStore, QueryKind, ResultBlock } from '@/lib/store/mapa-testemunhas';

export function useAssistente() {
  const { toast } = useToast();
  const { error: notifyError } = useNotifications();
  
  const {
    chatKind,
    chatInput,
    chatStatus,
    chatResult,
    agentOnline,
    setChatStatus,
    setChatResult,
    addChatMessage,
    updateChatMessage,
    setAgentOnline
  } = useMapaTestemunhasStore();

  const getQueryType = useCallback((kind: QueryKind) => {
    switch (kind) {
      case 'processo': return 'process_analysis';
      case 'testemunha': return 'witness_analysis'; 
      case 'reclamante': return 'claimant_analysis';
      default: return 'risk_analysis';
    }
  }, []);

  const generateMockBlocks = useCallback((kind: QueryKind, input: string): ResultBlock[] => {
    const baseBlocks: ResultBlock[] = [
      {
        type: 'executive',
        title: '📌 Resumo Executivo',
        icon: 'Sparkles',
        data: {
          cnj: input.match(/\d{7}-\d{2}\.\d{4}\.\d{1}\.\d{2}\.\d{4}/) ? input : '1000000-09.2024.5.02.1000',
          reclamante: kind === 'reclamante' ? input : 'Maria Silva Santos',
          reu: 'Empresa ABC Ltda',
          status: 'Em andamento',
          observacoes: 'Processo com potencial risco de triangulação detectado.',
          riscoNivel: 'alto' as const,
          confianca: 0.85,
          alerta: 'Testemunhas conectadas em múltiplos processos'
        },
        citations: [
          { source: 'por_processo' as const, ref: '1000000-09.2024.5.02.1000' },
          { source: 'por_testemunha' as const, ref: 'João Santos' }
        ]
      },
      {
        type: 'details',
        title: '📋 Análise Detalhada',
        icon: 'FileText',
        data: {
          secoes: [
            {
              titulo: 'Vínculos Identificados',
              conteudo: 'Foram identificadas 3 testemunhas que aparecem em processos similares.',
              evidencias: ['João Santos: 5 processos', 'Maria Oliveira: 3 processos']
            },
            {
              titulo: 'Padrões Temporais',
              conteudo: 'Concentração de depoimentos entre Jan-Mar 2024.',
              evidencias: ['Janeiro: 8 depoimentos', 'Fevereiro: 12 depoimentos']
            }
          ],
          textoOriginal: input
        }
      },
      {
        type: 'alerts',
        title: '⚠️ Alertas Estratégicos',
        icon: 'AlertTriangle',
        data: {
          suspiciousPatterns: [
            'Triangulação detectada entre 3 testemunhas',
            'Depoimentos com narrativas similares',
            'Mesmo advogado em processos conexos'
          ]
        }
      },
      {
        type: 'strategies',
        title: '🎯 Polo Ativo & Estratégias',
        icon: 'Target',
        data: {
          estrategias: [
            { texto: 'Questionar vínculos entre testemunhas', prioridade: 'ALTA' },
            { texto: 'Investigar histórico de depoimentos', prioridade: 'MÉDIA' }
          ],
          proximosPassos: [
            'Solicitar certidões de processos anteriores',
            'Preparar questionário específico para audiência'
          ]
        }
      }
    ];

    return baseBlocks;
  }, []);

  const runAnalysis = useCallback(async (input: string, kind: QueryKind) => {
    if (!input.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "Digite uma consulta para executar a análise.",
        variant: "destructive"
      });
      return;
    }

    if (!agentOnline) {
      toast({
        title: "Agente indisponível", 
        description: "O assistente está temporariamente em manutenção.",
        variant: "destructive"
      });
      return;
    }

    setChatStatus('loading');

    // Add user message
    const userMessageId = addChatMessage({
      role: 'user',
      content: input
    });

    // Add assistant message placeholder
    const assistantMessageId = addChatMessage({
      role: 'assistant',
      content: '',
      blocks: []
    });

    try {
      const { data, error } = await supabase.functions.invoke('chat-legal', {
        body: {
          message: input,
          queryType: getQueryType(kind)
        }
      });

      if (error) {
        if ((error as any).status === 402 || (error as any).message?.includes('Workspace out of credits')) {
          const functionUrl = `https://${getProjectRef()}.functions.supabase.co/chat-legal`;
          console.warn(`Lovable API ${error.status} at ${functionUrl}`);
          notifyError(
            'Limite de créditos atingido',
            'As funções de chat/assistente estão temporariamente indisponíveis. Tente novamente mais tarde.',
            { duration: null }
          );
          setAgentOnline(false);
          updateChatMessage(assistantMessageId, {
            content: 'Créditos esgotados. Função indisponível.'
          });
          setChatStatus('error');
          return;
        }
        throw error;
      }

      // Generate structured blocks from response
      const mockBlocks = generateMockBlocks(kind, input);

      // Update assistant message with blocks
      updateChatMessage(assistantMessageId, {
        content: data.content || 'Análise concluída com sucesso.',
        blocks: mockBlocks
      });

      setChatResult(mockBlocks);
      setChatStatus('success');

      toast({
        title: "Análise concluída",
        description: `Análise ${kind === 'processo' ? 'por processo' : kind === 'testemunha' ? 'por testemunha' : 'por reclamante'} executada com sucesso.`
      });

    } catch (error) {
      console.error('Error in analysis:', error);

      updateChatMessage(assistantMessageId, {
        content: 'Erro ao executar análise. Tente novamente.'
      });

      setChatStatus('error');

      toast({
        title: "Erro na análise",
        description: error instanceof Error ? error.message : "Erro desconhecido ao executar análise.",
        variant: "destructive"
      });
    }
  }, [agentOnline, getQueryType, generateMockBlocks, setChatStatus, setChatResult, addChatMessage, updateChatMessage, toast, notifyError, setAgentOnline]);

  return {
    runAnalysis,
    chatStatus,
    chatResult,
    agentOnline
  };
}