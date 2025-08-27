import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useChatStore, QueryKind } from '@/stores/useChatStore';
import { Search, User, Building, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
    addMessage({
      role: 'user',
      content: input.trim()
    });

    // Clear input
    const query = input.trim();
    setInput('');
    setStatus('loading');

    try {
      // Simulate streaming with hints
      const hintInterval = setInterval(() => {
        nextHint();
      }, 800);

      // Mock API call
      setTimeout(() => {
        clearInterval(hintInterval);
        
        // Add mock response with structured blocks
        addMessage({
          role: 'assistant',
          blocks: getMockBlocks(kind, query)
        });
        
        setStatus('success');
        
        toast({
          title: "Análise concluída com sucesso",
          description: "Resultados disponíveis para exportação.",
          className: "border-success/20 text-success"
        });
      }, 3000);

    } catch (error) {
      setStatus('error');
      toast({
        variant: "destructive",
        title: "Erro na análise",
        description: "Não encontramos dados suficientes. Verifique o CNJ ou tente outra entrada."
      });
    }
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