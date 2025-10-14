import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Edit, Trash2 } from "lucide-react";
import { PorTestemunha } from "@/types/mapa-testemunhas";
import { ArrayField } from "@/components/mapa-testemunhas/ArrayField";
import { BooleanBadge } from "@/components/ui/boolean-badge";
import { ClassificationChip } from "@/components/ui/classification-chip";
import {
  useMapaTestemunhasStore,
  selectColumnVisibility,
} from "@/lib/store/mapa-testemunhas";
import { applyPIIMask } from "@/utils/pii-mask";
import { DataState, DataStatus } from "@/components/ui/data-state";
import { useUndoDelete } from "@/hooks/useUndoDelete";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import { tokens } from "@/components/ui/design-tokens";
import { cn } from "@/lib/utils";

interface TestemunhaTableProps {
  data: PorTestemunha[];
  status: DataStatus;
  onRetry?: () => void;
}

export function TestemunhaTable({
  data,
  status,
  onRetry,
}: TestemunhaTableProps) {
  const {
    setSelectedTestemunha,
    setIsDetailDrawerOpen,
    isPiiMasked,
    removeTestemunha,
    restoreTestemunha,
    density,
  } = useMapaTestemunhasStore();
  const columnVisibility = useMapaTestemunhasStore(
    selectColumnVisibility,
  ).testemunhas;
  const { remove } = useUndoDelete<PorTestemunha>("Testemunha");
  const [toDelete, setToDelete] = useState<PorTestemunha | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const densityClasses = tokens.density[density];

  // Virtualização simples baseada em altura fixa aproximada
  const ROW_HEIGHT = 56;
  const VISIBLE_COUNT = 40;
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [startIndex, setStartIndex] = useState(0);

  useEffect(() => {
    setStartIndex(0);
  }, [data.length]);

  const endIndex = Math.min(startIndex + VISIBLE_COUNT, data.length);
  const visibleData = useMemo(
    () => data.slice(startIndex, endIndex),
    [data, startIndex, endIndex],
  );

  const onScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const nextStart = Math.floor(el.scrollTop / ROW_HEIGHT);
    if (nextStart !== startIndex) setStartIndex(nextStart);
  }, [startIndex]);

  const handleViewDetail = useCallback(
    (testemunha: PorTestemunha) => {
      setSelectedTestemunha(testemunha);
      setIsDetailDrawerOpen(true);
    },
    [setSelectedTestemunha, setIsDetailDrawerOpen],
  );

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

  if (status !== "success") {
    return <DataState status={status} onRetry={onRetry} />;
  }

  if (!data.length) {
    return <DataState status="empty" onRetry={onRetry} />;
  }

  return (
    <>
      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="border border-border/50 rounded-2xl overflow-auto max-h-[70vh]"
      >
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              {columnVisibility.nome && (
                <TableHead className="font-semibold">
                  Nome da Testemunha
                </TableHead>
              )}
              {columnVisibility.qtdDepo && (
                <TableHead className="font-semibold text-center">
                  Qtd Depoimentos
                </TableHead>
              )}
              {columnVisibility.ambosPolos && (
                <TableHead className="font-semibold text-center">
                  Ambos os Polos
                </TableHead>
              )}
              {columnVisibility.jaReclamante && (
                <TableHead className="font-semibold text-center">
                  Já Foi Reclamante
                </TableHead>
              )}
              {columnVisibility.cnjs && (
                <TableHead className="font-semibold">
                  CNJs como Testemunha
                </TableHead>
              )}
              {columnVisibility.classificacao && (
                <TableHead className="font-semibold">
                  Classificação Estratégica
                </TableHead>
              )}
              {columnVisibility.acoes && (
                <TableHead className="font-semibold text-center">
                  Ações
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {startIndex > 0 && (
              <TableRow>
                <TableCell colSpan={12} style={{ height: startIndex * ROW_HEIGHT, padding: 0 }} />
              </TableRow>
            )}

            {visibleData.map((testemunha) => (
              <TableRow
                key={testemunha.nome_testemunha}
                className={cn("group hover:bg-muted/20", densityClasses.row)}
              >
                {columnVisibility.nome && (
                  <TableCell
                    className={cn(
                      "font-medium max-w-[200px] truncate",
                      densityClasses.cell,
                      densityClasses.text,
                    )}
                    title={testemunha.nome_testemunha}
                  >
                    {String(applyPIIMask(testemunha.nome_testemunha, isPiiMasked))}
                  </TableCell>
                )}
                {columnVisibility.qtdDepo && (
                  <TableCell className={cn("text-center", densityClasses.cell)}>
                    <Badge variant="secondary" className={densityClasses.badge}>
                      {testemunha.qtd_depoimentos || 0}
                    </Badge>
                  </TableCell>
                )}
                {columnVisibility.ambosPolos && (
                  <TableCell className={cn("text-center", densityClasses.cell)}>
                    <BooleanBadge
                      value={testemunha.foi_testemunha_em_ambos_polos}
                      size="sm"
                    />
                  </TableCell>
                )}
                {columnVisibility.jaReclamante && (
                  <TableCell className={cn("text-center", densityClasses.cell)}>
                    <BooleanBadge
                      value={testemunha.ja_foi_reclamante}
                      size="sm"
                    />
                  </TableCell>
                )}
                {columnVisibility.cnjs && (
                  <TableCell className={densityClasses.cell}>
                    <ArrayField
                      items={testemunha.cnjs_como_testemunha ?? null}
                      maxVisible={2}
                      isPiiMasked={isPiiMasked}
                    />
                  </TableCell>
                )}
                {columnVisibility.classificacao && (
                  <TableCell className={densityClasses.cell}>
                    <ClassificationChip
                      value={
                        testemunha.classificacao ||
                        testemunha.classificacao_estrategica
                      }
                      size="sm"
                    />
                  </TableCell>
                )}
                {columnVisibility.acoes && (
                  <TableCell className={densityClasses.cell}>
                    <div className="flex items-center justify-center gap-1">
                      {/* Eye: Primário (mais visível) */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDetail(testemunha)}
                        className={cn(
                          "p-0 text-primary hover:bg-primary/10 hover:text-primary",
                          densityClasses.button,
                        )}
                        title="Visualizar detalhes"
                      >
                        <Eye className={densityClasses.icon} strokeWidth={2} />
                      </Button>
                      {/* Edit: Secundário (menor) */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className={cn(
                          "p-0 text-muted-foreground hover:text-foreground hover:bg-muted",
                          densityClasses.button,
                        )}
                        title="Editar"
                      >
                        <Edit
                          className={densityClasses.icon}
                          strokeWidth={1.5}
                        />
                      </Button>
                      {/* Trash: Apenas visível em hover */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className={cn(
                          "p-0 opacity-0 group-hover:opacity-100 text-destructive hover:bg-destructive/10 hover:text-destructive transition-opacity",
                          densityClasses.button,
                        )}
                        onClick={() => requestDelete(testemunha)}
                        title="Excluir"
                      >
                        <Trash2
                          className={densityClasses.icon}
                          strokeWidth={1.5}
                        />
                      </Button>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}

            {endIndex < data.length && (
              <TableRow>
                <TableCell
                  colSpan={12}
                  style={{ height: (data.length - endIndex) * ROW_HEIGHT, padding: 0 }}
                />
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <ConfirmDialog
        open={isConfirmOpen}
        title="Excluir testemunha?"
        description={
          toDelete ? `Deseja excluir ${toDelete.nome_testemunha}?` : undefined
        }
        confirmText="Excluir"
        onConfirm={handleDelete}
        onCancel={() => {
          setIsConfirmOpen(false);
          setToDelete(null);
        }}
      />
    </>
  );
}
