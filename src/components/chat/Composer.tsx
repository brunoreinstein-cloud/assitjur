import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useChatStore, QueryKind } from '@/stores/useChatStore';
import { Search, User, Building, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const QUERY_CHIPS = [
  { kind: 'processo' as QueryKind, label: '🔎 Por Processo', icon: Search },
  { kind: 'testemunha' as QueryKind, label: '👤 Por Testemunha', icon: User },
  { kind: 'reclamante' as QueryKind, label: '🏛 Por Reclamante', icon: Building },
];

// CNJ Regex: 0000000-00.0000.0.00.0000
const CNJ_REGEX = /\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}/;

export function Composer() {
  const { 
    kind, input, status, agentOnline,
    setKind, setInput, addMessage, setStatus, nextHint
  } = useChatStore();
  const { toast } = useToast();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [rows, setRows] = useState(1);

  // Auto-detect CNJ and adjust kind
  useEffect(() => {
    if (CNJ_REGEX.test(input) && kind !== 'processo') {
      setKind('processo');
    }
  }, [input, kind, setKind]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      const lineHeight = 24;
      const lines = input.split('\n').length;
      const newRows = Math.min(Math.max(lines, 1), 4);
      setRows(newRows);
    }
  }, [input]);

  const handleSubmit = async () => {
    if (!input.trim()) {
      toast({
        variant: "destructive",
        title: "Campo obrigatório",
        description: "Digite o nome da testemunha, número CNJ ou reclamante para continuar."
      });
      return;
    }

    if (!agentOnline) {
      toast({
        variant: "destructive", 
        title: "Agente indisponível",
        description: "O sistema está em manutenção. Tente novamente em alguns minutos."
      });
      return;
    }

    // Add user message
    const userMessageId = addMessage({
      role: 'user',
      content: input.trim()
    });

    // Clear input
    const query = input.trim();
    setInput('');
    setStatus('loading');

    // Add assistant message for streaming
    const assistantMessageId = addMessage({
      role: 'assistant',
      blocks: []
    });

    // Start hint rotation
    const hintInterval = setInterval(() => {
      nextHint();
    }, 1500);

    try {
      console.log(`[Chat] Starting analysis for query: "${query}" (type: ${getQueryType(kind)})`);
      
      // Call Supabase Edge Function with timeout
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 30000)
      );

      const callPromise = supabase.functions.invoke('chat-legal', {
        body: {
          message: query,
          queryType: getQueryType(kind),
          kind: kind,
          options: useChatStore.getState().defaults
        }
      });

      const { data, error } = await Promise.race([callPromise, timeoutPromise]) as any;

      console.log('[Chat] Edge function response:', { data, error });

      if (error) {
        throw new Error(`Edge function error: ${error.message}`);
      }

      if (!data?.message) {
        throw new Error('Invalid response from edge function');
      }

      // Generate structured response blocks based on kind
      const blocks = generateMockBlocks(kind, query, data.message);

      // Update assistant message with final blocks
      useChatStore.getState().updateMessage(assistantMessageId, {
        blocks: blocks
      });

      console.log('[Chat] Analysis completed successfully');

    } catch (apiError) {
      console.error('[Chat] API Error:', apiError);
      
      // Stop hint rotation on error
      clearInterval(hintInterval);
      setStatus('error');
      
      // Remove the assistant message with loading state
      useChatStore.getState().updateMessage(assistantMessageId, {
        blocks: []
      });
      
      toast({
        variant: "destructive",
        title: "Erro na análise",
        description: apiError.message.includes('timeout') 
          ? "A análise está demorando mais que o esperado. Tente novamente."
          : `Falha na comunicação com o sistema: ${apiError.message}`,
      });
      
      return; // Exit early on error
    }

    // Stop hint rotation
    clearInterval(hintInterval);
    setStatus('success');
    
    toast({
      title: "Análise concluída com sucesso",
      description: "Resultados disponíveis para exportação.",
      className: "border-success/20 text-success"
    });
  };

  const getQueryType = (kind: string): string => {
    switch (kind) {
      case 'processo':
        return 'risk_analysis';
      case 'testemunha':
        return 'pattern_analysis';
      case 'reclamante':
        return 'risk_analysis';
      default:
        return 'general';
    }
  };

  const generateMockBlocks = (kind: string, query: string, aiResponse: string) => {
    const isCNJ = /\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}/.test(query);
    
    const baseBlocks: any[] = [
      {
        type: 'executive',
        title: 'Resumo Executivo',
        icon: 'Pin',
        data: {
          cnj: isCNJ ? query : '1000000-00.2023.5.02.0001',
          reclamante: 'Maria Silva Santos',
          reu: 'Empresa XYZ Ltda',
          status: 'Em andamento',
          observacoes: 'Processo com alta complexidade probatória',
          riscoNivel: 'alto' as const,
          confianca: 0.89,
          alerta: 'Requer atenção especial - padrão de triangulação detectado'
        },
        citations: [
          {
            source: kind === 'processo' ? 'por_processo' : 'por_testemunha',
            ref: isCNJ ? `CNJ:${query}` : `Testemunha:${query}`
          }
        ]
      },
      {
        type: 'details',
        title: 'Análise Detalhada',  
        icon: 'search',
        data: {
          secoes: {
            identificacao: `## Dados do Processo

**CNJ:** ${isCNJ ? query : '1000000-00.2023.5.02.0001'}
**Reclamante:** Maria Silva Santos
**Réu:** Empresa XYZ Ltda

O processo em análise apresenta características típicas de ações trabalhistas com alta complexidade probatória. A identificação inicial revela um volume significativo de testemunhas cadastradas.`,
            riscosPadroes: `## Padrões de Risco Identificados

### Triangulação de Testemunhas
- **3 testemunhas** aparecem em múltiplos processos
- **Padrão temporal** suspeito nas contratações
- **Endereços próximos** entre testemunhas

### Indicadores de Risco
- Depoimentos com **similaridade textual** acima de 85%
- Cronologia de eventos **idêntica** entre testemunhas
- Vínculos profissionais **não declarados**

### Análise de Credibilidade
Os dados sugerem coordenação prévia entre as testemunhas, comprometendo a confiabilidade dos depoimentos.`,
            tendencias: `## Tendências Identificadas

### Padrões Temporais
- **Pico de contratações** 30 dias antes do desligamento
- **Concentração de testemunhas** no mesmo período
- **Rotatividade anômala** no setor

### Análise Comparativa
Comparando com processos similares da mesma empresa:
- **40% mais testemunhas** que a média
- **Padrão de argumentação** repetitivo
- **Evidências documentais** limitadas

### Projeções
A tendência atual sugere **alto risco** de questionamento judicial sobre a validade probatória.`,
            consideracoes: `## Considerações Finais

### Recomendações Estratégicas
1. **Arguição de suspeição** das testemunhas identificadas
2. **Análise aprofundada** dos vínculos entre testemunhas
3. **Coleta de evidências** sobre coordenação prévia

### Próximos Passos
- Solicitar documentos comprobatórios dos vínculos
- Investigar histórico profissional das testemunhas
- Preparar questionário específico para audiência

### Impacto no Processo
O **padrão de triangulação** identificado pode ser determinante para o resultado do processo, recomendando-se ação jurídica imediata.`
          },
          textoOriginal: `# Análise Completa do Processo ${isCNJ ? query : '1000000-00.2023.5.02.0001'}

## Resumo Executivo
A análise das testemunhas do processo revela um padrão de triangulação preocupante. Foram identificadas 3 testemunhas com histórico compartilhado em outros processos.

## Dados do Processo
**CNJ:** ${isCNJ ? query : '1000000-00.2023.5.02.0001'}
**Reclamante:** Maria Silva Santos  
**Réu:** Empresa XYZ Ltda

### Padrões de Risco Identificados
- Triangulação de testemunhas
- Depoimentos similares
- Cronologia suspeita

### Tendências
- Pico de contratações anômalo
- Rotatividade concentrada
- Evidências limitadas

### Considerações Finais
Recomenda-se arguição de suspeição e análise aprofundada dos vínculos identificados.`
        },
        citations: [
          { source: 'por_processo', ref: 'CNJ:0000123-45.2023.5.02.0001' },
          { source: 'por_testemunha', ref: 'Testemunha:Maria Silva Santos' }
        ]
      }
    ];

    // Add specific blocks based on kind
    if (kind === 'processo') {
      baseBlocks.push({
        type: 'alerts',
        title: 'Alertas Probatórios',
        icon: 'AlertTriangle',
        data: {
          risks: [
            { level: 'alto', message: 'Triangulação confirmada entre 3 testemunhas', severity: 'critical' },
            { level: 'médio', message: 'Testemunha comum em processos similares', severity: 'warning' }
          ],
          triangulations: 2,
          directExchanges: 1,
          suspiciousPatterns: [
            'Testemunhas com endereços próximos',
            'Depoimentos idênticos ou muito similares',
            'Cronologia de contratações suspeita'
          ]
        },
        citations: [
          { source: 'por_processo', ref: isCNJ ? `CNJ:${query}` : 'CNJ:0000456-78.2023.5.02.0002' }
        ]
      });
    }

    baseBlocks.push({
      type: 'strategies',
      title: 'Polo Ativo & Estratégias',
      icon: 'Target',
      data: {
        activeStrategies: [
          'Questionar credibilidade da testemunha devido ao histórico',
          'Explorar contradições entre depoimentos',
          'Solicitar oitiva de testemunhas referenciadas'
        ],
        defensiveActions: [
          'Preparar contraprova documental',
          'Identificar testemunhas de defesa'
        ]
      },
      citations: [
        { source: 'por_testemunha', ref: 'Testemunha:João Costa Lima' }
      ]
    });

    return baseBlocks;
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Focus input with "/" key
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes((e.target as Element).tagName)) {
        e.preventDefault();
        textareaRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, []);

  return (
    <div className="space-y-4">
      {/* Query Type Chips */}
      <div className="flex flex-wrap gap-2">
        {QUERY_CHIPS.map((chip) => (
          <Button
            key={chip.kind}
            variant={kind === chip.kind ? "default" : "outline"}
            size="sm"
            onClick={() => setKind(chip.kind)}
            className="flex items-center gap-1.5"
          >
            <chip.icon className="h-3 w-3" />
            {chip.label}
          </Button>
        ))}
      </div>

      {/* Input Area */}
      <div className="space-y-3">
        <div className="relative">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Digite o nome da testemunha, número CNJ ou reclamante…"
            className="min-h-[60px] resize-none pr-20"
            rows={rows}
            disabled={status === 'loading'}
          />
          
          {/* Auto-detect indicator */}
          {CNJ_REGEX.test(input) && (
            <Badge 
              variant="secondary" 
              className="absolute top-2 right-16 text-xs bg-primary/10 text-primary"
            >
              CNJ detectado
            </Badge>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex justify-between items-center">
          <div className="text-xs text-muted-foreground">
            <kbd className="px-1.5 py-0.5 text-xs font-mono bg-muted rounded">Ctrl</kbd> + 
            <kbd className="px-1.5 py-0.5 text-xs font-mono bg-muted rounded ml-1">Enter</kbd> para executar • 
            <kbd className="px-1.5 py-0.5 text-xs font-mono bg-muted rounded ml-1">/</kbd> para focar
          </div>
          
          <Button 
            onClick={handleSubmit}
            disabled={status === 'loading' || !input.trim() || !agentOnline}
            className="bg-violet-600 hover:bg-violet-700 text-white"
          >
            {status === 'loading' ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Analisando...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                Executar Análise
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Mock data generator
function getMockBlocks(kind: QueryKind, query: string) {
  const blocks = [
    {
      type: 'executive' as const,
      title: 'Resumo Executivo',
      icon: '📌',
      data: {
        summary: `Análise concluída para ${kind === 'processo' ? 'processo' : kind === 'testemunha' ? 'testemunha' : 'reclamante'} "${query}". Identificados padrões de risco e irregularidades que requerem atenção especial da defesa.`,
        riskLevel: 'ALTO',
        confidence: 92
      },
      citations: [
        { source: 'por_processo' as const, ref: 'CNJ:0001234-56.2023.5.02.0001' },
        { source: 'por_testemunha' as const, ref: 'Testemunha:João Silva' }
      ]
    },
    {
      type: 'details' as const,
      title: 'Análise Detalhada',
      icon: '📋',
      data: {
        connections: 15,
        processes: 8,
        commonPatterns: ['Mesma comarca', 'Mesmo advogado', 'Valores similares'],
        timeline: '2022-2024'
      },
      citations: [
        { source: 'por_processo' as const, ref: 'CNJ:0007890-12.2023.5.02.0002' }
      ]
    },
    {
      type: 'alerts' as const,
      title: 'Alertas Probatórios',
      icon: '⚠️',
      data: {
        triangulation: true,
        repeatedTestimony: true,
        suspiciousPatterns: ['Depoimentos idênticos', 'Troca de advogados', 'Polo ativo recorrente']
      },
      citations: [
        { source: 'por_testemunha' as const, ref: 'Testemunha:Maria Santos' }
      ]
    },
    {
      type: 'strategies' as const,
      title: 'Polo Ativo & Estratégias',
      icon: '🎯',
      data: {
        recommendations: [
          'Contestar credibilidade das testemunhas',
          'Arguir suspeição por interesse',
          'Solicitar juntada de processos similares'
        ],
        priority: 'ALTA'
      }
    }
  ];

  return blocks;
}