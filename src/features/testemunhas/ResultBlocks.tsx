import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  FileDown, 
  Download, 
  Braces, 
  Copy,
  Sparkles, 
  FileText, 
  AlertTriangle, 
  Target,
  TrendingUp,
  Link,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ExecutiveSummaryCard } from './ExecutiveSummaryCard';
import { AnalysisAccordion } from './AnalysisAccordion';
import { Citations } from './Citations';
import { ResultBlock } from '@/lib/store/mapa-testemunhas';
import { cn } from '@/lib/utils';

interface ResultBlocksProps {
  blocks: ResultBlock[];
}

export function ResultBlocks({ blocks }: ResultBlocksProps) {
  const { toast } = useToast();

  const handleExportPDF = () => {
    window.print();
    toast({
      title: "PDF",
      description: "Abrindo diálogo de impressão...",
    });
  };

  const handleExportCSV = () => {
    // Generate CSV from blocks data
    const csvContent = blocks.map(block => ({
      Tipo: block.title,
      Conteudo: JSON.stringify(block.data)
    }));
    
    const csv = [
      'Tipo,Conteudo',
      ...csvContent.map(row => `"${row.Tipo}","${row.Conteudo}"`)
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `analise-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "CSV exportado",
      description: "Arquivo CSV baixado com sucesso.",
    });
  };

  const handleExportJSON = () => {
    const data = { 
      timestamp: new Date().toISOString(),
      blocks: blocks 
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analise-completa-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "JSON exportado",
      description: "Arquivo JSON baixado com sucesso.",
    });
  };

  if (!blocks || blocks.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Export Actions */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Resultado da Análise</h3>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportPDF}
            className="gap-2"
          >
            <FileDown className="h-4 w-4" />
            PDF
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportJSON}
            className="gap-2"
          >
            <Braces className="h-4 w-4" />
            JSON
          </Button>
        </div>
      </div>

      {/* Result Blocks */}
      <div className="space-y-4">
        {blocks.map((block, index) => {
          switch (block.type) {
            case 'executive':
              return (
                <ExecutiveSummaryCard
                  key={index}
                  cnj={block.data.cnj}
                  reclamante={block.data.reclamante}
                  reu={block.data.reu}
                  status={block.data.status}
                  observacoes={block.data.observacoes}
                  riscoNivel={block.data.riscoNivel}
                  confianca={block.data.confianca}
                  alerta={block.data.alerta}
                  citacoes={block.citations?.map(citation => ({
                    label: citation.ref,
                    onClick: () => {
                      console.log('Citation clicked:', citation);
                    }
                  })) || []}
                />
              );

            case 'details':
              return (
                <Card key={index} className="rounded-2xl border-border/50">
                  <CardHeader>
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      {block.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <AnalysisAccordion
                      secoes={block.data.secoes}
                      textoOriginal={block.data.textoOriginal}
                    />
                    {block.citations && <Citations citations={block.citations} />}
                  </CardContent>
                </Card>
              );

            case 'alerts':
              return (
                <Card key={index} className="rounded-2xl border-destructive/30 bg-destructive/5">
                  <CardHeader>
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                      {block.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Alert className="border-destructive/30 bg-destructive/10">
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                      <AlertDescription className="text-destructive-foreground">
                        <strong>Triangulação Detectada</strong> - Padrões suspeitos identificados entre testemunhas
                      </AlertDescription>
                    </Alert>

                    <Alert className="border-orange-200 bg-orange-50">
                      <AlertTriangle className="h-4 w-4 text-orange-600" />
                      <AlertDescription className="text-orange-800">
                        <strong>Depoimentos Repetidos</strong> - Narrativas similares encontradas
                      </AlertDescription>
                    </Alert>

                    {block.data.suspiciousPatterns?.map((pattern: string, patternIndex: number) => (
                      <div key={patternIndex} className="flex items-center gap-2 p-2 bg-destructive/10 rounded-lg">
                        <AlertTriangle className="h-3 w-3 text-destructive" />
                        <span className="text-sm text-destructive-foreground">{pattern}</span>
                      </div>
                    ))}

                    <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        ⚠️ <strong>Atenção:</strong> Possível coordenação entre depoimentos de testemunhas. 
                        Recomenda-se investigação detalhada dos vínculos identificados.
                      </p>
                    </div>

                    {block.citations && <Citations citations={block.citations} />}
                  </CardContent>
                </Card>
              );

            case 'strategies':
              return (
                <StrategiesBlock key={index} block={block} />
              );

            default:
              return (
                <Card key={index} className="rounded-2xl border-border/50">
                  <CardHeader>
                    <CardTitle className="text-base font-semibold">
                      {block.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {JSON.stringify(block.data, null, 2)}
                    </pre>
                    {block.citations && <Citations citations={block.citations} />}
                  </CardContent>
                </Card>
              );
          }
        })}
      </div>

      {/* Audit Trail */}
      <div className="text-xs text-muted-foreground text-center pt-4 border-t">
        Relatório gerado às {new Date().toLocaleTimeString('pt-BR')} • 
        Dados sujeitos à verificação manual conforme LGPD
      </div>
    </div>
  );
}

interface StrategiesBlockProps {
  block: ResultBlock;
}

function StrategiesBlock({ block }: StrategiesBlockProps) {
  const { toast } = useToast();

  const copyRecommendation = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copiado!",
        description: "Recomendação copiada para a área de transferência.",
      });
    } catch (error) {
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar o conteúdo.",
        variant: "destructive"
      });
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toUpperCase()) {
      case 'ALTA': return 'bg-red-100 text-red-800 border-red-200';
      case 'MÉDIA': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'BAIXA': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Card className="rounded-2xl border-emerald-200 bg-emerald-50/50">
      <CardHeader>
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Target className="h-4 w-4 text-emerald-600" />
          {block.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Estratégias Ativas */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <h4 className="font-medium text-emerald-800">Estratégias Ativas</h4>
              <Badge variant="secondary" className="text-xs">Polo Ativo</Badge>
            </div>
          
          {block.data.estrategias?.map((estrategia: any, index: number) => (
            <div key={index} className="flex items-center justify-between p-3 bg-white/70 rounded-lg border">
              <div className="flex items-center gap-3">
                <Badge className={cn('text-xs', getPriorityColor(estrategia.prioridade))}>
                  {estrategia.prioridade}
                </Badge>
                <span className="text-sm">{estrategia.texto}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyRecommendation(estrategia.texto)}
                className="h-8 w-8 p-0 shrink-0"
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>

        {/* Ações Defensivas (se houver) */}
        {block.data.acoesDefensivas && (
          <div className="space-y-3">
            <h4 className="font-medium text-emerald-800">Ações Defensivas</h4>
            {block.data.acoesDefensivas.map((acao: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-3 bg-white/70 rounded-lg border">
                <div className="flex items-center gap-3">
                  <Badge className={cn('text-xs', getPriorityColor(acao.prioridade))}>
                    {acao.prioridade}
                  </Badge>
                  <span className="text-sm">{acao.texto}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyRecommendation(acao.texto)}
                  className="h-8 w-8 p-0 shrink-0"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Próximos Passos */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-emerald-600" />
            <h4 className="font-medium text-emerald-800">Próximos Passos</h4>
          </div>
          
          {block.data.proximosPassos?.map((passo: string, index: number) => (
            <div key={index} className="flex items-center justify-between p-3 bg-white/70 rounded-lg border">
              <span className="text-sm">{passo}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyRecommendation(passo)}
                className="h-8 w-8 p-0 shrink-0"
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>

        {block.citations && <Citations citations={block.citations} />}
      </CardContent>
    </Card>
  );
}