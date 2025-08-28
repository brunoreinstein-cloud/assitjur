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

const getHeaderRow = (sheet: XLSX.WorkSheet): string[] => {
  const rows = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, blankrows: false }) as any[];
  return (rows[0] || []).map((h: any) => String(h || "").trim());
};

const hasHeaders = (headers: string[], required: string[]) => {
  const set = new Set(headers.map(h => h.toLowerCase()));
  const missing = required.filter(r => !set.has(r.toLowerCase()));
  return { ok: missing.length === 0, missing };
};

// Tipos de erro por linha
type RowError = { idx: number; messages: string[] };

// Validações (trocar pela versão abaixo)
const validateTestemunhaRows = (rows: any[]): RowError[] => {
  const errors: RowError[] = [];
  rows.forEach((r, i) => {
    const msgs: string[] = [];
    if (!r.nome_testemunha || String(r.nome_testemunha).trim() === "") {
      msgs.push("Nome_Testemunha é obrigatório");
    }
    const list = Array.isArray(r.cnjs_como_testemunha)
      ? r.cnjs_como_testemunha
      : parseList(r.cnjs_como_testemunha);
    if (!list.length) msgs.push("Lista de CNJs vazia");
    if (!list.some(isCNJ20)) msgs.push("Nenhum CNJ com 20 dígitos na lista");
    if (msgs.length) errors.push({ idx: i + 2, messages: msgs }); // +2 porque header é linha 1
  });
  return errors;
};

const validateProcessoRows = (rows: any[]): RowError[] => {
  const errors: RowError[] = [];
  rows.forEach((r, i) => {
    const msgs: string[] = [];
    if (!r.cnj || !isCNJ20(r.cnj)) msgs.push("CNJ deve ter 20 dígitos (removendo máscara)");
    if (!r.reclamante_limpo || String(r.reclamante_limpo).trim() === "") msgs.push("Reclamante_Limpo é obrigatório");
    if (!r.reu_nome || String(r.reu_nome).trim() === "") msgs.push("Reu_Nome é obrigatório");
    if (msgs.length) errors.push({ idx: i + 2, messages: msgs });
  });
  return errors;
};


export function ImportModal() {
  const isImportModalOpen = useMapaTestemunhasStore(selectIsImportModalOpen);
  const setIsImportModalOpen = useMapaTestemunhasStore(s => s.setIsImportModalOpen);
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [preview, setPreview] = useState<{ processos: any[]; testemunhas: any[] } | null>(null);

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

  // Leitura, mapeamento e normalização do Excel (substituir processExcelFile)
  const processExcelFile = async (
    file: File
  ): Promise<{ porProcesso: any[]; porTestemunha: any[]; errors: RowError[]; preview: { processos: any[]; testemunhas: any[] } }> => {
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
            const headers = getHeaderRow(sheetProc);
            const { ok, missing } = hasHeaders(headers, REQUIRED_PROCESSO);
            if (!ok) throw new Error(`Modo Processo: faltam colunas: ${missing.join(", ")}`);

            const raw = XLSX.utils.sheet_to_json<any>(sheetProc, { defval: "" });
            raw.forEach((row) => {
              const cnj = String(row["CNJ"] ?? "").trim();
              const mapped = {
                cnj,                                    // CNJ com máscara (exibição)
                cnj_digits: onlyDigits(cnj),            // 20 dígitos (backend)
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
            const headers = getHeaderRow(sheetTest);
            const { ok, missing } = hasHeaders(headers, REQUIRED_TESTEMUNHA);
            if (!ok) throw new Error(`Modo Testemunha: faltam colunas: ${missing.join(", ")}`);

            const raw = XLSX.utils.sheet_to_json<any>(sheetTest, { defval: "" });
            raw.forEach((row) => {
              const list = parseList(row["CNJs_Como_Testemunha"]);
              const mapped = {
                nome_testemunha: row["Nome_Testemunha"],
                cnjs_como_testemunha: list, // mantém array
              };
              outTest.push(mapped);
            });

            allErrors = allErrors.concat(validateTestemunhaRows(outTest));
          }

          // Prévia (até 5 linhas)
          const preview = {
            processos: outProc.slice(0, 5),
            testemunhas: outTest.slice(0, 5),
          };

          resolve({ porProcesso: outProc, porTestemunha: outTest, errors: allErrors, preview });
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error("Erro ao ler arquivo"));
      reader.readAsArrayBuffer(file);
    });
  };

  const handleImport = async () => {
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Envio para Edge Function (substituir trecho do handleImport)
      setUploadProgress(20);
      const { porProcesso, porTestemunha, errors, preview } = await processExcelFile(file);

      // mostre preview (opcional: guarde num state para renderizar)
      console.log("Preview", preview);
      setPreview(preview);

      if (errors.length) {
        setIsUploading(false);
        setUploadProgress(0);
        setResult({
          stagingRows: 0,
          upserts: 0,
          errors: errors.flatMap(e => e.messages.map(m => `Linha ${e.idx}: ${m}`)),
        });
        toast({
          title: "Erros na validação do arquivo",
          description: "Corrija os erros exibidos abaixo e tente novamente.",
          variant: "destructive",
        });
        return;
      }

      setUploadProgress(40);

      // explode testemunhas
      const testemunhasExplodidas = porTestemunha.flatMap(t =>
        (t.cnjs_como_testemunha as string[]).map((cnj: string) => ({
          nome_testemunha: t.nome_testemunha,
          cnj,
          cnj_digits: onlyDigits(cnj),
        }))
      );

      // monta payload
      const payload: any = {};
      if (porProcesso.length) payload.processos = porProcesso;
      if (testemunhasExplodidas.length) payload.testemunhas = testemunhasExplodidas;

      // chama Edge
      const { data, error } = await supabase.functions.invoke("import-mapa-testemunhas", { body: payload });

      setUploadProgress(100);
      if (error) throw error;

      setResult({
        stagingRows: data?.stagingRows ?? 0,
        upserts: data?.upserts ?? 0,
        errors: data?.errors ?? [],
      });

      toast({
        title: "Importação concluída!",
        description: `${data?.upserts ?? 0} registros processados com sucesso.`,
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
    setPreview(null);
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

          {/* Prévia dos dados */}
          {preview && (
            <div className="space-y-4">
              <Alert>
                <CheckCircle className="h-4 w-4" aria-hidden="true" />
                <AlertDescription>
                  <strong>Prévia dos dados:</strong>
                  {preview.processos.length > 0 && (
                    <div>• {preview.processos.length} processos encontrados</div>
                  )}
                  {preview.testemunhas.length > 0 && (
                    <div>• {preview.testemunhas.length} testemunhas encontradas</div>
                  )}
                </AlertDescription>
              </Alert>

              {preview.processos.length > 0 && (
                <div className="bg-muted/50 p-3 rounded-xl">
                  <p className="font-medium mb-2">Primeiros processos:</p>
                  {preview.processos.slice(0, 3).map((p, idx) => (
                    <div key={idx} className="text-sm text-muted-foreground">
                      • CNJ: {p.cnj} | Reclamante: {p.reclamante_limpo}
                    </div>
                  ))}
                </div>
              )}

              {preview.testemunhas.length > 0 && (
                <div className="bg-muted/50 p-3 rounded-xl">
                  <p className="font-medium mb-2">Primeiras testemunhas:</p>
                  {preview.testemunhas.slice(0, 3).map((t, idx) => (
                    <div key={idx} className="text-sm text-muted-foreground">
                      • {t.nome_testemunha} | CNJs: {t.cnjs_como_testemunha?.length || 0}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

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