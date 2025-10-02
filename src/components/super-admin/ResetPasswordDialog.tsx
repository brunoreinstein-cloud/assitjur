import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ResetPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: {
    user_id: string;
    email: string;
    full_name: string | null;
  };
  onSuccess: () => void;
}

export function ResetPasswordDialog({ open, onOpenChange, user, onSuccess }: ResetPasswordDialogProps) {
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (reason.trim().length < 10) {
      toast({
        title: 'Erro',
        description: 'A justificativa deve ter no mínimo 10 caracteres',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('super-admin-reset-password', {
        body: {
          targetUserId: user.user_id,
          reason: reason.trim(),
        },
      });

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: data.message || 'Email de reset de senha enviado',
      });

      onSuccess();
      onOpenChange(false);
      setReason('');
    } catch (error: any) {
      console.error('Error resetting password:', error);
      toast({
        title: 'Erro ao resetar senha',
        description: error.message || 'Ocorreu um erro ao enviar o email',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Resetar Senha</DialogTitle>
          <DialogDescription>
            Enviar email de reset de senha para <strong>{user.email}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Um email com link de reset será enviado para o usuário. Esta ação será registrada no log de auditoria.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="reason">
              Justificativa <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="reason"
              placeholder="Explique o motivo do reset de senha (mínimo 10 caracteres)..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              {reason.length}/10 caracteres mínimos
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading || reason.trim().length < 10}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Enviar Email de Reset
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
