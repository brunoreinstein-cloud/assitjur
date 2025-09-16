import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Edit, Trash2 } from "lucide-react";
import { PorProcesso } from "@/types/mapa-testemunhas";
import { ArrayField } from "@/components/mapa-testemunhas/ArrayField";
import { useMapaTestemunhasStore, selectColumnVisibility } from "@/lib/store/mapa-testemunhas";
import { applyPIIMask } from "@/utils/pii-mask";
import { RiskBadge } from "@/components/RiskBadge";
import { useUndoDelete } from "@/hooks/useUndoDelete";
import ConfirmDialog from "@/components/ui/confirm-dialog";

interface ProcessoTableProps {
  data: PorProcesso[];
}

export function ProcessoTable({ data }: ProcessoTableProps) {
  const { setSelectedProcesso, setIsDetailDrawerOpen, isPiiMasked, removeProcesso, restoreProcesso } = useMapaTestemunhasStore();
  const columnVisibility = useMapaTestemunhasStore(selectColumnVisibility).processos;
  const { remove } = useUndoDelete<PorProcesso>('Processo');
  const [toDelete, setToDelete] = useState<PorProcesso | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const handleViewDetail = (processo: PorProcesso) => {
    setSelectedProcesso(processo);
    setIsDetailDrawerOpen(true);
  };

  const requestDelete = (processo: PorProcesso) => {
    setToDelete(processo);
    setIsConfirmOpen(true);
  };

  const handleDelete = () => {
    if (toDelete) {
      remove({
        key: toDelete.cnj,
        label: toDelete.cnj,
        onDelete: () => removeProcesso(toDelete.cnj),
        onRestore: restoreProcesso,
      });
    }
    setIsConfirmOpen(false);
    setToDelete(null);
  };

  const getStatusColor = (status: string | null) => {
    switch (status?.toLowerCase()) {
      case 'ativo': return 'bg-success text-success-foreground';
      case 'arquivado': return 'bg-muted text-muted-foreground';
      case 'suspenso': return 'bg-warning text-warning-foreground';
      case 'baixado': return 'bg-secondary text-secondary-foreground';
      case 'cancelado': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  if (!data.length) {
    return (
      <div className="border border-border/50 rounded-2xl p-12 text-center">
        <div className="text-muted-foreground space-y-2">
          <p className="text-lg">Nenhum processo encontrado</p>
          <p className="text-sm">Ajuste os filtros ou importe dados via Excel</p>
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="border border-border/50 rounded-2xl overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30">
            {columnVisibility.cnj && <TableHead className="font-semibold">CNJ</TableHead>}
            {columnVisibility.uf && <TableHead className="font-semibold">UF</TableHead>}
            {columnVisibility.comarca && <TableHead className="font-semibold">Comarca</TableHead>}
            {columnVisibility.fase && <TableHead className="font-semibold">Fase</TableHead>}
            {columnVisibility.status && <TableHead className="font-semibold">Status</TableHead>}
            {columnVisibility.reclamante && <TableHead className="font-semibold">Reclamante</TableHead>}
            {columnVisibility.qtdDepos && <TableHead className="font-semibold">Qtd Depo Únicos</TableHead>}
            {columnVisibility.testemunhas && <TableHead className="font-semibold">Testemunhas Ativo</TableHead>}
            {columnVisibility.classificacao && <TableHead className="font-semibold">Classificação</TableHead>}
            {columnVisibility.acoes && <TableHead className="font-semibold text-center">Ações</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((processo) => (
            <TableRow key={processo.cnj} className="hover:bg-muted/20">
              {columnVisibility.cnj && (
                <TableCell className="font-mono text-sm">
                  {applyPIIMask(processo.cnj, isPiiMasked)}
                </TableCell>
              )}
              {columnVisibility.uf && (
                <TableCell>
                  <Badge variant="outline" className="text-xs">
                    {processo.uf}
                  </Badge>
                </TableCell>
              )}
              {columnVisibility.comarca && (
                <TableCell className="max-w-[150px] truncate" title={processo.comarca || ''}>
                  {applyPIIMask(processo.comarca, isPiiMasked) || '—'}
                </TableCell>
              )}
              {columnVisibility.fase && (
                <TableCell>
                  <Badge variant="secondary" className="text-xs">
                    {processo.fase || '—'}
                  </Badge>
                </TableCell>
              )}
              {columnVisibility.status && (
                <TableCell>
                  <Badge className={`text-xs ${getStatusColor(processo.status)}`}>
                    {processo.status || '—'}
                  </Badge>
                </TableCell>
              )}
              {columnVisibility.reclamante && (
                <TableCell className="max-w-[180px] truncate" title={processo.reclamante_limpo || ''}>
                  {applyPIIMask(processo.reclamante_limpo, isPiiMasked) || '—'}
                </TableCell>
              )}
              {columnVisibility.qtdDepos && (
                <TableCell className="text-center">
                  {processo.qtd_total_depos_unicos ? (
                    <RiskBadge score={processo.qtd_total_depos_unicos} />
                  ) : '—'}
                </TableCell>
              )}
              {columnVisibility.testemunhas && (
                <TableCell>
                  <ArrayField
                    items={processo.testemunhas_ativo_limpo}
                    maxVisible={2}
                    isPiiMasked={isPiiMasked}
                  />
                </TableCell>
              )}
              {columnVisibility.classificacao && (
                <TableCell>
                  <Badge
                    variant={processo.classificacao_final === 'ALTO RISCO' ? 'destructive' : 'secondary'}
                    className="text-xs"
                  >
                    {processo.classificacao_final || '—'}
                  </Badge>
                </TableCell>
              )}
              {columnVisibility.acoes && (
                <TableCell>
                  <div className="flex items-center justify-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewDetail(processo)}
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
                      onClick={() => requestDelete(processo)}
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
      title="Excluir processo?"
      description={toDelete ? `Deseja excluir o processo ${toDelete.cnj}?` : undefined}
      confirmText="Excluir"
      onConfirm={handleDelete}
      onCancel={() => { setIsConfirmOpen(false); setToDelete(null); }}
    />
    </>
  );
}