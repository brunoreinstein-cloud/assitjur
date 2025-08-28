import { useState, useCallback } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { 
  useMapaTestemunhasStore, 
  selectIsImportModalOpen 
} from "@/lib/store/mapa-testemunhas";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from 'xlsx';
import { ImportResult } from "@/types/mapa-testemunhas";

// Robust list parser for array fields
const parseList = (v: any): string[] => {
  const s = String(v ?? '').trim();
  if (!s || s === '[]') return [];
  if (s.startsWith('[') && s.endsWith(']')) { 
    try { 
      return JSON.parse(s.replace(/'/g,'"')).map((x:any) => String(x).trim()).filter(Boolean); 
    } catch {} 
  }
  return s.split(/[;,]/).map(x => x.trim()).filter(Boolean);
};

// Strict column mapping
const mapColumns = (headers: string[], mode: 'testemunha' | 'processo') => {
  const mappings: Record<string, string> = {};
  
  if (mode === 'testemunha') {
    // Exact match required for testemunha mode
    const requiredMappings = {
      'Nome_Testemunha': 'nome_testemunha',
      'CNJs_Como_Testemunha': 'cnjs_como_testemunha'
    };
    
    headers.forEach(header => {
      const cleaned = header.trim();
      if (requiredMappings[cleaned]) {
        mappings[cleaned] = requiredMappings[cleaned];
      }
    });
  } else if (mode === 'processo') {
    // Exact match required for processo mode  
    const requiredMappings = {
      'CNJ': 'cnj',
      'Reclamante_Limpo': 'reclamante_limpo',
      'Reu_Nome': 'reu_nome'
    };
    
    headers.forEach(header => {
      const cleaned = header.trim();
      if (requiredMappings[cleaned]) {
        mappings[cleaned] = requiredMappings[cleaned];
      }
    });
  }
  
  return mappings;
};

// Validation for testemunha mode
const validateTestemunhaRow = (row: any): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!row.nome_testemunha || String(row.nome_testemunha).trim() === '') {
    errors.push('Nome_Testemunha é obrigatório');
  }
  
  // Validate CNJs in list
  if (row.cnjs_como_testemunha) {
    const cnjs = parseList(row.cnjs_como_testemunha);
    cnjs.forEach((cnj, index) => {
      const cleaned = cnj.replace(/\D/g, ''); // Remove masks
      if (cleaned.length !== 20) {
        errors.push(`CNJ ${index + 1} deve ter 20 dígitos após remover máscara`);
      }
    });
  }
  
  // Reclamante/Réu are warnings, not errors in testemunha mode
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export function ImportModal() {
  const isImportModalOpen = useMapaTestemunhasStore(selectIsImportModalOpen);
  const setIsImportModalOpen = useMapaTestemunhasStore(s => s.setIsImportModalOpen);
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [result, setResult] = useState<ImportResult | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const uploadedFile = acceptedFiles[0];
    if (uploadedFile) {
      setFile(uploadedFile);
      setResult(null);
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

  const processExcelFile = async (file: File): Promise<{ porProcesso: any[], porTestemunha: any[] }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          
          const porProcessoSheet = workbook.Sheets['Por Processo'];
          const porTestemunhaSheet = workbook.Sheets['Por Testemunha'];
          
          if (!porProcessoSheet && !porTestemunhaSheet) {
            throw new Error('Arquivo deve conter pelo menos uma das abas: "Por Processo" ou "Por Testemunha"');
          }
          
          let porProcesso: any[] = [];
          let porTestemunha: any[] = [];
          
          if (porProcessoSheet) {
            const rawProcesso = XLSX.utils.sheet_to_json(porProcessoSheet);
            const headers = Object.keys(rawProcesso[0] || {});
            const mappings = mapColumns(headers, 'processo');
            
            // Check if exact mapping found
            if (!mappings['CNJ'] || !mappings['Reclamante_Limpo']) {
              throw new Error('Modo Processo requer colunas exatas: CNJ, Reclamante_Limpo, Reu_Nome');
            }
            
            porProcesso = rawProcesso.map(row => {
              const mapped: any = {};
              Object.entries(mappings).forEach(([original, target]) => {
                mapped[target] = (row as any)[original];
              });
              return mapped;
            });
          }
          
          if (porTestemunhaSheet) {
            const rawTestemunha = XLSX.utils.sheet_to_json(porTestemunhaSheet);
            const headers = Object.keys(rawTestemunha[0] || {});
            const mappings = mapColumns(headers, 'testemunha');
            
            // Check if exact mapping found
            if (!mappings['Nome_Testemunha']) {
              throw new Error('Modo Testemunha requer coluna exata: Nome_Testemunha');
            }
            
            porTestemunha = rawTestemunha.map(row => {
              const mapped: any = {};
              Object.entries(mappings).forEach(([original, target]) => {
                if (target === 'cnjs_como_testemunha') {
                  mapped[target] = parseList((row as any)[original]);
                } else {
                  mapped[target] = (row as any)[original];
                }
              });
              
              // Validate row
              const validation = validateTestemunhaRow(mapped);
              if (!validation.isValid) {
                console.warn('Linha inválida:', validation.errors);
              }
              
              return mapped;
            });
          }
          
          resolve({ porProcesso, porTestemunha });
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
      reader.readAsArrayBuffer(file);
    });
  };

  const handleImport = async () => {
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Process Excel file
      setUploadProgress(20);
      const { porProcesso, porTestemunha } = await processExcelFile(file);
      
      setUploadProgress(40);

      // Call import Edge function - send porProcesso as processos
      const { data, error } = await supabase.functions.invoke('import-mapa-testemunhas', {
        body: {
          processos: porProcesso,
        },
      });

      setUploadProgress(100);

      if (error) throw error;

      setResult(data);
      toast({
        title: "Importação concluída!",
        description: `${data.upserts} registros processados com sucesso.`,
      });
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: "Erro na importação",
        description: error instanceof Error ? error.message : "Ocorreu um erro durante a importação.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleClose = () => {
    setIsImportModalOpen(false);
    setFile(null);
    setResult(null);
    setUploadProgress(0);
  };

  return (
    <Dialog open={isImportModalOpen} onOpenChange={setIsImportModalOpen}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Importar Dados Excel
          </DialogTitle>
          <DialogDescription>
            Importe dados do Excel com as abas "Por Processo" e/ou "Por Testemunha" seguindo o formato requerido.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
            <Alert>
            <AlertCircle className="h-4 w-4" aria-hidden="true" />
            <AlertDescription>
              <strong>Formato requerido:</strong> Arquivo Excel (.xlsx) com abas: 
              "Por Processo" e/ou "Por Testemunha". Mapeamento estrito de colunas:
              <br />• <strong>Testemunha:</strong> Nome_Testemunha, CNJs_Como_Testemunha
              <br />• <strong>Processo:</strong> CNJ, Reclamante_Limpo, Reu_Nome
            </AlertDescription>
          </Alert>

          {!file && (
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors ${
                isDragActive ? 'border-primary bg-primary/5' : 'border-border/50 hover:border-primary/50'
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" aria-hidden="true" />
              <div className="space-y-2">
                <p className="text-lg font-medium">
                  {isDragActive ? 'Solte o arquivo aqui' : 'Arraste o arquivo Excel aqui'}
                </p>
                <p className="text-sm text-muted-foreground">
                  ou clique para selecionar um arquivo
                </p>
                <p className="text-xs text-muted-foreground">
                  Suporta: .xlsx, .xls
                </p>
              </div>
            </div>
          )}

          {file && !isUploading && !result && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 border border-border/50 rounded-xl">
                <FileSpreadsheet className="h-8 w-8 text-primary" aria-hidden="true" />
                <div className="flex-1">
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setFile(null)}>
                  Remover
                </Button>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={handleClose}>
                  Cancelar
                </Button>
                <Button className="flex-1" onClick={handleImport}>
                  Importar Dados
                </Button>
              </div>
            </div>
          )}

          {isUploading && (
            <div className="space-y-4">
              <div className="text-center">
                <p className="font-medium">Processando arquivo...</p>
                <p className="text-sm text-muted-foreground">
                  Isso pode levar alguns minutos
                </p>
              </div>
              <Progress value={uploadProgress} className="w-full" />
            </div>
          )}

          {result && (
            <div className="space-y-4">
              <Alert>
                <CheckCircle className="h-4 w-4" aria-hidden="true" />
                <AlertDescription>
                  <div className="space-y-1">
                    <p><strong>Importação concluída com sucesso!</strong></p>
                    <p>• Registros em staging: {result.stagingRows}</p>
                    <p>• Registros processados: {result.upserts}</p>
                    {result.errors.length > 0 && (
                      <p className="text-destructive">• Erros: {result.errors.length}</p>
                    )}
                  </div>
                </AlertDescription>
              </Alert>

              {result.errors.length > 0 && (
                <div className="bg-destructive/10 p-3 rounded-xl">
                  <p className="font-medium text-destructive mb-2">Erros encontrados:</p>
                  <ul className="text-sm space-y-1">
                    {result.errors.map((error, index) => (
                      <li key={index} className="text-destructive">• {error}</li>
                    ))}
                  </ul>
                </div>
              )}

              <Button className="w-full" onClick={handleClose}>
                Fechar
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}