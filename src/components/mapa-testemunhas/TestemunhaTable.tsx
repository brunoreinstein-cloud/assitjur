import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Edit, Trash2, CheckCircle, XCircle, Undo2 } from "lucide-react";
import { PorTestemunha } from "@/types/mapa-testemunhas";
import { ArrayField } from "./ArrayField";
import { useMapaTestemunhasStore } from "@/lib/store/mapa-testemunhas";
import { applyPIIMask } from "@/utils/pii-mask";
import { DataState, DataStatus } from "@/components/ui/data-state";
import { useToast } from "@/hooks/use-toast";

interface TestemunhaTableProps {
  data: PorTestemunha[];
  status: DataStatus;
  onRetry?: () => void;
}

export function TestemunhaTable({ data, status, onRetry }: TestemunhaTableProps) {
  const { setSelectedTestemunha, setIsDetailDrawerOpen, isPiiMasked, removeTestemunha, restoreTestemunha } = useMapaTestemunhasStore();
  const { toast } = useToast();

  const handleViewDetail = (testemunha: PorTestemunha) => {
    setSelectedTestemunha(testemunha);
    setIsDetailDrawerOpen(true);
  };

  const BooleanIcon = ({ value }: { value: boolean | null }) => {
    if (value === null) return <span className="text-muted-foreground">—</span>;
    return value ? (
      <CheckCircle className="h-4 w-4 text-success" />
    ) : (
      <XCircle className="h-4 w-4 text-muted-foreground" />
    );
  };

  const getClassificacaoColor = (classificacao: string | null) => {
    switch (classificacao?.toLowerCase()) {
      case 'alto risco': return 'bg-destructive text-destructive-foreground';
      case 'médio risco': return 'bg-warning text-warning-foreground';
      case 'baixo risco': return 'bg-success text-success-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  if (status !== "success") {
    return <DataState status={status} onRetry={onRetry} />;
  }

  if (!data.length) {
    return <DataState status="empty" onRetry={onRetry} />;
  }

  const handleDelete = (t: PorTestemunha) => {
    const removed = removeTestemunha(t.nome_testemunha);
    const toastRes = toast({
      title: "Testemunha removida",
      description: (
        <div className="flex items-center justify-between">
          <span>{t.nome_testemunha}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (removed) restoreTestemunha(removed);
            }}
            className="ml-2 h-6 px-2 text-xs"
          >
            <Undo2 className="h-3 w-3 mr-1" />
            Desfazer
          </Button>
        </div>
      ),
      duration: 5000,
    });

    // ensure toast returns id to satisfy types (unused)
    return toastRes;
  };

  return (
    <div className="border border-border/50 rounded-2xl overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30">
            <TableHead className="font-semibold">Nome da Testemunha</TableHead>
            <TableHead className="font-semibold text-center">Qtd Depoimentos</TableHead>
            <TableHead className="font-semibold text-center">Ambos os Polos</TableHead>
            <TableHead className="font-semibold text-center">Já Foi Reclamante</TableHead>
            <TableHead className="font-semibold">CNJs como Testemunha</TableHead>
            <TableHead className="font-semibold">Classificação Estratégica</TableHead>
            <TableHead className="font-semibold text-center">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((testemunha) => (
            <TableRow key={testemunha.nome_testemunha} className="hover:bg-muted/20">
              <TableCell className="font-medium max-w-[200px] truncate" title={testemunha.nome_testemunha}>
                {applyPIIMask(testemunha.nome_testemunha, isPiiMasked)}
              </TableCell>
              <TableCell className="text-center">
                <Badge variant="secondary" className="text-xs">
                  {testemunha.qtd_depoimentos || 0}
                </Badge>
              </TableCell>
              <TableCell className="text-center">
                <BooleanIcon value={testemunha.foi_testemunha_em_ambos_polos} />
              </TableCell>
              <TableCell className="text-center">
                <BooleanIcon value={testemunha.ja_foi_reclamante} />
              </TableCell>
              <TableCell>
                <ArrayField 
                  items={testemunha.cnjs_como_testemunha} 
                  maxVisible={2}
                  isPiiMasked={isPiiMasked}
                />
              </TableCell>
              <TableCell>
                <Badge 
                  className={`text-xs ${getClassificacaoColor(testemunha.classificacao_estrategica)}`}
                >
                  {testemunha.classificacao_estrategica || '—'}
                </Badge>
              </TableCell>
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
                    onClick={() => handleDelete(testemunha)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}