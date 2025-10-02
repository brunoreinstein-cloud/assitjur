import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { RiskBadge } from '@/components/RiskBadge';
import { KeyValue } from '@/features/testemunhas/KeyValue';
import { Sparkles, Copy, FileDown, Braces, TrendingUp, Link, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface CitationItem {
  label: string;
  href?: string;
  onClick?: () => void;
}

interface ExecutiveSummaryCardProps {
  cnj: string;
  reclamante: string;
  reu: string;
  status?: string;
  observacoes?: string;
  riscoNivel: "alto" | "medio" | "baixo";
  confianca: number; // 0..1
  alerta?: string;
  citacoes: CitationItem[];
}

export function ExecutiveSummaryCard({
  cnj,
  reclamante,
  reu,
  status = "Não informado",
  observacoes = "Sem observações registradas",
  riscoNivel,
  confianca,
  alerta,
  citacoes
}: ExecutiveSummaryCardProps) {
  // Debug log para validar props recebidas
  console.log('📊 [ExecutiveSummaryCard] Props recebidas:', {
    cnj,
    status,
    observacoes,
    riscoNivel,
    confianca: typeof confianca === 'number' ? `${confianca}%` : confianca,
    hasObservacoes: !!observacoes && observacoes !== 'Sem observações registradas',
    hasStatus: !!status && status !== 'Não informado',
    isDefaultData: status === 'Não informado' && observacoes === 'Sem observações registradas'
  });
  
  const { toast } = useToast();
  const [showAllCitations, setShowAllCitations] = useState(false);
  
  // Validar e normalizar confiança para evitar NaN
  const confiancaValida = typeof confianca === 'number' && !isNaN(confianca) && isFinite(confianca) 
    ? Math.max(0, Math.min(1, confianca)) 
    : 0;
  const confiancaPct = Math.round(confiancaValida * 100);
  
  const maxVisibleCitations = 3;
  const hasMoreCitations = citacoes.length > maxVisibleCitations;
  const visibleCitations = showAllCitations ? citacoes : citacoes.slice(0, maxVisibleCitations);
  const hiddenCount = citacoes.length - maxVisibleCitations;

  const handleCopy = async () => {
    const text = `Resumo Executivo - ${cnj}

Reclamante: ${reclamante}
Réu: ${reu}
Status: ${status}
Observações: ${observacoes}

Risco: ${riscoNivel.toUpperCase()}
Confiança: ${confiancaPct}%
${alerta ? `Alerta: ${alerta}` : ''}

Citações:
${citacoes.map(c => `• ${c.label}`).join('\n')}`;

    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copiado!",
        description: "Resumo executivo copiado para a área de transferência.",
      });
    } catch (error) {
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar o conteúdo.",
        variant: "destructive"
      });
    }
  };

  const handleExportPDF = () => {
    window.print();
    toast({
      title: "PDF",
      description: "Abrindo diálogo de impressão...",
    });
  };

  const handleExportJSON = () => {
    const data = {
      cnj,
      reclamante,
      reu,
      status,
      observacoes,
      riscoNivel,
      confianca,
      alerta,
      citacoes
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `resumo-executivo-${cnj.replace(/[^\w]/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "JSON exportado",
      description: "Arquivo JSON baixado com sucesso.",
    });
  };

  return (
    <Card className="rounded-2xl border-border/50 transition-shadow hover:shadow-sm" aria-labelledby="executive-summary">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle id="executive-summary" className="text-base font-semibold flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-violet-600" aria-hidden="true" />
            Resumo Executivo
          </CardTitle>
          
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="h-8 w-8 p-0"
              aria-label="Copiar resumo"
            >
              <Copy className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleExportPDF}
              className="h-8 w-8 p-0"
              aria-label="Exportar PDF"
            >
              <FileDown className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleExportJSON}
              className="h-8 w-8 p-0"
              aria-label="Exportar JSON"
            >
              <Braces className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0 space-y-5">
        {/* Key Facts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <KeyValue label="Reclamante" value={reclamante} type="reclamante" />
          <KeyValue label="Réu" value={reu} type="reu" />
          <KeyValue label="Status" value={status} type="status" />
          <KeyValue label="Observações" value={observacoes} type="observacoes" />
        </div>

        {/* Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Nível de Risco</span>
              <RiskBadge riscoNivel={riscoNivel} />
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Confiança</span>
              <div className="flex items-center gap-2">
                <Progress value={confiancaPct} className="w-16 h-2" />
                <span className="text-sm text-muted-foreground">{confiancaPct}%</span>
              </div>
            </div>
          </div>

          {alerta && (
            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg" aria-live="polite">
              <TrendingUp className="h-4 w-4 text-violet-600" aria-hidden="true" />
              <span className="text-sm font-medium">{alerta}</span>
            </div>
          )}
        </div>

        {/* Citations */}
        {citacoes.length > 0 && (
          <div className="pt-3 border-t">
            <div className="flex items-center gap-2 mb-2">
              <Link className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
              <span className="text-xs font-medium text-muted-foreground">Citações:</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {visibleCitations.map((citation, index) => (
                <Badge 
                  key={index} 
                  variant="secondary"
                  className={cn(
                    "text-xs flex items-center gap-1 cursor-pointer hover:bg-secondary/80",
                    citation.href && "underline"
                  )}
                  onClick={citation.onClick || (() => citation.href && window.open(citation.href, '_blank'))}
                >
                  <Link className="h-3 w-3" aria-hidden="true" />
                  {citation.label}
                </Badge>
              ))}
              
              {hasMoreCitations && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAllCitations(!showAllCitations)}
                  className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                >
                  {showAllCitations ? (
                    <>
                      <ChevronUp className="h-3 w-3 mr-1" />
                      Menos
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-3 w-3 mr-1" />
                      +{hiddenCount}
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}