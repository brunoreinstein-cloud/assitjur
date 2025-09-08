import { memo, useState, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Download, FileSpreadsheet, Loader2 } from "lucide-react";
import { 
  exportProcessosToCSV, 
  exportTestemunhasToCSV, 
  validateExportSize, 
  estimateCSVSize 
} from "@/lib/csv";
import { PorProcesso, PorTestemunha } from "@/types/mapa-testemunhas";
import { toast } from "sonner";

// ✅ Union type melhor que type aliases
type ExportableData = PorProcesso[] | PorTestemunha[];

interface ExportCsvButtonProps {
  data: ExportableData;
  fileName?: string;
  disabled?: boolean;
}

// ✅ Type guard mais robusto
const isProcessoData = (data: ExportableData): data is PorProcesso[] => {
  return data.length > 0 && 'cnj' in data[0] && 'reclamante_limpo' in data[0];
};

export const ExportCsvButton = memo<ExportCsvButtonProps>(({ 
  data, 
  fileName,
  disabled = false 
}) => {
  const [isExporting, setIsExporting] = useState(false);
  
  // ✅ Memoizar metadados de exportação
  const exportMetadata = useMemo(() => {
    const count = Math.min(data.length, 5000);
    const isProcesso = isProcessoData(data);
    const defaultFileName = isProcesso ? "processos.csv" : "testemunhas.csv";
    
    return {
      count,
      size: estimateCSVSize(count, isProcesso),
      defaultFileName,
      isProcesso,
      hasDataLimit: data.length > 5000
    };
  }, [data]);

  // ✅ Callback memoizado para exportação
  const handleExport = useCallback(async () => {
    if (isExporting) return;
    
    setIsExporting(true);
    
    try {
      const validation = validateExportSize(exportMetadata.count, false);
      
      if (!validation.isValid) {
        toast.error("Erro na exportação", {
          description: validation.message
        });
        return;
      }
      
      let exportedCount = 0;
      const finalFileName = fileName || exportMetadata.defaultFileName;
      
      if (exportMetadata.isProcesso) {
        const processosData = data as PorProcesso[];
        exportedCount = exportProcessosToCSV(processosData, {
          filename: finalFileName,
          maskPII: false,
          selectedOnly: false,
          selectedIds: []
        });
      } else {
        const testemunhasData = data as PorTestemunha[];
        exportedCount = exportTestemunhasToCSV(testemunhasData, {
          filename: finalFileName,
          maskPII: false,
          selectedOnly: false,
          selectedIds: []
        });
      }
      
      toast.success("Exportação concluída!", {
        description: `${exportedCount.toLocaleString()} registros exportados.`
      });
      
    } catch (error) {
      console.error('Export error:', error);
      toast.error("Erro na exportação", {
        description: "Não foi possível exportar os dados."
      });
    } finally {
      setIsExporting(false);
    }
  }, [data, fileName, exportMetadata, isExporting]);

  const isButtonDisabled = disabled || isExporting || data.length === 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          disabled={isButtonDisabled}
          className="gap-2"
          aria-label={`Exportar ${exportMetadata.count.toLocaleString()} registros como CSV`}
        >
          {isExporting ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Download className="h-4 w-4" aria-hidden="true" />
          )}
          {isExporting ? 'Exportando...' : 'Exportar CSV'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-3 py-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1 mb-1">
            <FileSpreadsheet className="h-3 w-3" aria-hidden="true" />
            Exportar como CSV
          </div>
        </div>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem
          onClick={handleExport}
          disabled={isExporting}
        >
          <div className="w-full">
            <div className="flex justify-between items-center">
              <span>Todos os registros</span>
              <span className="text-xs text-muted-foreground">
                {exportMetadata.count.toLocaleString()}
              </span>
            </div>
            <div className="text-xs text-muted-foreground">
              {exportMetadata.size}
            </div>
          </div>
        </DropdownMenuItem>
        
        {exportMetadata.hasDataLimit && (
          <>
            <DropdownMenuSeparator />
            <div className="px-3 py-2 text-xs text-warning" role="alert">
              ⚠️ Máximo de 5.000 registros por exportação
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
});

ExportCsvButton.displayName = 'ExportCsvButton';

