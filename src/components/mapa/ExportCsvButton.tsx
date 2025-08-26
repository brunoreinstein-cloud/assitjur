import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Download, FileSpreadsheet, Loader2 } from "lucide-react";
import { useMapaStore } from "@/stores/useMapaStore";
import { exportProcessosToCSV, exportTestemunhasToCSV, validateExportSize, estimateCSVSize } from "@/lib/csv";
import { PorProcesso, PorTestemunha } from "@/types/mapa-testemunhas";
import { toast } from "sonner";

interface ExportCsvButtonProps {
  disabled?: boolean;
}

export const ExportCsvButton = ({ disabled = false }: ExportCsvButtonProps) => {
  const { 
    tab, 
    rows, 
    total, 
    selectedRows, 
    maskPII 
  } = useMapaStore();
  
  const [isExporting, setIsExporting] = useState(false);
  
  const hasSelection = selectedRows.length > 0;
  const isProcesso = tab === 'por-processo';
  
  const handleExport = async (selectedOnly: boolean = false) => {
    setIsExporting(true);
    
    try {
      const exportCount = selectedOnly ? selectedRows.length : total;
      const validation = validateExportSize(exportCount, selectedOnly);
      
      if (!validation.isValid) {
        toast.error("Erro na exportação", {
          description: validation.message
        });
        return;
      }
      
      let exportedCount = 0;
      
      if (isProcesso) {
        exportedCount = exportProcessosToCSV(rows as PorProcesso[], {
          maskPII,
          selectedOnly,
          selectedIds: selectedRows
        });
      } else {
        exportedCount = exportTestemunhasToCSV(rows as PorTestemunha[], {
          maskPII,
          selectedOnly,
          selectedIds: selectedRows
        });
      }
      
      toast.success("Exportação concluída!", {
        description: `${exportedCount} registros exportados com sucesso.`
      });
      
    } catch (error) {
      console.error('Export error:', error);
      toast.error("Erro na exportação", {
        description: "Não foi possível exportar os dados. Tente novamente."
      });
    } finally {
      setIsExporting(false);
    }
  };

  const getExportSummary = () => {
    const allCount = Math.min(total, 5000);
    const selectedCount = selectedRows.length;
    
    return {
      all: {
        count: allCount,
        size: estimateCSVSize(allCount, isProcesso)
      },
      selected: {
        count: selectedCount,
        size: estimateCSVSize(selectedCount, isProcesso)
      }
    };
  };

  const summary = getExportSummary();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          disabled={disabled || isExporting || total === 0}
          className="gap-2"
        >
          {isExporting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          Exportar CSV
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-3 py-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1 mb-1">
            <FileSpreadsheet className="h-3 w-3" />
            Exportar como CSV
          </div>
          {maskPII && (
            <div className="text-xs text-warning">
              ⚠️ PII será mascarado
            </div>
          )}
        </div>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem
          onClick={() => handleExport(false)}
          disabled={isExporting}
        >
          <div className="w-full">
            <div className="flex justify-between items-center">
              <span>Todos os registros</span>
              <span className="text-xs text-muted-foreground">
                {summary.all.count.toLocaleString()}
              </span>
            </div>
            <div className="text-xs text-muted-foreground">
              {summary.all.size}
            </div>
          </div>
        </DropdownMenuItem>
        
        {hasSelection && (
          <DropdownMenuItem
            onClick={() => handleExport(true)}
            disabled={isExporting}
          >
            <div className="w-full">
              <div className="flex justify-between items-center">
                <span>Registros selecionados</span>
                <span className="text-xs text-muted-foreground">
                  {summary.selected.count.toLocaleString()}
                </span>
              </div>
              <div className="text-xs text-muted-foreground">
                {summary.selected.size}
              </div>
            </div>
          </DropdownMenuItem>
        )}
        
        {total > 5000 && (
          <>
            <DropdownMenuSeparator />
            <div className="px-3 py-2 text-xs text-warning">
              ⚠️ Máximo de 5.000 registros por exportação
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};