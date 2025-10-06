import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  Download,
  FileText,
  Trash2,
  ShieldAlert,
} from "lucide-react";
import { ProcessoRow } from "@/types/processos-explorer";
import { useToast } from "@/hooks/use-toast";

interface ProcessosDeleteConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  processos: ProcessoRow[];
  isDeleting: boolean;
}

export function ProcessosDeleteConfirmModal({
  open,
  onClose,
  onConfirm,
  processos,
  isDeleting,
}: ProcessosDeleteConfirmModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [confirmText, setConfirmText] = useState("");
  const { toast } = useToast();

  const totalCount = processos.length;
  const REQUIRED_TEXT = "EXCLUIR";

  const handleClose = () => {
    setStep(1);
    setConfirmText("");
    onClose();
  };

  const handleExportBackup = () => {
    // Gerar CSV de backup
    const headers = [
      "CNJ",
      "UF",
      "Comarca",
      "Status",
      "Fase",
      "Reclamante",
      "Reu",
      "Classificacao",
      "Score",
      "Data Audiencia",
      "Created At",
    ];

    const csvRows = [headers.join(",")];

    processos.forEach((processo) => {
      const row = [
        processo.cnj || "",
        processo.uf || "",
        processo.comarca || "",
        processo.status || "",
        processo.fase || "",
        processo.reclamante_nome || "",
        processo.reu_nome || "",
        processo.classificacao_final || "",
        processo.score_risco?.toString() || "",
        processo.data_audiencia || "",
        processo.created_at,
      ];

      csvRows.push(row.map((field) => `"${field}"`).join(","));
    });

    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `backup_processos_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Backup exportado",
      description: "Arquivo CSV com backup dos dados foi baixado com sucesso.",
    });
  };

  const handleProceedToStep2 = () => {
    setStep(2);
  };

  const handleConfirmDelete = () => {
    if (confirmText === REQUIRED_TEXT) {
      onConfirm();
      // Reset modal state after confirming
      setTimeout(() => {
        setStep(1);
        setConfirmText("");
      }, 100);
    }
  };

  const canProceed =
    step === 1 || (step === 2 && confirmText === REQUIRED_TEXT);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-5 w-5" />
            Excluir Todos os Processos
          </DialogTitle>
          <DialogDescription>
            {step === 1
              ? "Esta ação é irreversível. Revise os dados que serão excluídos."
              : "Confirme a exclusão digitando exatamente o texto solicitado."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {step === 1 && (
            <>
              {/* Contador de registros afetados */}
              <Alert className="border-destructive/50 bg-destructive/5">
                <ShieldAlert className="h-4 w-4" />
                <AlertDescription className="flex items-center justify-between">
                  <span>Registros que serão excluídos:</span>
                  <Badge variant="destructive" className="font-mono">
                    {totalCount.toLocaleString("pt-BR")}
                  </Badge>
                </AlertDescription>
              </Alert>

              {/* Link para exportar backup */}
              <div className="flex items-center justify-between p-3 border rounded-lg bg-muted">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    Exportar backup antes da exclusão
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportBackup}
                  className="flex items-center gap-1"
                >
                  <Download className="h-3 w-3" />
                  Backup CSV
                </Button>
              </div>

              {/* Aviso de auditoria */}
              <div className="text-xs text-muted-foreground bg-muted p-3 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-3 w-3 mt-0.5 text-yellow-600" />
                  <div>
                    <p className="font-medium">Registro de auditoria</p>
                    <p>
                      Esta ação será registrada nos logs de auditoria para fins
                      de compliance.
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <Alert className="border-destructive/50 bg-destructive/5">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-semibold">
                      Atenção: Esta ação é irreversível!
                    </p>
                    <p>
                      Para confirmar a exclusão de <strong>{totalCount}</strong>{" "}
                      processos, digite exatamente:
                    </p>
                  </div>
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="confirm-text" className="text-sm font-medium">
                  Digite:{" "}
                  <code className="text-sm bg-muted px-1 py-0.5 rounded">
                    {REQUIRED_TEXT}
                  </code>
                </Label>
                <Input
                  id="confirm-text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder={REQUIRED_TEXT}
                  className={`font-mono ${confirmText === REQUIRED_TEXT ? "border-green-500" : "border-destructive"}`}
                  autoFocus
                />
                {confirmText && confirmText !== REQUIRED_TEXT && (
                  <p className="text-xs text-destructive">
                    Texto não confere. Digite exatamente: {REQUIRED_TEXT}
                  </p>
                )}
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isDeleting}>
            Cancelar
          </Button>

          {step === 1 ? (
            <Button
              variant="destructive"
              onClick={handleProceedToStep2}
              disabled={isDeleting}
            >
              Continuar
            </Button>
          ) : (
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={!canProceed || isDeleting}
            >
              {isDeleting ? (
                <>
                  <AlertTriangle className="h-4 w-4 mr-2 animate-spin" />
                  Excluindo...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Confirmar Exclusão
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
