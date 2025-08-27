import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Send, 
  Paperclip, 
  Wand2, 
  Loader2,
  FileText,
  User,
  TrendingUp,
  FileCheck,
  PenTool,
  HelpCircle
} from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useChatStore } from '@/stores/useChatStore';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

const commands = [
  {
    command: '/cnj',
    description: 'Buscar por número CNJ',
    example: '/cnj 0001234-56.2023.5.02.0001',
    icon: FileText,
    agentId: 'cnj'
  },
  {
    command: '/testemunha',
    description: 'Analisar testemunha específica',
    example: '/testemunha João da Silva',
    icon: User,
    agentId: 'cnj'
  },
  {
    command: '/risco',
    description: 'Análise de padrões de risco',
    example: '/risco triangulação comarca SP',
    icon: TrendingUp,
    agentId: 'risco'
  },
  {
    command: '/resumo',
    description: 'Resumo processual',
    example: '/resumo comarca São Paulo',
    icon: FileCheck,
    agentId: 'resumo'
  },
  {
    command: '/peca',
    description: 'Gerar minuta de peça',
    example: '/peca contestação triangulação',
    icon: PenTool,
    agentId: 'peca'
  },
  {
    command: '/ajuda',
    description: 'Mostrar comandos disponíveis',
    example: '/ajuda',
    icon: HelpCircle,
    agentId: 'cnj'
  }
];

export function Composer() {
  const [input, setInput] = useState('');
  const [showCommands, setShowCommands] = useState(false);
  const [showPromptImprover, setShowPromptImprover] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();
  
  const { 
    streaming, 
    setStreaming, 
    addMessage, 
    updateMessage,
    agentId, 
    setAgent,
    conversationId,
    setConversationId,
    updateCosts
  } = useChatStore();

  // Handle input change and command detection
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setInput(value);
    
    // Show commands if typing "/"
    const words = value.split(' ');
    const lastWord = words[words.length - 1];
    setShowCommands(lastWord.startsWith('/') && lastWord.length > 1);
  };

  // Handle command selection
  const handleCommandSelect = (command: any) => {
    const words = input.split(' ');
    words[words.length - 1] = command.example;
    setInput(words.join(' '));
    setAgent(command.agentId);
    setShowCommands(false);
    textareaRef.current?.focus();
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        // Shift+Enter: new line (default behavior)
        return;
      } else if (e.ctrlKey || e.metaKey) {
        // Ctrl/Cmd+Enter: send message
        e.preventDefault();
        handleSend();
      } else {
        // Enter: send message (prevent default)
        e.preventDefault();
        handleSend();
      }
    }
  };

  // Mock prompt improvement
  const handlePromptImprove = async () => {
    if (!input.trim()) return;
    
    setShowPromptImprover(true);
    
    // Mock improvement logic
    setTimeout(() => {
      const improvements = [
        "Seja mais específico sobre o período de análise",
        "Inclua critérios de triangulação específicos", 
        "Defina o escopo geográfico da consulta",
        "Especifique o tipo de irregularidade buscada"
      ];
      
      const improvedText = input + "\n\nCritérios adicionais:\n- " + improvements[Math.floor(Math.random() * improvements.length)];
      setInput(improvedText);
      setShowPromptImprover(false);
      
      toast({
        title: "Prompt melhorado!",
        description: "Sugestões de melhoria aplicadas ao seu texto.",
      });
    }, 1500);
  };

  // Handle message sending with real API
  const handleSend = async () => {
    if (!input.trim() || streaming) return;

    const userInput = input.trim();
    setInput('');
    setStreaming(true);

    // Add user message
    addMessage({
      conversationId: conversationId || 'new',
      role: 'user',
      content: userInput
    });

    // Process commands
    if (userInput.startsWith('/')) {
      const [command, ...args] = userInput.split(' ');
      const commandConfig = commands.find(c => c.command === command);
      
      if (commandConfig) {
        setAgent(commandConfig.agentId);
        
        if (command === '/ajuda') {
          const helpText = commands.map(c => 
            `${c.command} - ${c.description}\nExemplo: ${c.example}`
          ).join('\n\n');
          
          addMessage({
            conversationId: conversationId || 'new',
            role: 'assistant',
            content: `Comandos disponíveis:\n\n${helpText}`
          });
          setStreaming(false);
          return;
        }
      }
    }

    // Add assistant message placeholder
    const assistantMessageId = addMessage({
      conversationId: conversationId || 'new',
      role: 'assistant',
      content: 'Processando...',
      tokensIn: 0,
      tokensOut: 0
    });

    try {
      // Determine query type based on agent
      const queryTypeMap = {
        'cnj': 'cnj_analysis',
        'risco': 'risk_analysis', 
        'resumo': 'summary',
        'peca': 'document_draft'
      };
      
      const queryType = queryTypeMap[agentId as keyof typeof queryTypeMap] || 'general';

      // Call the chat API
      const { data, error } = await supabase.functions.invoke('chat-legal', {
        body: {
          message: userInput,
          conversationId: conversationId,
          queryType: queryType
        }
      });

      if (error) {
        throw new Error(error.message || 'Erro ao processar mensagem');
      }

      // Update assistant message with real response
      updateMessage(assistantMessageId, {
        content: data.message,
        tokensIn: data.usage?.prompt_tokens || Math.floor(userInput.length / 4),
        tokensOut: data.usage?.completion_tokens || Math.floor(data.message?.length / 4)
      });

      // Update conversation ID if it was created
      if (data.conversationId && !conversationId) {
        setConversationId(data.conversationId);
      }

      // Update costs
      const tokenCost = (data.usage?.total_tokens || 0) * 0.000001; // Rough estimate
      updateCosts(
        data.usage?.prompt_tokens || 0,
        data.usage?.completion_tokens || 0,
        tokenCost
      );

    } catch (error) {
      console.error('Error sending message:', error);
      
      // Update message with error
      updateMessage(assistantMessageId, {
        content: `❌ Erro: ${error instanceof Error ? error.message : 'Falha na comunicação'}`,
      });
      
      toast({
        variant: "destructive",
        title: "Erro ao enviar mensagem",
        description: error instanceof Error ? error.message : 'Tente novamente em alguns segundos.',
      });
    }

    setStreaming(false);
  };

  // Mock response generator
  const getMockResponse = (input: string, currentAgentId: string) => {
    const responses = {
      cnj: `Análise do processo CNJ solicitado:

**Status:** Ativo - Fase de Instrução
**Comarca:** São Paulo/SP - 2ª Vara do Trabalho
**Reclamante:** João da Silva Santos
**Reclamado:** Empresa XYZ Ltda

**Irregularidades Identificadas:**
• Triangulação confirmada com outros 3 processos
• Testemunha presente em 12 processos similares
• Padrão de troca direta detectado

**Score de Risco:** 85/100 (Alto)

**Recomendações:**
1. Investigar conexões entre testemunhas
2. Verificar histórico do escritório de advocacia
3. Analisar padrões temporais dos depoimentos`,

      risco: `Análise de Padrões de Risco Identificados:

**🚨 ALERTAS CRÍTICOS:**

**Triangulação Suspeita:**
• 15 processos com testemunhas em comum
• Concentração temporal: 80% em 6 meses
• Mesmo escritório de advocacia em 12 casos

**Indicadores de Fraude:**
• Taxa de sucesso anômala: 95% vs média 65%
• Depoimentos padronizados identificados
• Coordenação temporal suspeita

**Testemunhas de Alto Risco:**
1. Maria Santos - 18 processos, sempre polo ativo
2. José Silva - 14 processos, relatos similares
3. Ana Costa - 12 processos, mesma comarca

**Score Geral:** 92/100 (Crítico)`,

      resumo: `Resumo Processual Detalhado:

**VISÃO GERAL:**
Total de processos analisados: 1.247
Período: Jan/2023 - Dez/2023
Comarca: São Paulo/SP

**MÉTRICAS PRINCIPAIS:**
• Taxa de sucesso: 78%
• Valor médio das condenações: R$ 45.380
• Tempo médio de tramitação: 18 meses

**PADRÕES IDENTIFICADOS:**
• Pico de distribuições em março/2023
• Concentração em 3 varas específicas
• Recorrência de 23 testemunhas

**IRREGULARIDADES:**
• 89 casos com triangulação
• 156 casos com troca direta
• 45 casos com prova emprestada`,

      peca: `MINUTA DE CONTESTAÇÃO

**I - DOS FATOS**

Vem aos autos a Requerida, por seus advogados, apresentar CONTESTAÇÃO em face da presente Reclamação Trabalhista, pelas razões de fato e de direito a seguir expostas:

**II - DA TRIANGULAÇÃO DE TESTEMUNHAS**

Conforme análise técnica realizada pelo sistema Hubjuria, restou evidenciado padrão suspeito de triangulação entre as testemunhas arroladas pelo Reclamante.

**Evidências identificadas:**
- Testemunha "João Silva" presente em 15 processos similares
- Depoimentos padronizados com 85% de similaridade
- Coordenação temporal suspeita nos agendamentos

**III - DA IMPROCEDÊNCIA**

Diante das irregularidades identificadas, requer-se a improcedência total dos pedidos.`
    };
    
    return responses[currentAgentId as keyof typeof responses] || responses.cnj;
  };

  return (
    <div className="border-t bg-card/50 backdrop-blur-sm p-4">
      {/* Context info */}
      <div className="mb-3 text-xs text-muted-foreground">
        Shift+Enter para quebra de linha • Cmd/Ctrl+Enter para enviar
      </div>

      <div className="flex gap-3">
        {/* Text Input */}
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Digite sua consulta ou use comandos como /cnj, /testemunha, /risco..."
            className="min-h-[60px] max-h-32 resize-none pr-20"
            disabled={streaming}
          />
          
          {/* Commands popup */}
          {showCommands && (
            <div className="absolute bottom-full left-0 right-0 mb-2 bg-popover border rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
              <div className="p-2">
                <div className="text-xs font-medium text-muted-foreground mb-2">Comandos disponíveis:</div>
                {commands
                  .filter(cmd => cmd.command.includes(input.split(' ').pop()?.slice(1) || ''))
                  .map((cmd) => {
                    const Icon = cmd.icon;
                    return (
                      <div
                        key={cmd.command}
                        className="flex items-center gap-2 p-2 hover:bg-accent rounded cursor-pointer"
                        onClick={() => handleCommandSelect(cmd)}
                      >
                        <Icon className="w-4 h-4" />
                        <div className="flex-1">
                          <div className="font-medium text-sm">{cmd.command}</div>
                          <div className="text-xs text-muted-foreground">{cmd.description}</div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          {/* Attachment button */}
          <Button variant="outline" size="sm" disabled>
            <Paperclip className="w-4 h-4" />
          </Button>

          {/* Prompt improver */}
          <Button 
            variant="outline" 
            size="sm"
            onClick={handlePromptImprove}
            disabled={!input.trim() || showPromptImprover}
          >
            {showPromptImprover ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Wand2 className="w-4 h-4" />
            )}
          </Button>

          {/* Send button */}
          <Button 
            onClick={handleSend}
            disabled={!input.trim() || streaming}
            variant="professional"
            size="sm"
            className="h-[60px]"
          >
            {streaming ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Help text */}
      <div className="mt-2 text-xs text-muted-foreground">
        Digite <Badge variant="outline" className="mx-1">/ajuda</Badge> para ver todos os comandos disponíveis
      </div>
    </div>
  );
}