import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  RotateCcw,
  Wrench,
  UserCheck,
  GitMerge,
  Trash2,
  FileSpreadsheet,
  Shield,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface BulkActionsProps {
  selectedCount: number;
  onRevalidate: () => void;
  onNormalizeCNJ: () => void;
  onFillDefaultReu?: () => void;
  onMergeDuplicates: () => void;
  onDelete: () => void;
  onExport: () => void;
  isLoading?: boolean;
  showTestemunhaActions?: boolean;
}

export function BulkActions({
  selectedCount,
  onRevalidate,
  onNormalizeCNJ,
  onFillDefaultReu,
  onMergeDuplicates,
  onDelete,
  onExport,
  isLoading = false,
  showTestemunhaActions = false,
}: BulkActionsProps) {
  if (selectedCount === 0) {
    return (
      <div className="flex items-center justify-between p-4 bg-muted/30 border rounded-lg">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Shield className="h-4 w-4" />
          Selecione registros para executar ações em massa
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onExport}
          className="gap-2"
        >
          <FileSpreadsheet className="h-4 w-4" />
          Exportar Todos
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between p-4 bg-primary/5 border border-primary/20 rounded-lg">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="bg-primary/10 text-primary border-primary/30"
          >
            {selectedCount} selecionado{selectedCount > 1 ? "s" : ""}
          </Badge>
        </div>

        <Separator orientation="vertical" className="h-6" />

        <div className="flex items-center gap-2">
          {/* Ações de Qualidade */}
          <Button
            variant="outline"
            size="sm"
            onClick={onRevalidate}
            disabled={isLoading}
            className="gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Revalidar
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onNormalizeCNJ}
            disabled={isLoading}
            className="gap-2"
          >
            <Wrench className="h-4 w-4" />
            Normalizar CNJ
          </Button>

          {/* Ação específica para Testemunhas */}
          {showTestemunhaActions && onFillDefaultReu && (
            <Button
              variant="outline"
              size="sm"
              onClick={onFillDefaultReu}
              disabled={isLoading}
              className="gap-2"
            >
              <UserCheck className="h-4 w-4" />
              Aplicar Réu Padrão
            </Button>
          )}

          <Separator orientation="vertical" className="h-6" />

          {/* Ações de Gestão */}
          <Button
            variant="outline"
            size="sm"
            onClick={onMergeDuplicates}
            disabled={isLoading}
            className="gap-2"
          >
            <GitMerge className="h-4 w-4" />
            Mesclar Duplicados
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onDelete}
            disabled={isLoading}
            className="gap-2 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
            Excluir
          </Button>
        </div>
      </div>

      <Button variant="outline" size="sm" onClick={onExport} className="gap-2">
        <FileSpreadsheet className="h-4 w-4" />
        Exportar Seleção
      </Button>
    </div>
  );
}

export default BulkActions;
