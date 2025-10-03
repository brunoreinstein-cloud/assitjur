import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Database,
} from "lucide-react";

interface UploadWizardProps {
  onComplete: () => void;
  onCancel: () => void;
}

export function UploadWizard({ onComplete, onCancel }: UploadWizardProps) {
  const [step, setStep] = useState(1);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [fileName, setFileName] = useState("");
  const [validationResults] = useState({
    totalRows: 1247,
    validRows: 1223,
    errors: 24,
    warnings: 12,
  });

  const steps = [
    { id: 1, title: "Upload do Arquivo", icon: Upload },
    { id: 2, title: "Validação", icon: CheckCircle },
    { id: 3, title: "Publicação", icon: Database },
  ];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      // Simulate upload progress
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        setUploadProgress(progress);
        if (progress >= 100) {
          clearInterval(interval);
          setTimeout(() => setStep(2), 500);
        }
      }, 200);
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4 shadow-premium">
                <Upload className="w-8 h-8 text-primary-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                Selecione o arquivo CSV ou XLSX
              </h3>
              <p className="text-muted-foreground text-sm">
                Arquivo deve conter as colunas obrigatórias: cnj, comarca,
                reclamante_nome, etc.
              </p>
            </div>

            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <div className="text-sm">
                  <span className="font-semibold text-primary">
                    Clique para enviar
                  </span>
                  <span className="text-muted-foreground">
                    {" "}
                    ou arraste o arquivo aqui
                  </span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  CSV, XLSX (máx. 10MB)
                </div>
              </label>
            </div>

            {uploadProgress > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{fileName}</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-success rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
                <CheckCircle className="w-8 h-8 text-success-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                Validação Concluída
              </h3>
              <p className="text-muted-foreground text-sm">
                Arquivo processado com sucesso. Revise os resultados abaixo.
              </p>
            </div>

            <Card className="bg-gradient-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">
                  Resultados da Validação
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-background rounded-lg">
                    <div className="text-2xl font-bold text-success">
                      {validationResults.validRows}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Linhas válidas
                    </div>
                  </div>
                  <div className="text-center p-3 bg-background rounded-lg">
                    <div className="text-2xl font-bold text-foreground">
                      {validationResults.totalRows}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Total de linhas
                    </div>
                  </div>
                </div>

                {validationResults.errors > 0 && (
                  <div className="bg-destructive-light p-3 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="w-4 h-4 text-destructive" />
                      <span className="text-sm font-semibold text-destructive">
                        {validationResults.errors} erros encontrados
                      </span>
                    </div>
                    <ul className="text-xs text-destructive/80 space-y-1">
                      <li>• 12 CNJs com formato inválido</li>
                      <li>• 8 datas em formato incorreto</li>
                      <li>• 4 campos obrigatórios vazios</li>
                    </ul>
                  </div>
                )}

                {validationResults.warnings > 0 && (
                  <div className="bg-warning-light p-3 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="w-4 h-4 text-warning" />
                      <span className="text-sm font-semibold text-warning">
                        {validationResults.warnings} avisos
                      </span>
                    </div>
                    <ul className="text-xs text-warning/80 space-y-1">
                      <li>• 7 possíveis duplicatas detectadas</li>
                      <li>• 5 nomes com caracteres especiais</li>
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-success rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
                <Database className="w-8 h-8 text-success-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                Base Publicada com Sucesso
              </h3>
              <p className="text-muted-foreground text-sm">
                Sua base de dados está pronta para consultas.
              </p>
            </div>

            <Card className="bg-gradient-card">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Versão da Base:
                  </span>
                  <Badge
                    variant="outline"
                    className="bg-success/10 text-success border-success/20"
                  >
                    v2024-01-15-1423
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Total de Processos:
                  </span>
                  <span className="font-semibold">
                    {validationResults.validRows}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Integridade:
                  </span>
                  <span className="font-semibold text-success">98%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Hash:</span>
                  <code className="text-xs bg-muted px-2 py-1 rounded">
                    a1b2c3d4...
                  </code>
                </div>
              </CardContent>
            </Card>

            <Button
              onClick={onComplete}
              variant="professional"
              className="w-full"
              size="lg"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Começar Análise
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-md mx-auto">
      {/* Steps Progress */}
      <div className="flex items-center justify-between mb-8">
        {steps.map((stepItem, index) => {
          const Icon = stepItem.icon;
          const isActive = step === stepItem.id;
          const isCompleted = step > stepItem.id;

          return (
            <div key={stepItem.id} className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                  isCompleted
                    ? "bg-success border-success text-success-foreground"
                    : isActive
                      ? "bg-primary border-primary text-primary-foreground"
                      : "bg-background border-border text-muted-foreground"
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`w-12 h-0.5 mx-2 ${step > stepItem.id ? "bg-success" : "bg-border"}`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Step Content */}
      <Card className="shadow-premium">
        <CardContent className="p-6">{renderStepContent()}</CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between mt-6">
        <Button
          variant="outline"
          onClick={step === 1 ? onCancel : () => setStep(step - 1)}
          disabled={step === 3}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {step === 1 ? "Cancelar" : "Voltar"}
        </Button>

        {step < 3 && step === 2 && (
          <Button variant="professional" onClick={() => setStep(3)}>
            Publicar Base
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
}
