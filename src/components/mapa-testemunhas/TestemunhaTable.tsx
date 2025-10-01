import { useState, useCallback, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Edit, Trash2 } from "lucide-react";
import { PorTestemunha } from "@/types/mapa-testemunhas";
import { ArrayField } from "@/components/mapa-testemunhas/ArrayField";
import { BooleanIcon } from "@/components/mapa-testemunhas/BooleanIcon";
import { useMapaTestemunhasStore, selectColumnVisibility } from "@/lib/store/mapa-testemunhas";
import { applyPIIMask } from "@/utils/pii-mask";
import { DataState, DataStatus } from "@/components/ui/data-state";
import { useUndoDelete } from "@/hooks/useUndoDelete";
import ConfirmDialog from "@/components/ui/confirm-dialog";

interface TestemunhaTableProps {
  data: PorTestemunha[];
  status: DataStatus;
  onRetry?: () => void;
}

export function TestemunhaTable({ data, status, onRetry }: TestemunhaTableProps) {
  const { setSelectedTestemunha, setIsDetailDrawerOpen, isPiiMasked, removeTestemunha, restoreTestemunha } = useMapaTestemunhasStore();
  const columnVisibility = useMapaTestemunhasStore(selectColumnVisibility).testemunhas;
  const { remove } = useUndoDelete<PorTestemunha>('Testemunha');
  const [toDelete, setToDelete] = useState<PorTestemunha | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const handleViewDetail = useCallback((testemunha: PorTestemunha) => {
    setSelectedTestemunha(testemunha);
    setIsDetailDrawerOpen(true);
  }, [setSelectedTestemunha, setIsDetailDrawerOpen]);

  const getClassificacaoColor = (classificacao: string | null) => {
    const lower = classificacao?.toLowerCase() || '';
    
    // Handle values from database: "Alto", "Médio", "Comum", etc.
    if (lower.includes('alto') || lower === 'alto risco') {
      return 'bg-destructive text-destructive-foreground';
    }
    if (lower.includes('médio') || lower.includes('medio') || lower === 'médio risco') {
      return 'bg-warning text-warning-foreground';
    }
    if (lower.includes('baixo') || lower === 'baixo risco') {
      return 'bg-success text-success-foreground';
    }
    // "Comum" or "Normal" should be neutral
    if (lower === 'comum' || lower === 'normal') {
      return 'bg-muted text-muted-foreground';
    }
    return 'bg-muted text-muted-foreground';
  };

  if (status !== "success") {
    return <DataState status={status} onRetry={onRetry} />;
  }

  if (!data.length) {
    return <DataState status="empty" onRetry={onRetry} />;
  }

  const requestDelete = useCallback((t: PorTestemunha) => {
    setToDelete(t);
    setIsConfirmOpen(true);
  }, []);

  const handleDelete = useCallback(() => {
    if (toDelete) {
      remove({
        key: toDelete.nome_testemunha,
        label: toDelete.nome_testemunha,
        onDelete: () => removeTestemunha(toDelete.nome_testemunha),
        onRestore: restoreTestemunha,
      });
    }
    setIsConfirmOpen(false);
    setToDelete(null);
  }, [toDelete, remove, removeTestemunha, restoreTestemunha]);

  return (
    <>
    <div className="border border-border/50 rounded-2xl overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30">
            {columnVisibility.nome && <TableHead className="font-semibold">Nome da Testemunha</TableHead>}
            {columnVisibility.qtdDepo && <TableHead className="font-semibold text-center">Qtd Depoimentos</TableHead>}
            {columnVisibility.ambosPolos && <TableHead className="font-semibold text-center">Ambos os Polos</TableHead>}
            {columnVisibility.jaReclamante && <TableHead className="font-semibold text-center">Já Foi Reclamante</TableHead>}
            {columnVisibility.cnjs && <TableHead className="font-semibold">CNJs como Testemunha</TableHead>}
            {columnVisibility.classificacao && <TableHead className="font-semibold">Classificação Estratégica</TableHead>}
            {columnVisibility.acoes && <TableHead className="font-semibold text-center">Ações</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((testemunha) => (
            <TableRow key={testemunha.nome_testemunha} className="hover:bg-muted/20">
              {columnVisibility.nome && (
                <TableCell className="font-medium max-w-[200px] truncate" title={testemunha.nome_testemunha}>
                  {applyPIIMask(testemunha.nome_testemunha, isPiiMasked)}
                </TableCell>
              )}
              {columnVisibility.qtdDepo && (
                <TableCell className="text-center">
                  <Badge variant="secondary" className="text-xs">
                    {testemunha.qtd_depoimentos || 0}
                  </Badge>
                </TableCell>
              )}
              {columnVisibility.ambosPolos && (
                <TableCell className="text-center">
                  <BooleanIcon value={testemunha.foi_testemunha_em_ambos_polos} />
                </TableCell>
              )}
              {columnVisibility.jaReclamante && (
                <TableCell className="text-center">
                  <BooleanIcon value={testemunha.ja_foi_reclamante} />
                </TableCell>
              )}
              {columnVisibility.cnjs && (
                <TableCell>
                  <ArrayField
                    items={testemunha.cnjs_como_testemunha}
                    maxVisible={2}
                    isPiiMasked={isPiiMasked}
                  />
                </TableCell>
              )}
              {columnVisibility.classificacao && (
                <TableCell>
                  <Badge
                    className={`text-xs ${getClassificacaoColor(testemunha.classificacao || testemunha.classificacao_estrategica)}`}
                  >
                    {testemunha.classificacao || testemunha.classificacao_estrategica || '—'}
                  </Badge>
                </TableCell>
              )}
              {columnVisibility.acoes && (
                <TableCell>
                  <div className="flex items-center justify-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewDetail(testemunha)}
                      className="h-8 w-8 p-0"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      onClick={() => requestDelete(testemunha)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
    <ConfirmDialog
      open={isConfirmOpen}
      title="Excluir testemunha?"
      description={toDelete ? `Deseja excluir ${toDelete.nome_testemunha}?` : undefined}
      confirmText="Excluir"
      onConfirm={handleDelete}
      onCancel={() => { setIsConfirmOpen(false); setToDelete(null); }}
    />
    </>
  );
}