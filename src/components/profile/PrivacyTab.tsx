import { useState } from "react";
import { FileText, Download, Trash2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  requestDataExport,
  requestAccountDeletion,
} from "@/services/lgpd-service";
import { useProfile } from "@/hooks/useProfile";

export function PrivacyTab() {
  const { profile } = useProfile();
  const [deletionReason, setDeletionReason] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDataExport = async () => {
    setIsExporting(true);
    try {
      await requestDataExport();
      toast.success(
        "Solicitação enviada! Você receberá seus dados por email em até 48h.",
      );
    } catch (error) {
      toast.error("Erro ao solicitar exportação de dados");
    } finally {
      setIsExporting(false);
    }
  };

  const handleAccountDeletion = async () => {
    if (!deletionReason.trim()) {
      toast.error("Por favor, informe um motivo para a exclusão");
      return;
    }

    setIsDeleting(true);
    try {
      await requestAccountDeletion(deletionReason);
      toast.success(
        "Solicitação enviada! Sua conta será excluída em até 30 dias.",
      );
      setDeletionReason("");
    } catch (error) {
      toast.error("Erro ao solicitar exclusão de conta");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertTitle>Seus Direitos de Privacidade (LGPD)</AlertTitle>
        <AlertDescription>
          Você tem o direito de acessar, corrigir, deletar ou exportar seus
          dados pessoais a qualquer momento.
        </AlertDescription>
      </Alert>

      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <FileText className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Termos de Uso</h3>
        </div>

        <p className="text-sm text-muted-foreground mb-4">
          Você aceitou os termos de uso em:{" "}
          <strong>
            {profile?.terms_accepted_at
              ? new Date(profile.terms_accepted_at).toLocaleDateString("pt-BR")
              : "Não aceito"}
          </strong>
        </p>

        <Button variant="outline" size="sm">
          Visualizar Termos
        </Button>
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Download className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Exportar Dados</h3>
        </div>

        <p className="text-sm text-muted-foreground mb-4">
          Solicite uma cópia de todos os seus dados pessoais armazenados em
          nossa plataforma. Você receberá um arquivo JSON por email em até 48
          horas.
        </p>

        <Button
          variant="outline"
          onClick={handleDataExport}
          loading={isExporting}
          disabled={isExporting}
        >
          <Download className="mr-2 h-4 w-4" />
          Solicitar Exportação
        </Button>
      </Card>

      <Card className="p-6 border-destructive/50">
        <div className="flex items-center gap-3 mb-4">
          <Trash2 className="h-5 w-5 text-destructive" />
          <h3 className="text-lg font-semibold text-destructive">
            Excluir Conta
          </h3>
        </div>

        <Alert variant="destructive" className="mb-4">
          <AlertDescription>
            <strong>Atenção:</strong> Esta ação é irreversível. Todos os seus
            dados serão permanentemente excluídos após 30 dias.
          </AlertDescription>
        </Alert>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Solicitar Exclusão de Conta
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação não pode ser desfeita. Seus dados serão
                permanentemente excluídos após um período de 30 dias.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <div className="space-y-2">
              <Label htmlFor="deletion-reason">
                Motivo da exclusão (obrigatório)
              </Label>
              <Textarea
                id="deletion-reason"
                value={deletionReason}
                onChange={(e) => setDeletionReason(e.target.value)}
                placeholder="Por favor, nos diga por que você está excluindo sua conta..."
                rows={4}
              />
            </div>

            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleAccountDeletion}
                disabled={!deletionReason.trim() || isDeleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting ? "Processando..." : "Confirmar Exclusão"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </Card>
    </div>
  );
}
