import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { GlobalMetrics } from "@/components/super-admin/GlobalMetrics";
import { OrgList } from "@/components/super-admin/OrgList";
import { Shield, Activity, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

export default function SuperAdminDashboard() {
  const { isSuperAdmin } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSuperAdmin) {
      toast({
        title: "Acesso negado",
        description: "Você não tem permissão para acessar esta área.",
        variant: "destructive",
      });
      navigate("/dashboard");
    } else {
      setLoading(false);
    }
  }, [isSuperAdmin, navigate, toast]);

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Super Admin Dashboard</h1>
            <p className="text-muted-foreground">
              Visão global de todas as organizações do sistema
            </p>
          </div>
        </div>
        <Button
          onClick={() => navigate("/super-admin/users")}
          className="gap-2"
        >
          <Users className="h-4 w-4" />
          Gerenciar Usuários
        </Button>
      </div>

      {/* Global Metrics */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold">Métricas Globais</h2>
        </div>
        <GlobalMetrics />
      </Card>

      {/* Organizations List */}
      <OrgList />
    </div>
  );
}
