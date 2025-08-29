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
import { exportProcessosToCSV, exportTestemunhasToCSV, validateExportSize, estimateCSVSize } from "@/lib/csv";
import { PorProcesso, PorTestemunha } from "@/types/mapa-testemunhas";

// Type aliases for backward compatibility
type Processo = PorProcesso;
type Testemunha = PorTestemunha;
type ExportData = PorProcesso[] | PorTestemunha[];
import { toast } from "sonner";

interface ExportCsvButtonProps {
  data: ExportData;
  fileName?: string;
  disabled?: boolean;
}

export const ExportCsvButton = ({ 
  data, 
  fileName,
  disabled = false 
}: ExportCsvButtonProps) => {
  const [isExporting, setIsExporting] = useState(false);
  
  const isProcessoData = (data: ExportData): data is Processo[] => {
    return data.length > 0 && 'cnj' in data[0] && 'reclamante_limpo' in data[0];
  };
  
  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      const exportCount = data.length;
      const validation = validateExportSize(exportCount, false);
      
      if (!validation.isValid) {
        toast.error("Erro na exportação", {
          description: validation.message
        });
        return;
      }
      
      let exportedCount = 0;
      const defaultFileName = isProcessoData(data) ? "processos.csv" : "testemunhas.csv";
      
      if (isProcessoData(data)) {
        // Convert Processo[] to PorProcesso[] for compatibility
        const porProcessoData: PorProcesso[] = data.map(p => ({
          cnj: p.cnj,
          status: p.status || null,
          uf: p.uf || null,
          comarca: p.comarca || null,
          fase: p.fase || null,
          reclamante_limpo: p.reclamante_limpo || null,
          advogados_parte_ativa: p.advogados_parte_ativa || null,
          testemunhas_ativo_limpo: p.testemunhas_ativo_limpo || null,
          testemunhas_passivo_limpo: p.testemunhas_passivo_limpo || null,
          todas_testemunhas: p.todas_testemunhas || null,
          reclamante_foi_testemunha: p.reclamante_foi_testemunha || null,
          qtd_vezes_reclamante_foi_testemunha: p.qtd_vezes_reclamante_foi_testemunha || null,
          cnjs_em_que_reclamante_foi_testemunha: p.cnjs_em_que_reclamante_foi_testemunha || null,
          reclamante_testemunha_polo_passivo: p.reclamante_testemunha_polo_passivo || null,
          cnjs_passivo: p.cnjs_passivo || null,
          troca_direta: p.troca_direta || null,
          desenho_troca_direta: p.desenho_troca_direta || null,
          cnjs_troca_direta: p.cnjs_troca_direta || null,
          triangulacao_confirmada: p.triangulacao_confirmada || null,
          desenho_triangulacao: p.desenho_triangulacao || null,
          cnjs_triangulacao: p.cnjs_triangulacao || null,
          testemunha_do_reclamante_ja_foi_testemunha_antes: p.testemunha_do_reclamante_ja_foi_testemunha_antes || null,
          qtd_total_depos_unicos: p.qtd_total_depos_unicos || null,
          cnjs_depos_unicos: p.cnjs_depos_unicos || null,
          contem_prova_emprestada: p.contem_prova_emprestada || null,
          testemunhas_prova_emprestada: p.testemunhas_prova_emprestada || null,
          classificacao_final: p.classificacao_final || null,
          insight_estrategico: p.insight_estrategico || null,
          org_id: p.org_id || null,
          created_at: p.created_at || new Date().toISOString(),
          updated_at: p.updated_at || new Date().toISOString(),
        }));
        
        exportedCount = exportProcessosToCSV(porProcessoData, {
          filename: fileName || defaultFileName,
          maskPII: false,
          selectedOnly: false,
          selectedIds: []
        });
      } else {
        // Convert Testemunha[] to PorTestemunha[] for compatibility
        const porTestemunhaData: PorTestemunha[] = (data as Testemunha[]).map(t => ({
          nome_testemunha: t.nome_testemunha,
          qtd_depoimentos: t.qtd_depoimentos || null,
          cnjs_como_testemunha: t.cnjs_como_testemunha || null,
          ja_foi_reclamante: t.ja_foi_reclamante || null,
          cnjs_como_reclamante: t.cnjs_como_reclamante || null,
          foi_testemunha_ativo: t.foi_testemunha_ativo || null,
          cnjs_ativo: t.cnjs_ativo || null,
          foi_testemunha_passivo: t.foi_testemunha_passivo || null,
          cnjs_passivo: t.cnjs_passivo || null,
          foi_testemunha_em_ambos_polos: t.foi_testemunha_em_ambos_polos || null,
          participou_troca_favor: t.participou_troca_favor || null,
          cnjs_troca_favor: t.cnjs_troca_favor || null,
          participou_triangulacao: t.participou_triangulacao || null,
          cnjs_triangulacao: t.cnjs_triangulacao || null,
          e_prova_emprestada: t.e_prova_emprestada || null,
          classificacao: t.classificacao || null,
          classificacao_estrategica: t.classificacao_estrategica || null,
          org_id: t.org_id || null,
          created_at: t.created_at || new Date().toISOString(),
          updated_at: t.updated_at || new Date().toISOString(),
        }));
        
        exportedCount = exportTestemunhasToCSV(porTestemunhaData, {
          filename: fileName || defaultFileName,
          maskPII: false,
          selectedOnly: false,
          selectedIds: []
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
    const count = Math.min(data.length, 5000);
    const isProcesso = isProcessoData(data);
    
    return {
      count,
      size: estimateCSVSize(count, isProcesso)
    };
  };

  const summary = getExportSummary();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          disabled={disabled || isExporting || data.length === 0}
          className="gap-2"
          aria-label="Exportar dados como CSV"
        >
          {isExporting ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Download className="h-4 w-4" aria-hidden="true" />
          )}
          Exportar CSV
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
                {summary.count.toLocaleString()}
              </span>
            </div>
            <div className="text-xs text-muted-foreground">
              {summary.size}
            </div>
          </div>
        </DropdownMenuItem>
        
        {data.length > 5000 && (
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