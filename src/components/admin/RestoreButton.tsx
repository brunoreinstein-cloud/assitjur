import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface RestoreButtonProps {
  onSuccess?: () => void;
  className?: string;
}

export function RestoreButton({ onSuccess, className }: RestoreButtonProps) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleRestore = async () => {
    if (!profile?.organization_id) {
      toast({
        title: "Erro",
        description: "Organização não encontrada",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.rpc("rpc_restore_all_processos", {
        p_org_id: profile.organization_id,
      });

      if (error) throw error;

      const result = data as unknown as {
        success: boolean;
        restored_count: number;
        message: string;
      };

      if (result.success) {
        toast({
          title: "Restauração concluída",
          description: `${result.restored_count} processos foram restaurados com sucesso`,
        });
        onSuccess?.();
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error("Error restoring processes:", error);
      toast({
        title: "Erro na restauração",
        description:
          error instanceof Error
            ? error.message
            : "Erro desconhecido durante a restauração",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleRestore}
      disabled={isLoading}
      className={className}
    >
      <RotateCcw
        className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
      />
      {isLoading ? "Restaurando..." : "Restaurar Excluídos"}
    </Button>
  );
}
