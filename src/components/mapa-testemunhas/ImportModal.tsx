import React, { useState, useCallback } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  Upload, 
  CheckCircle2, 
  Eye, 
  CheckCircle,
  AlertCircle, 
  Download,
  RefreshCw,
  FileX,
  Zap,
  Info,
  ChevronDown,
  HelpCircle,
  FileText,
  Table,
  FileSpreadsheet,
  Clock
} from "lucide-react";
import { useDropzone } from "react-dropzone";
import {
  useMapaTestemunhasStore,
  selectIsImportModalOpen
} from "@/lib/store/mapa-testemunhas";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { WorkSheet } from 'xlsx';
import { DataState, DataStatus } from "@/components/ui/data-state";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import { useBeforeUnload } from "@/hooks/useBeforeUnload";

// Utils
const onlyDigits = (s: any) => String(s ?? "").replace(/\D/g, "");
const isCNJ20 = (s: string) => onlyDigits(s).length === 20;

const parseList = (v: any): string[] => {
  const s = String(v ?? "").trim();
  if (!s || s === "[]") return [];
  if (s.startsWith("[") && s.endsWith("]")) {
    try { return JSON.parse(s.replace(/'/g, '"')).map((x: any) => String(x).trim()).filter(Boolean); } catch {}
  }
  return s.split(/[;,]/).map(x => x.trim()).filter(Boolean);
};

// Cabeçalhos obrigatórios (match exato; case-insensitive)
const REQUIRED_TESTEMUNHA = ["Nome_Testemunha", "CNJs_Como_Testemunha"];
const REQUIRED_PROCESSO   = ["CNJ", "Reclamante_Limpo", "Reu_Nome"];

const getHeaderRow = (sheet: WorkSheet, xlsx: any): string[] => {
  const rows = xlsx.utils.sheet_to_json(sheet, { header: 1, blankrows: false }) as any[];
  return (rows[0] || []).map((h: any) => String(h || "").trim());
};

const hasHeaders = (headers: string[], required: string[]) => {
  const set = new Set(headers.map(h => h.toLowerCase()));
  const missing = required.filter(r => !set.has(r.toLowerCase()));
  return { ok: missing.length === 0, missing };
};

// Tipos de erro por linha
type RowError = { 
  row: number; 
  column: string;
  message: string; 
  value?: any;
  type: 'error' | 'warning';
};

type ValidationResults = {
  totalRows: number;
  validRows: number;
  errors: RowError[];
  warnings: RowError[];
  processos: any[];
  testemunhas: any[];
};

// Wizard Steps Component
interface WizardStepsProps {
  currentStep: 'upload' | 'validation' | 'preview' | 'publish';
  validationResults?: ValidationResults;
  isProcessing?: boolean;
}

const WizardSteps: React.FC<WizardStepsProps> = ({
  currentStep,
  validationResults,
  isProcessing
}) => {
  const steps = [
    {
      id: 'upload',
      title: 'Upload do Arquivo',
      icon: Upload,
      description: 'Selecione o arquivo Excel'
    },
    {
      id: 'validation',
      title: 'Validação',
      icon: CheckCircle2,
      description: 'Verificação da qualidade dos dados'
    },
    {
      id: 'preview',
      title: 'Prévia',
      icon: Eye,
      description: 'Visualização antes da importação'
    },
    {
      id: 'publish',
      title: 'Importação',
      icon: CheckCircle,
      description: 'Processamento final'
    }
  ];

  const getStepStatus = (stepId: string) => {
    const currentIndex = steps.findIndex(s => s.id === currentStep);
    const stepIndex = steps.findIndex(s => s.id === stepId);
    
    if (isProcessing && stepId === currentStep) {
      return 'processing';
    }
    
    if (stepIndex < currentIndex) {
      return 'completed';
    } else if (stepIndex === currentIndex) {
      if (stepId === 'validation' && validationResults?.errors.length > 0) {
        return 'error';
      }
      return 'current';
    } else {
      return 'pending';
    }
  };

  const getStepIcon = (step: any, status: string) => {
    const IconComponent = step.icon;
    
    if (status === 'processing') {
      return <Clock className="h-5 w-5 animate-pulse" />;
    } else if (status === 'completed') {
      return <CheckCircle className="h-5 w-5" />;
    } else if (status === 'error') {
      return <AlertCircle className="h-5 w-5" />;
    } else {
      return <IconComponent className="h-5 w-5" />;
    }
  };

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const status = getStepStatus(step.id);
          const isActive = status === 'current' || status === 'processing';
          const isCompleted = status === 'completed';
          const hasError = status === 'error';
          
          return (
            <div key={step.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <div className={`
                  flex items-center justify-center w-12 h-12 rounded-full border-2 
                  ${isCompleted ? 'bg-green-100 border-green-500 text-green-700 dark:bg-green-950 dark:border-green-400 dark:text-green-300' : ''}
                  ${isActive && !hasError ? 'bg-primary/10 border-primary text-primary' : ''}
                  ${hasError ? 'bg-red-100 border-red-500 text-red-700 dark:bg-red-950 dark:border-red-400 dark:text-red-300' : ''}
                  ${status === 'pending' ? 'bg-muted border-muted-foreground/25 text-muted-foreground' : ''}
                  transition-all duration-200
                `}>
                  {getStepIcon(step, status)}
                </div>
                <div className="mt-3 text-center">
                  <span className={`text-sm font-medium ${
                    isActive ? 'text-foreground' : 
                    isCompleted ? 'text-green-700 dark:text-green-300' : 
                    hasError ? 'text-red-700 dark:text-red-300' :
                    'text-muted-foreground'
                  }`}>
                    {step.title}
                  </span>
                  <div className="text-xs text-muted-foreground mt-1">
                    {step.description}
                  </div>
                </div>
              </div>
              
              {index < steps.length - 1 && (
                <div className={`
                  w-16 h-0.5 mx-4 
                  ${index < steps.findIndex(s => s.id === currentStep) ? 'bg-green-500' : 'bg-muted-foreground/25'}
                  transition-colors duration-200
                `} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Error Report Generator
interface ErrorReportGeneratorProps {
  validationResults: ValidationResults;
  fileName: string;
}

const ErrorReportGenerator: React.FC<ErrorReportGeneratorProps> = ({
  validationResults,
  fileName
}) => {
  const { toast } = useToast();
  const [status, setStatus] = useState<DataStatus>('empty');
  const [cnjFailed, setCnjFailed] = useState(false);

  const generateCSVReport = () => {
    try {
      const headers = ['Linha', 'Coluna', 'Tipo', 'Mensagem', 'Valor'];
      const rows = [
        headers.join(','),
        `"Resumo","Total: ${validationResults.totalRows}","Válidos: ${validationResults.validRows}","Erros: ${validationResults.errors.length}","Avisos: ${validationResults.warnings.length}"`,
        '',
        ...validationResults.errors.map(error => [
          error.row,
          `"${error.column}"`,
          'Erro',
          `"${error.message}"`,
          `"${error.value || ''}"`
        ].join(',')),
        ...validationResults.warnings.map(warning => [
          warning.row,
          `"${warning.column}"`,
          'Aviso',
          `"${warning.message}"`,
          `"${warning.value || ''}"`
        ].join(','))
      ];

      const csvContent = rows.join('\n');
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `relatorio-validacao-${fileName.replace(/\.[^/.]+$/, '')}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Relatório CSV gerado",
        description: "Download iniciado com sucesso"
      });
    } catch (error) {
      console.error('Error generating CSV report:', error);
      toast({
        title: "Erro ao gerar relatório",
        description: "Falha na geração do arquivo CSV",
        variant: "destructive"
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Relatório de Validação
        </CardTitle>
        <CardDescription>
          Gere relatórios detalhados dos erros e avisos encontrados
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="text-lg font-bold">{validationResults.totalRows.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">Total de linhas</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-lg font-bold text-green-600">{validationResults.validRows.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">Linhas válidas</div>
          </div>
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <div className="text-lg font-bold text-red-600">{validationResults.errors.length}</div>
            <div className="text-xs text-muted-foreground">Erros</div>
          </div>
          <div className="text-center p-3 bg-orange-50 rounded-lg">
            <div className="text-lg font-bold text-orange-600">{validationResults.warnings.length}</div>
            <div className="text-xs text-muted-foreground">Avisos</div>
          </div>
        </div>

        <Button 
          variant="outline" 
          onClick={generateCSVReport}
          className="flex items-center gap-2"
        >
          <Table className="h-4 w-4" />
          Exportar Relatório CSV
        </Button>
      </CardContent>
    </Card>
  );
};

// Main Component
export function ImportModal() {
  const isImportModalOpen = useMapaTestemunhasStore(selectIsImportModalOpen);
  const setIsImportModalOpen = useMapaTestemunhasStore(s => s.setIsImportModalOpen);
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState<'upload' | 'validation' | 'preview' | 'publish'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [validationResults, setValidationResults] = useState<ValidationResults | null>(null);
  const [finalResult, setFinalResult] = useState<any | null>(null);
  const [status, setStatus] = useState<DataStatus>('empty');
  const [cnjFailed, setCnjFailed] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);

  const resetState = () => {
    setCurrentStep('upload');
    setFile(null);
    setIsProcessing(false);
    setUploadProgress(0);
    setValidationResults(null);
    setFinalResult(null);
    setStatus('empty');
    setCnjFailed(false);
  };

  const isDirty = !!file || currentStep !== 'upload';
  useBeforeUnload(isDirty);

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      if (isDirty) {
        setConfirmClose(true);
      } else {
        resetState();
        setIsImportModalOpen(false);
      }
    } else {
      setIsImportModalOpen(true);
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const uploadedFile = acceptedFiles[0];
    if (uploadedFile) {
      setFile(uploadedFile);
      setValidationResults(null);
      setFinalResult(null);
      setCurrentStep('upload');
      simulateUpload(uploadedFile);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    },
    maxFiles: 1,
  });

  const simulateUpload = (file: File) => {
    setIsProcessing(true);
    setUploadProgress(0);
    
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 95) {
          clearInterval(progressInterval);
          return 95;
        }
        return prev + Math.random() * 15;
      });
    }, 200);
    
    processFileValidation(file);
  };

  // Validações
  const validateTestemunhaRows = (rows: any[]): RowError[] => {
    const errors: RowError[] = [];
    rows.forEach((r, i) => {
      if (!r.nome_testemunha || String(r.nome_testemunha).trim() === "") {
        errors.push({ 
          row: i + 2, 
          column: "Nome_Testemunha",
          message: "Nome_Testemunha é obrigatório",
          type: 'error'
        });
      }
      const list = Array.isArray(r.cnjs_como_testemunha)
        ? r.cnjs_como_testemunha
        : parseList(r.cnjs_como_testemunha);
      if (!list.length) {
        errors.push({ 
          row: i + 2, 
          column: "CNJs_Como_Testemunha",
          message: "Lista de CNJs vazia",
          type: 'error'
        });
      }
      if (!list.some(isCNJ20)) {
        errors.push({ 
          row: i + 2, 
          column: "CNJs_Como_Testemunha",
          message: "Nenhum CNJ com 20 dígitos na lista",
          type: 'error'
        });
      }
    });
    return errors;
  };

  const validateProcessoRows = (rows: any[]): RowError[] => {
    const errors: RowError[] = [];
    rows.forEach((r, i) => {
      if (!r.cnj || !isCNJ20(r.cnj)) {
        errors.push({ 
          row: i + 2, 
          column: "CNJ",
          message: "CNJ deve ter 20 dígitos (removendo máscara)",
          value: r.cnj,
          type: 'error'
        });
      }
      if (!r.reclamante_limpo || String(r.reclamante_limpo).trim() === "") {
        errors.push({ 
          row: i + 2, 
          column: "Reclamante_Limpo",
          message: "Reclamante_Limpo é obrigatório",
          type: 'error'
        });
      }
      if (!r.reu_nome || String(r.reu_nome).trim() === "") {
        errors.push({ 
          row: i + 2, 
          column: "Reu_Nome",
          message: "Reu_Nome é obrigatório",
          type: 'error'
        });
      }
    });
    return errors;
  };

  const processFileValidation = async (file: File) => {
    try {
      const { porProcesso, porTestemunha, errors, warnings } = await processExcelFile(file);

      const totalRows = porProcesso.length + porTestemunha.length;
      const validRows = totalRows - errors.length;

      const validationResults: ValidationResults = {
        totalRows,
        validRows,
        errors,
        warnings: warnings || [],
        processos: porProcesso,
        testemunhas: porTestemunha
      };

      setValidationResults(validationResults);
      setCurrentStep('validation');
    } catch (error: any) {
      console.error('Validation error:', error);
      toast({
        title: "Erro na validação",
        description: error.message || "Falha ao processar arquivo",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
      setUploadProgress(100);
    }
  };

  const processExcelFile = async (
    file: File
  ): Promise<{ porProcesso: any[]; porTestemunha: any[]; errors: RowError[]; warnings?: RowError[] }> => {
    const XLSX = await import('xlsx');
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const wb = XLSX.read(data, { type: "array" });

          const sheetProc = wb.Sheets["Por Processo"];
          const sheetTest = wb.Sheets["Por Testemunha"];

          if (!sheetProc && !sheetTest) {
            throw new Error('Arquivo deve conter ao menos uma aba: "Por Processo" ou "Por Testemunha".');
          }

          const outProc: any[] = [];
          const outTest: any[] = [];
          let allErrors: RowError[] = [];

          // ----- Por Processo -----
          if (sheetProc) {
            const headers = getHeaderRow(sheetProc, XLSX);
            const { ok, missing } = hasHeaders(headers, REQUIRED_PROCESSO);
            if (!ok) throw new Error(`Modo Processo: faltam colunas: ${missing.join(", ")}`);

            const raw = XLSX.utils.sheet_to_json<any>(sheetProc, { defval: "" });
            raw.forEach((row) => {
              const cnj = String(row["CNJ"] ?? "").trim();
              const mapped = {
                cnj,                                    
                cnj_digits: onlyDigits(cnj),            
                reclamante_limpo: row["Reclamante_Limpo"],
                reu_nome: row["Reu_Nome"],
                comarca: row["Comarca"] ?? "",
                fase: row["Fase"] ?? "",
                status: row["Status"] ?? "",
              };
              outProc.push(mapped);
            });

            allErrors = allErrors.concat(validateProcessoRows(outProc));
          }

          // ----- Por Testemunha -----
          if (sheetTest) {
            const headers = getHeaderRow(sheetTest, XLSX);
            const { ok, missing } = hasHeaders(headers, REQUIRED_TESTEMUNHA);
            if (!ok) throw new Error(`Modo Testemunha: faltam colunas: ${missing.join(", ")}`);

            const raw = XLSX.utils.sheet_to_json<any>(sheetTest, { defval: "" });
            raw.forEach((row) => {
              const list = parseList(row["CNJs_Como_Testemunha"]);
              const mapped = {
                nome_testemunha: row["Nome_Testemunha"],
                cnjs_como_testemunha: list,
              };
              outTest.push(mapped);
            });

            allErrors = allErrors.concat(validateTestemunhaRows(outTest));
          }

          resolve({ porProcesso: outProc, porTestemunha: outTest, errors: allErrors });
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error("Erro ao ler arquivo"));
      reader.readAsArrayBuffer(file);
    });
  };

  const handlePublish = async () => {
    if (!validationResults) return;
    if (!navigator.onLine) {
      setStatus('offline');
      setCnjFailed(true);
      return;
    }

    setIsProcessing(true);
    setUploadProgress(0);
    setCurrentStep('publish');
    setStatus('loading');

    try {
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + Math.random() * 10;
        });
      }, 300);

      // explode testemunhas
      const testemunhasExplodidas = validationResults.testemunhas.flatMap(t =>
        (t.cnjs_como_testemunha as string[]).map((cnj: string) => ({
          nome_testemunha: t.nome_testemunha,
          cnj,
          cnj_digits: onlyDigits(cnj),
        }))
      );

      // monta payload
      const payload: any = {};
      if (validationResults.processos.length) payload.processos = validationResults.processos;
      if (testemunhasExplodidas.length) payload.testemunhas = testemunhasExplodidas;

      // chama Edge
      const { data, error } = await supabase.functions.invoke("import-mapa-testemunhas", { body: payload });

      setUploadProgress(100);
      if (error) throw error;

      setFinalResult(data);
      setStatus('success');
      setCnjFailed(false);
      toast({
        title: "Importação concluída!",
        description: `${data?.upserts ?? 0} registros processados com sucesso.`,
      });
    } catch (error: any) {
      console.error('Import error:', error);
      setStatus(navigator.onLine ? 'error' : 'offline');
      setCnjFailed(true);
      toast({
        title: "Erro na importação",
        description: error.message || "Ocorreu um erro durante a importação.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setUploadProgress(100);
    }
  };

  const handleClose = () => {
    setIsImportModalOpen(false);
    setFile(null);
    setValidationResults(null);
    setFinalResult(null);
    setCurrentStep('upload');
    setUploadProgress(0);
  };

  const renderUploadStep = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload de Arquivo Excel
          </div>
          <Collapsible>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="text-muted-foreground">
                <HelpCircle className="h-4 w-4 mr-2" />
                Precisa de ajuda?
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="absolute z-10 mt-2 p-4 bg-background border rounded-lg shadow-lg max-w-md right-0">
              <div className="space-y-3">
                <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950">
                  <Info className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800 dark:text-blue-200">
                    <strong>Formato requerido:</strong> Arquivo Excel (.xlsx) com abas:
                    <br />• <strong>Por Processo:</strong> CNJ, Reclamante_Limpo, Reu_Nome
                    <br />• <strong>Por Testemunha:</strong> Nome_Testemunha, CNJs_Como_Testemunha
                  </AlertDescription>
                </Alert>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </CardTitle>
        <CardDescription>
          Faça upload do arquivo Excel com os dados do mapa de testemunhas
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div 
          {...getRootProps()} 
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary'
          }`}
        >
          <input {...getInputProps()} />
          <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          {isDragActive ? (
            <p className="text-lg">Solte o arquivo aqui...</p>
          ) : (
            <div>
              <p className="text-lg mb-2">Arraste e solte o arquivo aqui</p>
              <p className="text-sm text-muted-foreground mb-4">ou clique para selecionar</p>
              <Button variant="outline">Selecionar Arquivo</Button>
            </div>
          )}
        </div>

        {file && (
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{file.name}</p>
                <p className="text-sm text-muted-foreground">
                  {(file.size / 1024 / 1024).toFixed(2)} MB • Excel
                </p>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  setFile(null);
                  setValidationResults(null);
                  setCurrentStep('upload');
                }}
              >
                <FileX className="h-4 w-4" />
              </Button>
            </div>
            
            {isProcessing && (
              <div className="mt-3">
                <Progress value={uploadProgress} className="w-full" />
                <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                  <Zap className="h-3 w-3 animate-pulse" />
                  {uploadProgress < 95 ? `Enviando arquivo... ${Math.round(uploadProgress)}%` : 'Processando e validando dados...'}
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderValidationStep = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5" />
          Validação e Normalização
        </CardTitle>
        <CardDescription>
          Verificando a qualidade e consistência dos dados
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!validationResults ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p>Validando arquivo...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold">{validationResults.totalRows?.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Linhas analisadas</div>
              </div>
              <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">{validationResults.validRows?.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Linhas válidas</div>
              </div>
              <div className="text-center p-4 bg-red-50 dark:bg-red-950 rounded-lg">
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">{validationResults.errors?.length || 0}</div>
                <div className="text-sm text-muted-foreground">Erros</div>
              </div>
              <div className="text-center p-4 bg-orange-50 dark:bg-orange-950 rounded-lg">
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{validationResults.warnings?.length || 0}</div>
                <div className="text-sm text-muted-foreground">Avisos</div>
              </div>
            </div>

            {validationResults.errors?.length === 0 && validationResults.validRows > 0 && (
              <Alert className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800 dark:text-green-200">
                  ✅ Arquivo pronto para importação! {validationResults.validRows} registros serão processados.
                </AlertDescription>
              </Alert>
            )}

            {validationResults.errors?.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">Erros Encontrados:</h4>
                {validationResults.errors.slice(0, 5).map((error: any, index: number) => (
                  <Alert key={index} variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Linha {error.row}:</strong> {error.message} ({error.column})
                    </AlertDescription>
                  </Alert>
                ))}
                {validationResults.errors.length > 5 && (
                  <p className="text-sm text-muted-foreground">
                    ... e mais {validationResults.errors.length - 5} erros
                  </p>
                )}
              </div>
            )}

            {(validationResults.errors?.length > 0 || validationResults.warnings?.length > 0) && (
              <ErrorReportGenerator 
                validationResults={validationResults}
                fileName={file?.name || 'arquivo'}
              />
            )}

            <div className="flex gap-2 justify-between">
              <Button variant="outline" onClick={() => setCurrentStep('upload')}>
                Voltar
              </Button>
              <div className="flex gap-2">
                <Button 
                  onClick={() => setCurrentStep('preview')}
                  disabled={validationResults.validRows === 0 || (validationResults.errors?.length || 0) > 0}
                >
                  {validationResults.errors?.length > 0 ? 'Corrigir Erros Primeiro' : 'Continuar para Prévia'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderPreviewStep = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5" />
          Prévia dos Dados
        </CardTitle>
        <CardDescription>
          Visualização dos dados processados e normalizados
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold">{validationResults?.processos.length || 0}</div>
              <div className="text-sm text-muted-foreground">Processos</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold">{validationResults?.testemunhas.length || 0}</div>
              <div className="text-sm text-muted-foreground">Testemunhas</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold">
                {validationResults ? Math.round((validationResults.validRows / validationResults.totalRows) * 100) : 0}%
              </div>
              <div className="text-sm text-muted-foreground">Taxa de sucesso</div>
            </div>
          </div>

          <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
            <Eye className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800 dark:text-blue-200">
              <strong>Prévia da Importação:</strong> {validationResults?.validRows || 0} registros serão processados e inseridos no mapa de testemunhas.
            </AlertDescription>
          </Alert>

          {validationResults?.processos.length > 0 && (
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="p-3 text-left">CNJ</th>
                    <th className="p-3 text-left">Reclamante</th>
                    <th className="p-3 text-left">Réu</th>
                  </tr>
                </thead>
                <tbody>
                  {validationResults.processos.slice(0, 3).map((processo, i) => (
                    <tr key={i} className="border-t">
                      <td className="p-3 font-mono text-sm">{processo.cnj}</td>
                      <td className="p-3">{processo.reclamante_limpo}</td>
                      <td className="p-3">{processo.reu_nome}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex gap-2 justify-between">
            <Button variant="outline" onClick={() => setCurrentStep('validation')}>
              Voltar para Validação
            </Button>
            <Button 
              onClick={handlePublish}
              className="bg-green-600 hover:bg-green-700"
              disabled={(validationResults?.errors?.length || 0) > 0}
            >
              Confirmar Importação
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderPublishStep = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5" />
          Importação
        </CardTitle>
        <CardDescription>
          Processamento dos dados no sistema
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {!finalResult ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="font-medium">Importando dados...</p>
              <p className="text-sm text-muted-foreground mt-2">
                Processando e inserindo registros no mapa de testemunhas.
              </p>
              <div className="mt-4">
                <Progress value={uploadProgress} className="w-full" />
                <p className="text-sm text-muted-foreground mt-1">
                  {uploadProgress < 100 ? 'Processando...' : 'Finalizando...'}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <Alert className="border-green-200 bg-green-50 dark:bg-green-950">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800 dark:text-green-200">
                  <strong>Importação concluída com sucesso!</strong>
                  <br />• Registros processados: {finalResult.upserts}
                  {finalResult.errors?.length > 0 && (
                    <><br />• Erros: {finalResult.errors.length}</>
                  )}
                </AlertDescription>
              </Alert>

              <Button className="w-full" onClick={handleClose}>
                Fechar
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <>
    <Dialog open={isImportModalOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Importar Mapa de Testemunhas
          </DialogTitle>
          <DialogDescription>
            Importe dados do Excel com as abas "Por Processo" e/ou "Por Testemunha"
          </DialogDescription>
        </DialogHeader>

        {cnjFailed && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>Integração CNJ indisponível</AlertDescription>
          </Alert>
        )}

        {status !== 'empty' && status !== 'success' && (
          <DataState status={status as DataStatus} onRetry={handlePublish} />
        )}

        <WizardSteps
          currentStep={currentStep}
          validationResults={validationResults}
          isProcessing={isProcessing}
        />

        <div className="space-y-6">
          {currentStep === 'upload' && renderUploadStep()}
          {currentStep === 'validation' && renderValidationStep()}
          {currentStep === 'preview' && renderPreviewStep()}
          {currentStep === 'publish' && renderPublishStep()}
        </div>
      </DialogContent>
    </Dialog>
    <ConfirmDialog
      open={confirmClose}
      title="Descartar alterações?"
      description="Você possui alterações não salvas. Deseja realmente sair?"
      confirmText="Sair"
      onConfirm={() => { setConfirmClose(false); resetState(); setIsImportModalOpen(false); }}
      onCancel={() => setConfirmClose(false)}
    />
    </>
  );
}