import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface TransferUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: {
    user_id: string;
    email: string;
    full_name: string | null;
    organization_name: string | null;
  };
  onSuccess: () => void;
}

export function TransferUserDialog({
  open,
  onOpenChange,
  user,
  onSuccess,
}: TransferUserDialogProps) {
  const [newOrgId, setNewOrgId] = useState("");
  const [reason, setReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const { data: organizations } = useQuery({
    queryKey: ["organizations-for-transfer"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organizations")
        .select("id, name, code, is_active")
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  const handleSubmit = async () => {
    if (!newOrgId) {
      toast({
        title: "Erro",
        description: "Selecione uma organização de destino",
        variant: "destructive",
      });
      return;
    }

    if (reason.trim().length < 10) {
      toast({
        title: "Erro",
        description: "A justificativa deve ter no mínimo 10 caracteres",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke(
        "super-admin-transfer-user",
        {
          body: {
            targetUserId: user.user_id,
            newOrgId,
            reason: reason.trim(),
          },
        },
      );

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: data.message || "Usuário transferido com sucesso",
      });

      onSuccess();
      onOpenChange(false);
      setNewOrgId("");
      setReason("");
    } catch (error: unknown) {
      console.error("Error transferring user:", error);
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
      toast({
        title: "Erro ao transferir usuário",
        description: errorMessage || "Ocorreu um erro durante a transferência",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Transferir Usuário</DialogTitle>
          <DialogDescription>
            Transferir <strong>{user.email}</strong> para outra organização
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              O usuário será removido da organização atual e adicionado à nova
              organização. Esta ação será registrada no log de auditoria.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label>Organização Atual</Label>
            <div className="px-3 py-2 border rounded-md bg-muted">
              {user.organization_name || "Sem organização"}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-org">
              Nova Organização <span className="text-destructive">*</span>
            </Label>
            <Select
              value={newOrgId}
              onValueChange={setNewOrgId}
              disabled={isLoading}
            >
              <SelectTrigger id="new-org">
                <SelectValue placeholder="Selecione a organização destino" />
              </SelectTrigger>
              <SelectContent>
                {organizations?.map((org) => (
                  <SelectItem key={org.id} value={org.id}>
                    {org.name} ({org.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">
              Justificativa <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="reason"
              placeholder="Explique o motivo da transferência (mínimo 10 caracteres)..."
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
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || !newOrgId || reason.trim().length < 10}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Transferir Usuário
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
