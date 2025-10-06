import { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Eye, AlertCircle, Users, Scale } from "lucide-react";
import { useImportStore } from "@/features/importer/store/useImportStore";

export function PreviewStep() {
  const { validationResult, setCurrentStep } = useImportStore();
  const [activeTab, setActiveTab] = useState("processos");

  const previewData = useMemo(() => {
    if (!validationResult?.normalizedData)
      return { processos: [], testemunhas: [] };

    const processos = Array.isArray(validationResult.normalizedData.processos)
      ? validationResult.normalizedData.processos
      : [];
    const testemunhas = Array.isArray(
      validationResult.normalizedData.testemunhas,
    )
      ? validationResult.normalizedData.testemunhas
      : [];

    return {
      processos: processos.slice(0, 10),
      testemunhas: testemunhas.slice(0, 10),
    };
  }, [validationResult]);

  const stats = useMemo(() => {
    if (!validationResult?.normalizedData)
      return { processos: 0, testemunhas: 0 };

    const processos = Array.isArray(validationResult.normalizedData.processos)
      ? validationResult.normalizedData.processos
      : [];
    const testemunhas = Array.isArray(
      validationResult.normalizedData.testemunhas,
    )
      ? validationResult.normalizedData.testemunhas
      : [];

    return {
      processos: processos.length,
      testemunhas: testemunhas.length,
    };
  }, [validationResult]);

  if (!validationResult || !validationResult.normalizedData) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground mb-4">
            Nenhum dado de validação disponível
          </p>
          <Button
            onClick={() => setCurrentStep("validation")}
            variant="outline"
          >
            Voltar para Validação
          </Button>
        </CardContent>
      </Card>
    );
  }

  const hasValidData = stats.processos > 0 || stats.testemunhas > 0;

  if (!hasValidData) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-warning" />
          <p className="text-lg font-medium mb-2">
            Nenhum dado válido encontrado
          </p>
          <p className="text-muted-foreground mb-4">
            Não foi possível processar dados válidos do arquivo enviado.
          </p>
          <Button onClick={() => setCurrentStep("upload")} variant="outline">
            Enviar Novo Arquivo
          </Button>
        </CardContent>
      </Card>
    );
  }

  const { summary } = validationResult;

  return (
    <div className="space-y-6">
      {/* Preview Summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="text-center p-4">
          <div className="text-2xl font-bold">
            {summary.valid.toLocaleString()}
          </div>
          <div className="text-sm text-muted-foreground">Registros válidos</div>
        </Card>
        <Card className="text-center p-4">
          <div className="text-2xl font-bold">
            {summary.analyzed > 0
              ? Math.round((summary.valid / summary.analyzed) * 100)
              : 0}
            %
          </div>
          <div className="text-sm text-muted-foreground">Taxa de sucesso</div>
        </Card>
        <Card className="text-center p-4">
          <div className="text-2xl font-bold">
            {summary.errors + summary.warnings}
          </div>
          <div className="text-sm text-muted-foreground">
            Problemas detectados
          </div>
        </Card>
      </div>

      {/* Import Summary Alert */}
      <Alert className="border-primary bg-primary/5">
        <Eye className="h-4 w-4 text-primary" />
        <AlertDescription className="text-primary">
          <strong>Prévia da Importação:</strong> {summary.valid} registros serão
          processados e inseridos na base de dados. Os dados passarão por
          validação final e normalização antes da inserção.
        </AlertDescription>
      </Alert>

      {/* Data Preview Tabs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Prévia dos Dados
          </CardTitle>
          <CardDescription>
            Amostra dos dados processados e normalizados (primeiros 10
            registros)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger
                value="processos"
                className="flex items-center gap-2"
              >
                <Scale className="h-4 w-4" />
                Por Processo ({stats.processos})
              </TabsTrigger>
              <TabsTrigger
                value="testemunhas"
                className="flex items-center gap-2"
              >
                <Users className="h-4 w-4" />
                Por Testemunha ({stats.testemunhas})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="processos" className="mt-6">
              {previewData.processos.length > 0 ? (
                <div className="border rounded-lg overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>CNJ</TableHead>
                        <TableHead>Reclamante</TableHead>
                        <TableHead>Réu</TableHead>
                        <TableHead>Comarca</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Flags</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {previewData.processos.map(
                        (processo: any, index: number) => {
                          // Mascaramento seguro de CNJ
                          let cnjMasked = "N/A";
                          if (
                            processo.cnj_digits &&
                            String(processo.cnj_digits).length >= 8
                          ) {
                            const digits = String(processo.cnj_digits);
                            cnjMasked = `****-**.${digits.slice(-8, -4)}.*.**.****`;
                          } else if (processo.cnj) {
                            const cnj = String(processo.cnj);
                            cnjMasked =
                              cnj.length > 8 ? `****${cnj.slice(-8)}` : cnj;
                          }

                          return (
                            <TableRow key={index}>
                              <TableCell className="font-mono text-sm">
                                {cnjMasked}
                              </TableCell>
                              <TableCell>
                                {processo.reclamante_nome
                                  ? processo.reclamante_nome.length > 25
                                    ? processo.reclamante_nome.substring(
                                        0,
                                        25,
                                      ) + "..."
                                    : processo.reclamante_nome
                                  : "N/A"}
                              </TableCell>
                              <TableCell>
                                {processo.reu_nome
                                  ? processo.reu_nome.length > 25
                                    ? processo.reu_nome.substring(0, 25) + "..."
                                    : processo.reu_nome
                                  : "N/A"}
                              </TableCell>
                              <TableCell>{processo.comarca || "N/A"}</TableCell>
                              <TableCell>
                                <Badge variant="secondary">
                                  Pronto para importar
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-1 flex-wrap">
                                  {processo.triangulacao_confirmada && (
                                    <Badge
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      Triangulação
                                    </Badge>
                                  )}
                                  {processo.troca_direta && (
                                    <Badge
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      Troca Direta
                                    </Badge>
                                  )}
                                  {processo.prova_emprestada && (
                                    <Badge
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      Prova Emprestada
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        },
                      )}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Nenhum processo válido encontrado para prévia.
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>

            <TabsContent value="testemunhas" className="mt-6">
              {previewData.testemunhas.length > 0 ? (
                <div className="border rounded-lg overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome da Testemunha</TableHead>
                        <TableHead>Qtd. Depoimentos</TableHead>
                        <TableHead>CNJs como Testemunha</TableHead>
                        <TableHead>Reclamante</TableHead>
                        <TableHead>Flags</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {previewData.testemunhas.map(
                        (testemunha: any, index: number) => {
                          // Conversão segura de qtd_depoimentos
                          const qtdDepoimentos =
                            typeof testemunha.qtd_depoimentos === "number"
                              ? testemunha.qtd_depoimentos
                              : parseInt(
                                  String(testemunha.qtd_depoimentos || "0"),
                                  10,
                                ) || 0;

                          // Processamento seguro de CNJs
                          let cnjsInfo = "N/A";
                          if (testemunha.cnjs_como_testemunha) {
                            if (
                              Array.isArray(testemunha.cnjs_como_testemunha)
                            ) {
                              cnjsInfo = `${testemunha.cnjs_como_testemunha.length} CNJs`;
                            } else {
                              cnjsInfo = "1 CNJ";
                            }
                          }

                          return (
                            <TableRow key={index}>
                              <TableCell className="font-medium">
                                {testemunha.nome_testemunha ||
                                  testemunha.nome_civil ||
                                  "N/A"}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">
                                  {qtdDepoimentos}
                                </Badge>
                              </TableCell>
                              <TableCell className="max-w-xs">
                                <div className="text-sm text-muted-foreground truncate">
                                  {cnjsInfo}
                                </div>
                              </TableCell>
                              <TableCell>
                                {testemunha.reclamante_nome
                                  ? testemunha.reclamante_nome.length > 25
                                    ? testemunha.reclamante_nome.substring(
                                        0,
                                        25,
                                      ) + "..."
                                    : testemunha.reclamante_nome
                                  : "N/A"}
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-1 flex-wrap">
                                  {testemunha.e_prova_emprestada && (
                                    <Badge
                                      variant="outline"
                                      className="text-xs text-warning"
                                    >
                                      Prova Emprestada
                                    </Badge>
                                  )}
                                  {qtdDepoimentos > 10 && (
                                    <Badge
                                      variant="outline"
                                      className="text-xs text-primary"
                                    >
                                      Alta Frequência
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        },
                      )}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Nenhuma testemunha válida encontrada para prévia.
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setCurrentStep("validation")}>
          Voltar para Validação
        </Button>
        <Button
          onClick={() => setCurrentStep("publish")}
          className="bg-success hover:bg-success/90"
          disabled={summary.errors > 0 || summary.valid === 0}
        >
          Publicar Nova Versão
        </Button>
      </div>
    </div>
  );
}
