import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

interface Evidencia {
  tipo?: string;
  descricao: string;
  relevancia?: "alta" | "media" | "baixa";
}

interface Secao {
  titulo: string;
  conteudo: string;
  evidencias?: (string | Evidencia)[];
  metadados?: {
    fonte?: string;
    confiabilidade?: number;
    timestamp?: string;
  };
}

interface AnalysisAccordionProps {
  secoes: Secao[];
  textoOriginal?: string;
}

export function AnalysisAccordion({
  secoes,
  textoOriginal,
}: AnalysisAccordionProps) {
  const getRelevanceBadge = (relevancia?: string) => {
    switch (relevancia) {
      case "alta":
        return (
          <Badge variant="destructive" className="text-xs">
            Alta
          </Badge>
        );
      case "media":
        return (
          <Badge variant="secondary" className="text-xs">
            Média
          </Badge>
        );
      case "baixa":
        return (
          <Badge variant="outline" className="text-xs">
            Baixa
          </Badge>
        );
      default:
        return null;
    }
  };

  // Validação de segurança: garantir que secoes é um array válido
  const secoesValidas = Array.isArray(secoes) ? secoes : [];

  return (
    <div className="space-y-4">
      <Accordion type="multiple" className="w-full">
        {secoesValidas.map((secao, index) => (
          <AccordionItem key={index} value={`secao-${index}`}>
            <AccordionTrigger className="text-left">
              <div className="flex items-center gap-2">
                <span className="font-medium">{secao.titulo}</span>
                {secao.evidencias && secao.evidencias.length > 0 && (
                  <Badge variant="outline" className="text-xs">
                    {secao.evidencias.length} evidência
                    {secao.evidencias.length > 1 ? "s" : ""}
                  </Badge>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 pt-2">
                {/* Conteúdo principal */}
                <div className="prose prose-sm max-w-none">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {secao.conteudo}
                  </p>
                </div>

                {/* Evidências */}
                {secao.evidencias && secao.evidencias.length > 0 && (
                  <div className="space-y-2">
                    <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Evidências
                    </h5>
                    <div className="grid gap-2">
                      {secao.evidencias.map((evidencia, evidenciaIndex) => {
                        if (typeof evidencia === "string") {
                          return (
                            <Card
                              key={evidenciaIndex}
                              className="p-3 bg-muted/30"
                            >
                              <p className="text-sm">{evidencia}</p>
                            </Card>
                          );
                        } else {
                          return (
                            <Card
                              key={evidenciaIndex}
                              className="p-3 bg-muted/30"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1">
                                  {evidencia.tipo && (
                                    <div className="text-xs text-muted-foreground font-medium mb-1">
                                      {evidencia.tipo}
                                    </div>
                                  )}
                                  <p className="text-sm">
                                    {evidencia.descricao}
                                  </p>
                                </div>
                                {evidencia.relevancia &&
                                  getRelevanceBadge(evidencia.relevancia)}
                              </div>
                            </Card>
                          );
                        }
                      })}
                    </div>
                  </div>
                )}

                {/* Metadados */}
                {secao.metadados && (
                  <div className="pt-2 border-t border-muted">
                    <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                      {secao.metadados.fonte && (
                        <span>
                          <strong>Fonte:</strong> {secao.metadados.fonte}
                        </span>
                      )}
                      {secao.metadados.confiabilidade && (
                        <span>
                          <strong>Confiabilidade:</strong>{" "}
                          {Math.round(secao.metadados.confiabilidade * 100)}%
                        </span>
                      )}
                      {secao.metadados.timestamp && (
                        <span>
                          <strong>Processado:</strong>{" "}
                          {new Date(secao.metadados.timestamp).toLocaleString(
                            "pt-BR",
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}

        {/* Texto original como última seção */}
        {textoOriginal && (
          <AccordionItem value="texto-original">
            <AccordionTrigger className="text-left">
              <span className="font-medium">Consulta Original</span>
            </AccordionTrigger>
            <AccordionContent>
              <Card className="p-4 bg-muted/30">
                <pre className="text-sm whitespace-pre-wrap font-mono text-muted-foreground">
                  {textoOriginal}
                </pre>
              </Card>
            </AccordionContent>
          </AccordionItem>
        )}
      </Accordion>
    </div>
  );
}
