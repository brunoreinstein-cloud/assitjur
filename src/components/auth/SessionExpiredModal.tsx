import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { useSessionStore } from "@/stores/useSessionStore";

export function SessionExpiredModal() {
  const { expired, redirectUrl, hideExpired } = useSessionStore();

  const handleConfirm = () => {
    hideExpired();
    if (redirectUrl) {
      window.location.href = redirectUrl;
    }
  };

  return (
    <AlertDialog open={expired} onOpenChange={hideExpired}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Sessão expirada</AlertDialogTitle>
          <AlertDialogDescription>
            Sua sessão foi encerrada por inatividade ou expiração. Rascunhos
            foram preservados.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={handleConfirm}>
            Fazer login
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default SessionExpiredModal;
