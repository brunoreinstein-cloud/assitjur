import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AssistJurImportResult } from "@/types/assistjur";

export function useAssistJurImport() {
  const [isUploading, setIsUploading] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  const uploadFile = async (file: File): Promise<AssistJurImportResult> => {
    setIsUploading(true);

    try {
      // Validar tipo de arquivo
      if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
        throw new Error("Apenas arquivos Excel (.xlsx, .xls) são suportados");
      }

      // Validar tamanho (max 50MB)
      if (file.size > 50 * 1024 * 1024) {
        throw new Error("Arquivo muito grande. Limite: 50MB");
      }

      const formData = new FormData();
      formData.append("file", file);

      const { data, error } = await supabase.functions.invoke(
        "import-assistjur-xlsx",
        {
          body: formData,
        },
      );

      if (error) {
        throw new Error(error.message || "Erro na importação");
      }

      if (!data.success) {
        throw new Error(data.error || "Erro desconhecido na importação");
      }

      toast.success("Arquivo processado com sucesso!");
      return data as AssistJurImportResult;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Erro na importação";
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  const publishData = async (uploadId: string): Promise<boolean> => {
    setIsPublishing(true);

    try {
      // Simular publicação por ora - implementação completa seria feita com RPC customizada
      toast.success(
        "Função de publicação será implementada com RPC customizada",
      );
      return true;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Erro na publicação";
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsPublishing(false);
    }
  };

  const downloadReport = async (uploadId: string): Promise<void> => {
    try {
      // Simular download - implementação seria com busca nos logs
      toast.success("Função de download será implementada");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Erro ao baixar relatório";
      toast.error(errorMessage);
    }
  };

  const exportData = async (uploadId: string): Promise<void> => {
    try {
      // Simular exportação - implementação seria com busca no staging
      toast.success("Função de exportação será implementada");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Erro ao exportar dados";
      toast.error(errorMessage);
    }
  };

  return {
    uploadFile,
    publishData,
    downloadReport,
    exportData,
    isUploading,
    isPublishing,
  };
}
