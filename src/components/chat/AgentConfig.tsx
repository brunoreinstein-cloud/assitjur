import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  FileText, 
  TrendingUp, 
  FileCheck, 
  PenTool,
  Zap,
  Shield,
  Brain
} from 'lucide-react';
import { useChatStore } from '@/stores/useChatStore';

const agentConfigs = {
  cnj: {
    icon: FileText,
    label: 'Análise CNJ',
    persona: 'Especialista em análise processual trabalhista',
    description: 'Analiso processos CNJ identificando irregularidades, triangulações e padrões suspeitos. Especializado em verificação de dados processuais e detecção de fraudes.',
    rules: [
      'Sempre verificar a validade do número CNJ',
      'Identificar padrões de triangulação',
      'Analisar histórico de testemunhas',
      'Verificar consistência temporal dos fatos',
      'Aplicar máscaras PII quando solicitado'
    ],
    outputSchema: {
      processo: {
        cnj: 'string',
        status: 'string',
        irregularidades: 'array',
        scoreRisco: 'number (0-100)',
        recomendacoes: 'array'
      }
    },
    tools: ['retrievePorProcesso', 'redactPII'],
    color: 'bg-blue-500'
  },
  risco: {
    icon: TrendingUp,
    label: 'Padrões de Risco',
    persona: 'Detector de fraudes e irregularidades trabalhistas',
    description: 'Identifico padrões suspeitos, triangulações, trocas diretas e coordenações entre processos. Especializado em análise quantitativa de riscos.',
    rules: [
      'Buscar por triangulações de testemunhas',
      'Identificar trocas diretas suspeitas',
      'Analisar frequência e distribuição temporal',
      'Calcular scores de risco baseados em múltiplos fatores',
      'Priorizar casos com maior potencial de fraude'
    ],
    outputSchema: {
      analise: {
        tipoRisco: 'string',
        scoreGeral: 'number (0-100)',
        evidencias: 'array',
        casosRelacionados: 'array',
        recomendacoes: 'array'
      }
    },
    tools: ['retrievePorTestemunha', 'searchDocs', 'redactPII'],
    color: 'bg-red-500'
  },
  resumo: {
    icon: FileCheck,
    label: 'Resumo Processual',
    persona: 'Sintetizador de informações processuais',
    description: 'Gero resumos executivos, relatórios e sínteses de processos trabalhistas. Especializado em apresentar informações complexas de forma clara e estruturada.',
    rules: [
      'Apresentar informações de forma estruturada',
      'Destacar pontos mais relevantes',
      'Incluir métricas e estatísticas quando possível',
      'Manter linguagem técnica mas acessível',
      'Priorizar achados críticos'
    ],
    outputSchema: {
      resumo: {
        visaoGeral: 'string',
        metricas: 'object',
        principaisAchados: 'array',
        recomendacoes: 'array'
      }
    },
    tools: ['retrievePorProcesso', 'retrievePorTestemunha'],
    color: 'bg-green-500'
  },
  peca: {
    icon: PenTool,
    label: 'Minuta de Peça',
    persona: 'Redator jurídico especializado em Direito do Trabalho',
    description: 'Redijo minutas de peças processuais baseadas em evidências de irregularidades. Especializado em contestações, recursos e alegações finais.',
    rules: [
      'Seguir estrutura formal de peças processuais',
      'Basear argumentos em evidências concretas',
      'Citar fundamentos legais apropriados',
      'Manter linguagem jurídica formal',
      'Incluir referências às irregularidades identificadas'
    ],
    outputSchema: {
      minuta: {
        tipoPeca: 'string',
        estrutura: 'object',
        fundamentacao: 'array',
        pedidos: 'array'
      }
    },
    tools: ['retrievePorProcesso', 'retrievePorTestemunha', 'searchDocs'],
    color: 'bg-purple-500'
  }
};

export function AgentConfig() {
  const { agentId } = useChatStore();
  const config = agentConfigs[agentId as keyof typeof agentConfigs];
  
  if (!config) return null;

  const Icon = config.icon;

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-4">
        {/* Agent Header */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${config.color} text-white`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-lg">{config.label}</CardTitle>
                <p className="text-sm text-muted-foreground">{config.persona}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed">{config.description}</p>
          </CardContent>
        </Card>

        {/* Rules */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="w-4 h-4" />
              Regras de Comportamento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {config.rules.map((rule, index) => (
              <div key={index} className="flex items-start gap-2 text-sm">
                <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                <span>{rule}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Output Schema */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Brain className="w-4 h-4" />
              Esquema de Saída
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
              {JSON.stringify(config.outputSchema, null, 2)}
            </pre>
          </CardContent>
        </Card>

        {/* Tools */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Zap className="w-4 h-4" />
              Ferramentas Disponíveis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {config.tools.map((tool, index) => (
                <Badge key={index} variant="outline" className="mr-2">
                  {tool}
                </Badge>
              ))}
            </div>
            <div className="mt-3 space-y-2 text-xs text-muted-foreground">
              <div><strong>retrievePorProcesso:</strong> Busca dados por CNJ</div>
              <div><strong>retrievePorTestemunha:</strong> Busca dados por nome</div>
              <div><strong>redactPII:</strong> Mascara informações sensíveis</div>
              <div><strong>searchDocs:</strong> Busca em documentos anexados</div>
            </div>
          </CardContent>
        </Card>

        {/* Usage Stats */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Estatísticas de Uso</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Conversas ativas:</span>
              <span className="font-medium">12</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Taxa de sucesso:</span>
              <span className="font-medium">94%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tempo médio:</span>
              <span className="font-medium">2.3s</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Custo médio:</span>
              <span className="font-medium">$0.012</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  );
}