import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Shield, Loader2 } from "lucide-react";

interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  role: "ADMIN" | "ANALYST" | "VIEWER";
  data_access_level: "FULL" | "MASKED" | "NONE";
  is_active: boolean;
}

interface RoleChangeModalProps {
  user: UserProfile | null;
  isOpen: boolean;
  onClose: () => void;
  onRoleChange: (
    userId: string,
    role: "ADMIN" | "ANALYST" | "VIEWER",
    dataAccessLevel: "FULL" | "MASKED" | "NONE",
  ) => Promise<void>;
  loading: boolean;
}

const RoleChangeModal: React.FC<RoleChangeModalProps> = ({
  user,
  isOpen,
  onClose,
  onRoleChange,
  loading,
}) => {
  const [selectedRole, setSelectedRole] = useState<
    "ADMIN" | "ANALYST" | "VIEWER"
  >("VIEWER");
  const [selectedDataAccess, setSelectedDataAccess] = useState<
    "FULL" | "MASKED" | "NONE"
  >("NONE");

  React.useEffect(() => {
    if (user) {
      setSelectedRole(user.role);
      setSelectedDataAccess(user.data_access_level);
    }
  }, [user]);

  const handleSubmit = async () => {
    if (!user) return;
    await onRoleChange(user.user_id, selectedRole, selectedDataAccess);
    onClose();
  };

  if (!user) return null;

  const getRoleDescription = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "Acesso completo ao sistema, pode gerenciar usuários e configurações";
      case "ANALYST":
        return "Pode analisar dados, criar relatórios e fazer análises";
      case "VIEWER":
        return "Visualização limitada conforme nível de acesso aos dados";
      default:
        return "";
    }
  };

  const getDataAccessDescription = (level: string) => {
    switch (level) {
      case "FULL":
        return "Acesso completo a todos os dados, incluindo informações sensíveis";
      case "MASKED":
        return "Acesso aos dados com informações pessoais mascaradas";
      case "NONE":
        return "Sem acesso a dados pessoais ou sensíveis";
      default:
        return "";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Alterar Papel e Acesso
          </DialogTitle>
          <DialogDescription>
            Configurar papel e nível de acesso aos dados para{" "}
            <strong>{user.email}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-3">
            <Label>Papel Atual</Label>
            <div className="flex gap-2">
              <Badge
                variant={
                  user.role === "ADMIN"
                    ? "destructive"
                    : user.role === "ANALYST"
                      ? "default"
                      : "secondary"
                }
              >
                {user.role}
              </Badge>
              <Badge variant="outline">{user.data_access_level}</Badge>
            </div>
          </div>

          <div className="space-y-3">
            <Label htmlFor="role">Novo Papel</Label>
            <Select
              value={selectedRole}
              onValueChange={(value: "ADMIN" | "ANALYST" | "VIEWER") =>
                setSelectedRole(value)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="VIEWER">Visualizador</SelectItem>
                <SelectItem value="ANALYST">Analista</SelectItem>
                <SelectItem value="ADMIN">Administrador</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              {getRoleDescription(selectedRole)}
            </p>
          </div>

          <div className="space-y-3">
            <Label htmlFor="dataAccess">Nível de Acesso aos Dados</Label>
            <Select
              value={selectedDataAccess}
              onValueChange={(value: "FULL" | "MASKED" | "NONE") =>
                setSelectedDataAccess(value)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NONE">Sem Acesso</SelectItem>
                <SelectItem value="MASKED">Dados Mascarados</SelectItem>
                <SelectItem value="FULL">Acesso Completo</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              {getDataAccessDescription(selectedDataAccess)}
            </p>
          </div>

          {(selectedRole !== user.role ||
            selectedDataAccess !== user.data_access_level) && (
            <div className="p-3 bg-warning/10 border border-warning/20 rounded-md">
              <p className="text-sm text-warning-foreground">
                <strong>Atenção:</strong> Estas alterações entrarão em vigor
                imediatamente e afetarão o acesso do usuário ao sistema.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              loading ||
              (selectedRole === user.role &&
                selectedDataAccess === user.data_access_level)
            }
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirmar Alteração
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RoleChangeModal;
