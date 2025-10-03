import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { AllUsersTable } from "@/components/super-admin/AllUsersTable";
import { useToast } from "@/hooks/use-toast";

export default function UserManagement() {
  const { isSuperAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && !isSuperAdmin) {
      toast({
        title: "Acesso Negado",
        description: "Apenas super admins podem acessar esta página",
        variant: "destructive",
      });
      navigate("/");
    }
  }, [isSuperAdmin, loading, navigate, toast]);

  if (loading) {
    return (
      <div className="container mx-auto py-8 space-y-8">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!isSuperAdmin) {
    return null;
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Gerenciamento de Usuários</h1>
        <p className="text-muted-foreground">
          Visualize e gerencie todos os usuários do sistema
        </p>
      </div>

      <AllUsersTable />
    </div>
  );
}
