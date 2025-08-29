import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { 
  FileText, 
  Download, 
  Printer, 
  Calendar, 
  Shield, 
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Users,
  Scale,
  Target,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import type { AnalysisResult } from '@/types/mapa-testemunhas-analysis';
import type { ProcessoScore, TestemunhaScore, ScoringMetrics } from '@/types/scoring';
import { RiskBadge } from '@/components/RiskBadge';
import { ScoreDisplay } from '@/components/scoring/ScoreDisplay';
import { BrandHeader } from '@/components/brand/BrandHeader';
import { LGPDFooter } from '@/components/brand/LGPDFooter';
import { ExportActions } from '@/components/brand/ExportActions';
import { ReportSection } from '@/components/templates/ReportSection';
import { CNJCitation } from '@/components/templates/CNJCitation';

export interface ConclusiveReportData {
  // Metadados do relatório
  organizacao: string;
  periodo_analise: {
    inicio: string;
    fim: string;
  };
  analista_responsavel: string;
  data_geracao: string;
  
  // Dados principais
  analysis_result?: AnalysisResult;
  processos_scores: ProcessoScore[];
  testemunhas_scores: TestemunhaScore[];
  scoring_metrics: ScoringMetrics;
  
  // Resumo executivo
  resumo_executivo: {
    total_processos: number;
    processos_criticos: number;
    padroes_detectados: number;
    risco_geral: 'ALTO' | 'MEDIO' | 'BAIXO';
    confiabilidade_analise: number; // 0-100
    observacoes_gerais: string;
  };
  
  // Recomendações estratégicas
  recomendacoes: {
    imediatas: string[];
    curto_prazo: string[];
    longo_prazo: string[];
  };
}

interface ConclusiveReportTemplateProps {
  data: ConclusiveReportData;
  onExport?: (format: 'pdf' | 'csv' | 'docx' | 'json') => void;
}

export function ConclusiveReportTemplate({ 
  data, 
  onExport 
}: ConclusiveReportTemplateProps) {
  const { toast } = useToast();
  
  const handlePrint = () => {
    window.print();
  };
  
  const handleExport = (format: 'pdf' | 'csv' | 'docx' | 'json') => {
    if (onExport) {
      onExport(format);
    } else {
      toast({
        title: "Exportação",
        description: `Gerando relatório em ${format.toUpperCase()}...`,
      });
    }
  };
  
  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'ALTO': return 'destructive';
      case 'MEDIO': return 'secondary';
      case 'BAIXO': return 'outline';
      default: return 'secondary';
    }
  };
  
  const formatDate = (dateStr: string) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateStr));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 print:space-y-4">
      {/* Cabeçalho do Relatório */}
      <Card className="print:shadow-none">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <BrandHeader size="lg" />
              <CardTitle className="text-2xl font-bold flex items-center gap-2 mt-4">
                <FileText className="h-6 w-6 text-primary" />
                Relatório Conclusivo de Análise
              </CardTitle>
              <div className="text-sm text-muted-foreground">
                <p className="font-medium">{data.organizacao}</p>
                <p>Período: {data.periodo_analise.inicio} a {data.periodo_analise.fim}</p>
                <p>Responsável: {data.analista_responsavel}</p>
                <p>Gerado em: {formatDate(data.data_geracao)}</p>
              </div>
            </div>
            
            <div className="print:hidden">
              <ExportActions onExport={handleExport} />
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {data.resumo_executivo.total_processos}
              </div>
              <div className="text-sm text-muted-foreground">Processos Analisados</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-destructive">
                {data.resumo_executivo.processos_criticos}
              </div>
              <div className="text-sm text-muted-foreground">Casos Críticos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-600">
                {data.resumo_executivo.padroes_detectados}
              </div>
              <div className="text-sm text-muted-foreground">Padrões Detectados</div>
            </div>
            <div className="text-center">
              <Badge 
                variant={getRiskColor(data.resumo_executivo.risco_geral)}
                className="text-base px-3 py-1"
              >
                Risco {data.resumo_executivo.risco_geral}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resumo Executivo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Resumo Executivo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Confiabilidade da Análise:</span>
              <Progress 
                value={data.resumo_executivo.confiabilidade_analise} 
                className="w-24 h-2" 
              />
              <span className="text-sm text-muted-foreground">
                {data.resumo_executivo.confiabilidade_analise}%
              </span>
            </div>
          </div>
          
          <div className="prose prose-sm max-w-none">
            <p className="text-muted-foreground leading-relaxed">
              {data.resumo_executivo.observacoes_gerais}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Análise de Padrões */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Análise de Padrões Detectados
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.analysis_result ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">Troca Direta</span>
                </div>
                <div className="text-2xl font-bold text-blue-600">
                  {data.analysis_result.trocaDireta.length}
                </div>
                <div className="text-xs text-muted-foreground">casos detectados</div>
              </div>
              
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-4 w-4 text-orange-600" />
                  <span className="font-medium">Triangulação</span>
                </div>
                <div className="text-2xl font-bold text-orange-600">
                  {data.analysis_result.triangulacao.length}
                </div>
                <div className="text-xs text-muted-foreground">redes identificadas</div>
              </div>
              
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Scale className="h-4 w-4 text-purple-600" />
                  <span className="font-medium">Duplo Papel</span>
                </div>
                <div className="text-2xl font-bold text-purple-600">
                  {data.analysis_result.duploPapel.length}
                </div>
                <div className="text-xs text-muted-foreground">casos identificados</div>
              </div>
              
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-4 w-4 text-red-600" />
                  <span className="font-medium">Prova Emprestada</span>
                </div>
                <div className="text-2xl font-bold text-red-600">
                  {data.analysis_result.provaEmprestada.length}
                </div>
                <div className="text-xs text-muted-foreground">testemunhas suspeitas</div>
              </div>
              
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <span className="font-medium">Homônimos</span>
                </div>
                <div className="text-2xl font-bold text-yellow-600">
                  {data.analysis_result.homonimos.length}
                </div>
                <div className="text-xs text-muted-foreground">casos suspeitos</div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
              <p>Dados de análise de padrões não disponíveis</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Casos Críticos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Casos Críticos (Score ≥ 85)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.processos_scores
              .filter(p => p.score_final >= 85)
              .slice(0, 10) // Mostrar top 10
              .map((processo, index) => (
                <div 
                  key={processo.cnj} 
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="font-mono text-sm font-medium">
                      {processo.cnj}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {processo.classificacao_estrategica}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Badge 
                      variant={processo.score_final >= 85 ? 'destructive' : processo.score_final >= 70 ? 'destructive' : 'secondary'}
                      className="font-mono"
                    >
                      {processo.score_final}
                    </Badge>
                    <Badge variant="destructive" className="text-xs">
                      {processo.prioridade_contradita}
                    </Badge>
                  </div>
                </div>
              ))}
            
            {data.processos_scores.filter(p => p.score_final >= 85).length === 0 && (
              <div className="text-center py-4 text-muted-foreground">
                <CheckCircle className="h-6 w-6 mx-auto mb-2 text-green-600" />
                <p>Nenhum caso crítico identificado</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recomendações Estratégicas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Recomendações Estratégicas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-destructive mb-2 flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Ações Imediatas
              </h4>
              <ul className="space-y-1 text-sm text-muted-foreground ml-6">
                {data.recomendacoes.imediatas.map((rec, index) => (
                  <li key={index} className="list-disc">{rec}</li>
                ))}
              </ul>
            </div>
            
            <Separator />
            
            <div>
              <h4 className="font-medium text-amber-600 mb-2 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Curto Prazo (30-90 dias)
              </h4>
              <ul className="space-y-1 text-sm text-muted-foreground ml-6">
                {data.recomendacoes.curto_prazo.map((rec, index) => (
                  <li key={index} className="list-disc">{rec}</li>
                ))}
              </ul>
            </div>
            
            <Separator />
            
            <div>
              <h4 className="font-medium text-green-600 mb-2 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Longo Prazo (3-12 meses)
              </h4>
              <ul className="space-y-1 text-sm text-muted-foreground ml-6">
                {data.recomendacoes.longo_prazo.map((rec, index) => (
                  <li key={index} className="list-disc">{rec}</li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Métricas de Scoring */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Distribuição de Scores
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center p-3 bg-destructive/10 rounded-lg">
              <div className="text-lg font-bold text-destructive">
                {data.scoring_metrics.distribuicao_scores.critico}
              </div>
              <div className="text-xs text-muted-foreground">Crítico</div>
            </div>
            
            <div className="text-center p-3 bg-destructive/5 rounded-lg">
              <div className="text-lg font-bold text-destructive">
                {data.scoring_metrics.distribuicao_scores.alto}
              </div>
              <div className="text-xs text-muted-foreground">Alto</div>
            </div>
            
            <div className="text-center p-3 bg-yellow-100 rounded-lg">
              <div className="text-lg font-bold text-yellow-700">
                {data.scoring_metrics.distribuicao_scores.medio}
              </div>
              <div className="text-xs text-muted-foreground">Médio</div>
            </div>
            
            <div className="text-center p-3 bg-green-100 rounded-lg">
              <div className="text-lg font-bold text-green-700">
                {data.scoring_metrics.distribuicao_scores.baixo}
              </div>
              <div className="text-xs text-muted-foreground">Baixo</div>
            </div>
            
            <div className="text-center p-3 bg-muted/10 rounded-lg">
              <div className="text-lg font-bold text-muted-foreground">
                {data.scoring_metrics.distribuicao_scores.minimo}
              </div>
              <div className="text-xs text-muted-foreground">Mínimo</div>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-between text-sm">
              <span>Score Médio Geral:</span>
              <span className="font-mono font-medium">
                {Math.round(data.scoring_metrics.avg_score * 10) / 10}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Casos com Contradita Recomendada:</span>
              <span className="font-mono font-medium">
                {data.scoring_metrics.casos_contradita_recomendada}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Casos Necessitando Investigação:</span>
              <span className="font-mono font-medium">
                {data.scoring_metrics.casos_investigacao_necessaria}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rodapé do Relatório */}
      <LGPDFooter 
        organization={data.organizacao}
        showTimestamp={true}
        showVersion={true}
      />
    </div>
  );
}