import { useState, useCallback, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Edit, Trash2 } from "lucide-react";
import { PorTestemunha } from "@/types/mapa-testemunhas";
import { ArrayField } from "@/components/mapa-testemunhas/ArrayField";
import { BooleanBadge } from "@/components/ui/boolean-badge";
import { ClassificationChip } from "@/components/ui/classification-chip";
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
            <TableRow key={testemunha.nome_testemunha} className="group hover:bg-muted/20">
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
                  <BooleanBadge 
                    value={testemunha.foi_testemunha_em_ambos_polos}
                    size="sm"
                  />
                </TableCell>
              )}
              {columnVisibility.jaReclamante && (
                <TableCell className="text-center">
                  <BooleanBadge 
                    value={testemunha.ja_foi_reclamante}
                    size="sm"
                  />
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
                  <ClassificationChip 
                    value={testemunha.classificacao || testemunha.classificacao_estrategica}
                    size="sm"
                  />
                </TableCell>
              )}
              {columnVisibility.acoes && (
                <TableCell>
                  <div className="flex items-center justify-center gap-1">
                    {/* Eye: Primário (mais visível) */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewDetail(testemunha)}
                      className="h-8 w-8 p-0 text-primary hover:bg-primary/10 hover:text-primary"
                      title="Visualizar detalhes"
                    >
                      <Eye className="h-4 w-4" strokeWidth={2} />
                    </Button>
                    {/* Edit: Secundário (menor) */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground hover:bg-muted"
                      title="Editar"
                    >
                      <Edit className="h-3.5 w-3.5" strokeWidth={1.5} />
                    </Button>
                    {/* Trash: Apenas visível em hover */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 text-destructive hover:bg-destructive/10 hover:text-destructive transition-opacity"
                      onClick={() => requestDelete(testemunha)}
                      title="Excluir"
                    >
                      <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
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