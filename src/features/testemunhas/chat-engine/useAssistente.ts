import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNotifications } from "@/stores/useNotificationStore";
import { getProjectRef } from "@/lib/supabaseClient";
import { logger } from "@/lib/logger";
import {
  useMapaTestemunhasStore,
  QueryKind,
  ResultBlock,
} from "@/lib/store/mapa-testemunhas";
import {
  normalizeStatus,
  normalizeRiscoNivel,
  calculateConfidence,
  inferirStatus,
  normalizarClassificacao,
} from "@/lib/data-quality";

type ChatContextType = "processo" | "testemunha";

interface ChatContextMeta {
  status?: string;
  statusInferido?: boolean;
  classificacao?: string;
  riscoNivel?: "baixo" | "medio" | "alto" | "critico";
  confidence?: number;
}

interface ChatContextPayload {
  type: ChatContextType;
  data: Record<string, unknown>;
  meta?: ChatContextMeta;
}

interface ChatLegalPayload {
  message: string;
  queryType: string;
  promptName?: string;
  context?: ChatContextPayload;
}

interface SupabaseFunctionError {
  status?: number;
  message?: string;
}

const isSupabaseFunctionError = (
  error: unknown,
): error is SupabaseFunctionError =>
  typeof error === "object" && error !== null &&
  ("status" in error || "message" in error);

export function useAssistente() {
  const { toast } = useToast();
  const { error: notifyError } = useNotifications();

  const {
    chatStatus,
    chatResult,
    agentOnline,
    selectedProcesso,
    selectedTestemunha,
    setChatStatus,
    setChatResult,
    addChatMessage,
    updateChatMessage,
    setAgentOnline,
  } = useMapaTestemunhasStore();

  const getQueryType = useCallback((kind: QueryKind) => {
    switch (kind) {
      case "processo":
        return "process_analysis";
      case "testemunha":
        return "witness_analysis";
      case "reclamante":
        return "claimant_analysis";
      default:
        return "risk_analysis";
    }
  }, []);

  const generateMockBlocks = useCallback(
    (kind: QueryKind, input: string): ResultBlock[] => {
      const executiveConfidence = 0.85;

      const baseBlocks: ResultBlock[] = [
        {
          type: "executive",
          title: "📌 Resumo Executivo",
          icon: "Sparkles",
          data: {
            cnj: input.match(/\d{7}-\d{2}\.\d{4}\.\d{1}\.\d{2}\.\d{4}/)
              ? input
              : "1000000-09.2024.5.02.1000",
            reclamante: kind === "reclamante" ? input : "Maria Silva Santos",
            reu: "Empresa ABC Ltda",
            status: "Em andamento",
            observacoes:
              "Processo com potencial risco de triangulação detectado.",
            riscoNivel: "alto" as const,
            confianca: executiveConfidence,
            alerta: "Testemunhas conectadas em múltiplos processos",
          },
          meta: {
            status: "Em andamento",
            observacoes:
              "Processo com potencial risco de triangulação detectado.",
            riscoNivel: "alto",
            confidence: executiveConfidence,
          },
          citations: [
            {
              source: "por_processo" as const,
              ref: "1000000-09.2024.5.02.1000",
            },
            { source: "por_testemunha" as const, ref: "João Santos" },
          ],
        },
        {
          type: "details",
          title: "📋 Análise Detalhada",
          icon: "FileText",
          data: {
            secoes: [
              {
                titulo: "Vínculos Identificados",
                conteudo:
                  "Foram identificadas 3 testemunhas que aparecem em processos similares.",
                evidencias: [
                  "João Santos: 5 processos",
                  "Maria Oliveira: 3 processos",
                ],
              },
              {
                titulo: "Padrões Temporais",
                conteudo: "Concentração de depoimentos entre Jan-Mar 2024.",
                evidencias: [
                  "Janeiro: 8 depoimentos",
                  "Fevereiro: 12 depoimentos",
                ],
              },
            ],
            textoOriginal: input,
          },
        },
        {
          type: "alerts",
          title: "⚠️ Alertas Estratégicos",
          icon: "AlertTriangle",
          data: {
            suspiciousPatterns: [
              "Triangulação detectada entre 3 testemunhas",
              "Depoimentos com narrativas similares",
              "Mesmo advogado em processos conexos",
            ],
          },
        },
        {
          type: "strategies",
          title: "🎯 Polo Ativo & Estratégias",
          icon: "Target",
          data: {
            estrategias: [
              {
                texto: "Questionar vínculos entre testemunhas",
                prioridade: "ALTA",
              },
              {
                texto: "Investigar histórico de depoimentos",
                prioridade: "MÉDIA",
              },
            ],
            proximosPassos: [
              "Solicitar certidões de processos anteriores",
              "Preparar questionário específico para audiência",
            ],
          },
        },
      ];

      return baseBlocks;
    },
    [],
  );

  const runAnalysis = useCallback(
    async (input: string, kind: QueryKind) => {
      if (!input.trim()) {
        toast({
          title: "Campo obrigatório",
          description: "Digite uma consulta para executar a análise.",
          variant: "destructive",
        });
        return;
      }

      if (!agentOnline) {
        toast({
          title: "Agente indisponível",
          description: "O assistente está temporariamente em manutenção.",
          variant: "destructive",
        });
        return;
      }

      setChatStatus("loading");

      toast({
        title: "Análise iniciada",
        description: "Processando sua consulta...",
      });

      // Add user message

      // Add assistant message placeholder
      const assistantMessageId = addChatMessage({
        role: "assistant",
        content: "",
        blocks: [],
      });

      try {
        // Smart context enrichment - automatically include selected item data
        const payload: ChatLegalPayload = {
          message: input,
          queryType: getQueryType(kind),
        };

        // Auto-detect and enrich context with meta data
        if (
          selectedProcesso &&
          (kind === "processo" ||
            input.match(/\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}/))
        ) {
          const statusInferido = inferirStatus(selectedProcesso);
          const classificacaoNormalizada = normalizarClassificacao(
            selectedProcesso.classificacao_final,
          );
          const riscoNivel = normalizeRiscoNivel(
            selectedProcesso.classificacao_final,
            selectedProcesso.score_risco,
            selectedProcesso.insight_estrategico,
          );
          const confidence = calculateConfidence(selectedProcesso, [
            "cnj",
            "reclamante_nome",
            "reu_nome",
            "status",
            "classificacao_final",
          ]);

          payload.context = {
            type: "processo",
            data: {
              cnj: selectedProcesso.cnj || selectedProcesso.numero_cnj,
              reclamante: selectedProcesso.reclamante_nome,
              reu: selectedProcesso.reu_nome,
              status: statusInferido.status,
              statusInferido: statusInferido.inferido,
              fase: selectedProcesso.fase,
              uf: selectedProcesso.uf,
              comarca: selectedProcesso.comarca,
              testemunhas_ativo: selectedProcesso.testemunhas_ativo,
              testemunhas_passivo: selectedProcesso.testemunhas_passivo,
              classificacao: classificacaoNormalizada,
              classificacao_final: selectedProcesso.classificacao_final,
              score_risco: selectedProcesso.score_risco,
              insight_estrategico: selectedProcesso.insight_estrategico,
              riscoNivel: riscoNivel,
            },
            meta: {
              status: statusInferido.status,
              statusInferido: statusInferido.inferido,
              classificacao: classificacaoNormalizada,
              riscoNivel: riscoNivel,
              confidence: confidence,
            },
          };
        } else if (selectedTestemunha && kind === "testemunha") {
          const classificacaoNormalizada = normalizarClassificacao(
            selectedTestemunha.classificacao_final,
          );
          const riscoNivel = normalizeRiscoNivel(
            selectedTestemunha.classificacao_final,
            selectedTestemunha.score_risco,
            null,
          );
          const confidence = calculateConfidence(selectedTestemunha, [
            "nome_testemunha",
            "qtd_depoimentos",
            "classificacao_final",
          ]);

          payload.context = {
            type: "testemunha",
            data: {
              nome: selectedTestemunha.nome_testemunha,
              qtd_depoimentos: selectedTestemunha.qtd_depoimentos,
              processos_cnj: selectedTestemunha.processos_cnj,
              foi_testemunha_em_ambos_polos:
                selectedTestemunha.foi_testemunha_em_ambos_polos,
              ja_foi_reclamante: selectedTestemunha.ja_foi_reclamante,
              classificacao_final: classificacaoNormalizada,
              score_risco: selectedTestemunha.score_risco,
            },
            meta: {
              status: selectedTestemunha.foi_testemunha_em_ambos_polos
                ? "Ativo em ambos polos"
                : "Normal",
              statusInferido: false,
              classificacao: classificacaoNormalizada,
              riscoNivel: riscoNivel,
              confidence: confidence,
            },
          };
        }

        // Log payload detalhado para debug
        logger.debug("Enviando payload para chat-legal", {
          message: payload.message,
          queryType: payload.queryType,
          hasContext: !!payload.context,
          contextType: payload.context?.type,
          hasMeta: !!payload.context?.meta,
          meta: payload.context?.meta,
          dataKeys: payload.context?.data
            ? Object.keys(payload.context.data)
            : [],
        }, "useAssistente");

        const { data, error } = await supabase.functions.invoke("chat-legal", {
          body: payload,
        });

          if (error) {
            if (
              isSupabaseFunctionError(error) &&
              (error.status === 402 ||
                error.message?.includes("Workspace out of credits"))
            ) {
            const functionUrl = `https://${getProjectRef()}.functions.supabase.co/chat-legal`;
            logger.warn("Lovable API limite de créditos", { status: error.status, url: functionUrl }, "useAssistente");
            notifyError(
              "Limite de créditos atingido",
              "As funções de chat/assistente estão temporariamente indisponíveis. Tente novamente mais tarde.",
              { duration: undefined },
            );
            setAgentOnline(false);
            updateChatMessage(assistantMessageId, {
              content: "Créditos esgotados. Função indisponível.",
            });
            setChatStatus("error");
            return;
          }
          throw error;
        }

        // Extract real response from OpenAI
        const aiResponse = data?.data || data?.content || "";
        logger.debug("Raw AI Response recebida", {
          type: typeof aiResponse,
          length: aiResponse.length,
          preview: aiResponse.substring(0, 300),
        }, "useAssistente");

        // Parse response with multiple fallback strategies
        let blocks: ResultBlock[] = [];

        // Strategy 1: Direct JSON parse (expecting {"blocks": [...]})
        try {
          const parsed = JSON.parse(aiResponse);
          logger.debug("JSON parsed com sucesso", { type: typeof parsed }, "useAssistente");

          // Check if it's the new format {"blocks": [...]}
          if (parsed.blocks && Array.isArray(parsed.blocks)) {
            blocks = parsed.blocks;
            logger.debug("Blocks array extraído", { count: blocks.length }, "useAssistente");
          }
          // Old format: direct array
          else if (Array.isArray(parsed) && parsed.length > 0) {
            blocks = parsed;
            logger.debug("Direct array de blocks", { count: blocks.length }, "useAssistente");
          }
          // Single block object
          else if (parsed.type) {
            blocks = [parsed];
            logger.debug("Single block object detectado", {}, "useAssistente");
          } else {
            logger.warn("JSON parsed mas estrutura inesperada", { keys: Object.keys(parsed) }, "useAssistente");
          }
        } catch (e1) {
          logger.error("Falha ao fazer parse de JSON", { error: e1 }, "useAssistente");

          // Strategy 2: Extract JSON object from mixed text
          try {
            const jsonMatch = aiResponse.match(/\{[\s\S]*"blocks"[\s\S]*\}/);
            if (jsonMatch) {
              const parsed = JSON.parse(jsonMatch[0]);
              blocks = parsed.blocks || [];
              logger.debug("Blocks extraídos de texto", { count: blocks.length }, "useAssistente");
            }
          } catch (e2) {
            logger.error("Extração de JSON falhou", { error: e2 }, "useAssistente");
          }
        }

        // FALLBACK: Se não há blocos após todas as tentativas, gerar blocos básicos
        if (!blocks || blocks.length === 0) {
          logger.info("Gerando fallback blocks", { input: input.substring(0, 100) }, "useAssistente");
          blocks = [
            {
              type: "executive",
              title: "📊 Resumo Executivo",
              icon: "FileText",
              data: {
                cnj: input.match(/\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}/)
                  ? input
                  : "0000000-00.0000.0.00.0000",
                reclamante:
                  selectedProcesso?.reclamante_nome || "Aguardando dados...",
                reu: selectedProcesso?.reu_nome || "Aguardando dados...",
                status: normalizeStatus(selectedProcesso?.status),
                observacoes:
                  selectedProcesso?.observacoes ||
                  `Análise iniciada para: ${input.substring(0, 100)}${input.length > 100 ? "..." : ""}`,
                riscoNivel: normalizeRiscoNivel(
                  selectedProcesso?.classificacao_final,
                  selectedProcesso?.score_risco,
                ),
                confianca: selectedProcesso
                  ? calculateConfidence(selectedProcesso, [
                      "cnj",
                      "reclamante_nome",
                      "reu_nome",
                      "status",
                    ])
                  : 0.5,
                alerta: undefined,
                citacoes: [],
              },
            },
            {
              type: "details",
              title: "🔍 Análise Detalhada",
              icon: "Search",
              data: {
                secoes: [
                  {
                    titulo: "Informações Disponíveis",
                    conteudo: `Consulta realizada: ${input}`,
                    evidencias: [],
                  },
                  {
                    titulo: "Análise",
                    conteudo:
                      "Aguardando processamento completo pelo sistema. Por favor, tente novamente em alguns instantes.",
                    evidencias: [],
                  },
                  {
                    titulo: "Recomendações",
                    conteudo: "Ações sugeridas:",
                    evidencias: [
                      "Verificar se os dados estão disponíveis no sistema",
                      "Confirmar formato da consulta (CNJ, nome, etc)",
                      "Aguardar alguns instantes e tentar novamente",
                    ],
                  },
                ],
              },
            },
          ];
          logger.debug("Fallback blocks gerados", { count: blocks.length }, "useAssistente");
        }

        // CORREÇÃO: Enriquecer os blocos com o contexto e meta originais antes de setar
        const enrichedBlocks = blocks.map((block) => ({
          ...block,
          context: payload.context, // Adicionar contexto original do payload
          meta: payload.context?.meta, // Adicionar meta enriquecido
        }));

        // Update assistant message with real data
        updateChatMessage(assistantMessageId, {
          content: enrichedBlocks.length > 0 ? "Análise concluída" : aiResponse,
          blocks: enrichedBlocks,
        });

        setChatResult(enrichedBlocks);
        setChatStatus("success");

        toast({
          title: "Análise concluída",
          description: `Análise ${kind === "processo" ? "por processo" : kind === "testemunha" ? "por testemunha" : "por reclamante"} executada com sucesso.`,
        });
      } catch (error) {
        console.error("Error in analysis:", error);

        updateChatMessage(assistantMessageId, {
          content: "Erro ao executar análise. Tente novamente.",
        });

        setChatStatus("error");

        toast({
          title: "Erro na análise",
          description:
            error instanceof Error
              ? error.message
              : "Erro desconhecido ao executar análise.",
          variant: "destructive",
        });
      }
    },
    [
      agentOnline,
      getQueryType,
      generateMockBlocks,
      setChatStatus,
      setChatResult,
      addChatMessage,
      updateChatMessage,
      toast,
      notifyError,
      setAgentOnline,
    ],
  );

  return {
    runAnalysis,
    chatStatus,
    chatResult,
    agentOnline,
  };
}
