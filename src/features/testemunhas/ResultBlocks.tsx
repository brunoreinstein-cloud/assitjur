import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  FileDown,
  Download,
  Braces,
  Copy,
  FileText,
  AlertTriangle,
  Target,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ExecutiveSummaryCard } from "@/features/testemunhas/ExecutiveSummaryCard";
import { AnalysisAccordion } from "@/features/testemunhas/AnalysisAccordion";
import { Citations } from "@/features/testemunhas/Citations";
import { ResultBlock } from "@/lib/store/mapa-testemunhas";
import { ExportActions } from "@/components/brand/ExportActions";
import { cn } from "@/lib/utils";

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
    const csvContent = blocks.map((block) => ({
      Tipo: block.title,
      Conteudo: JSON.stringify(block.data),
    }));

    const csv = [
      "Tipo,Conteudo",
      ...csvContent.map((row) => `"${row.Tipo}","${row.Conteudo}"`),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `analise-${Date.now()}.csv`);
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
      blocks: blocks,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
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
        <h3 className="text-lg font-semibold text-brand-ink">
          Resultado da Análise
        </h3>
        <ExportActions
          onExport={(format) => {
            switch (format) {
              case "pdf":
                handleExportPDF();
                break;
              case "csv":
                handleExportCSV();
                break;
              case "json":
                handleExportJSON();
                break;
            }
          }}
          showPrint={true}
        />
      </div>

      {/* Result Blocks */}
      <div className="space-y-4">
        {blocks.map((block, index) => {
          switch (block.type) {
            case "executive":
              return (
                <ExecutiveSummaryCard
                  key={index}
                  cnj={
                    block.data?.cnj ||
                    block.data?.processo ||
                    (block.context?.type === "testemunha" ? "N/A" : "N/A")
                  }
                  reclamante={
                    block.data?.reclamante ||
                    block.context?.data?.nome ||
                    block.data?.reclamada ||
                    "Não informado"
                  }
                  reu={
                    block.data?.reu ||
                    block.data?.reclamada ||
                    (block.context?.type === "testemunha"
                      ? "N/A"
                      : "Não informado")
                  }
                  status={
                    block.data?.status ||
                    block.meta?.status ||
                    block.context?.meta?.status ||
                    "Não informado"
                  }
                  observacoes={
                    block.data?.observacoes ||
                    block.meta?.observacoes ||
                    "Análise contextual em progresso"
                  }
                  riscoNivel={
                    (block.data?.riscoNivel ||
                      block.meta?.riscoNivel ||
                      block.context?.meta?.riscoNivel ||
                      "baixo") as "baixo" | "medio" | "alto" | "critico"
                  }
                  confianca={
                    typeof block.data?.confianca === "number"
                      ? block.data.confianca
                      : typeof block.meta?.confidence === "number"
                        ? Math.round(block.meta.confidence * 100)
                        : typeof block.context?.meta?.confidence === "number"
                          ? Math.round(block.context.meta.confidence * 100)
                          : typeof block.data?.score === "number"
                            ? block.data.score
                            : 0
                  }
                  alerta={block.data?.alerta}
                  citacoes={
                    block.citations?.map((citation) => ({
                      label: citation.ref,
                      onClick: () => {
                        console.log("Citation clicked:", citation);
                      },
                    })) || []
                  }
                />
              );

            case "details":
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
                    {block.citations && (
                      <Citations citations={block.citations} />
                    )}
                  </CardContent>
                </Card>
              );

            case "alerts":
              return (
                <Card
                  key={index}
                  className="rounded-2xl border-status-critical/30 bg-status-critical/5"
                >
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
                        <strong>Triangulação Detectada</strong> - Padrões
                        suspeitos identificados entre testemunhas
                      </AlertDescription>
                    </Alert>

                    <Alert className="border-status-warning/30 bg-status-warning/10">
                      <AlertTriangle className="h-4 w-4 text-status-warning" />
                      <AlertDescription className="text-status-warning">
                        <strong>Depoimentos Repetidos</strong> - Narrativas
                        similares encontradas
                      </AlertDescription>
                    </Alert>

                    {block.data.suspiciousPatterns?.map(
                      (pattern: string, patternIndex: number) => (
                        <div
                          key={patternIndex}
                          className="flex items-center gap-2 p-2 bg-destructive/10 rounded-lg"
                        >
                          <AlertTriangle className="h-3 w-3 text-destructive" />
                          <span className="text-sm text-destructive-foreground">
                            {pattern}
                          </span>
                        </div>
                      ),
                    )}

                    <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        ⚠️ <strong>Atenção:</strong> Possível coordenação entre
                        depoimentos de testemunhas. Recomenda-se investigação
                        detalhada dos vínculos identificados.
                      </p>
                    </div>

                    {block.citations && (
                      <Citations citations={block.citations} />
                    )}
                  </CardContent>
                </Card>
              );

            case "strategies":
              return <StrategiesBlock key={index} block={block} />;

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
                    {block.citations && (
                      <Citations citations={block.citations} />
                    )}
                  </CardContent>
                </Card>
              );
          }
        })}
      </div>

      {/* Audit Trail */}
      <div className="text-xs text-muted-foreground text-center pt-4 border-t">
        Relatório gerado às {new Date().toLocaleTimeString("pt-BR")} • Dados
        sujeitos à verificação manual conforme LGPD
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
        variant: "destructive",
      });
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toUpperCase()) {
      case "ALTA":
        return "bg-status-critical/15 text-status-critical border-status-critical/30";
      case "MÉDIA":
        return "bg-status-warning/15 text-status-warning border-status-warning/30";
      case "BAIXA":
        return "bg-status-success/15 text-status-success border-status-success/30";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  return (
    <Card className="rounded-2xl border-status-success/30 bg-status-success/10">
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
            <Badge variant="secondary" className="text-xs">
              Polo Ativo
            </Badge>
          </div>

          {block.data.estrategias?.map((estrategia: any, index: number) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-white/70 rounded-lg border"
            >
              <div className="flex items-center gap-3">
                <Badge
                  className={cn(
                    "text-xs",
                    getPriorityColor(estrategia.prioridade),
                  )}
                >
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
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-white/70 rounded-lg border"
              >
                <div className="flex items-center gap-3">
                  <Badge
                    className={cn("text-xs", getPriorityColor(acao.prioridade))}
                  >
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
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-white/70 rounded-lg border"
            >
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
