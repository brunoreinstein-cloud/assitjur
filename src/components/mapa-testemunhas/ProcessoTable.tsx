import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Edit, Trash2 } from "lucide-react";
import { PorProcesso } from "@/types/mapa-testemunhas";
import { ArrayField } from "./ArrayField";
import { useMapaTestemunhasStore } from "@/lib/store/mapa-testemunhas";
import { applyPIIMask } from "@/utils/pii-mask";
import { RiskBadge } from "@/components/RiskBadge";

interface ProcessoTableProps {
  data: PorProcesso[];
}

export function ProcessoTable({ data }: ProcessoTableProps) {
  const { setSelectedProcesso, setIsDetailDrawerOpen, isPiiMasked } = useMapaTestemunhasStore();

  const handleViewDetail = (processo: PorProcesso) => {
    setSelectedProcesso(processo);
    setIsDetailDrawerOpen(true);
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
    <div className="border border-border/50 rounded-2xl overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30">
            <TableHead className="font-semibold">CNJ</TableHead>
            <TableHead className="font-semibold">UF</TableHead>
            <TableHead className="font-semibold">Comarca</TableHead>
            <TableHead className="font-semibold">Fase</TableHead>
            <TableHead className="font-semibold">Status</TableHead>
            <TableHead className="font-semibold">Reclamante</TableHead>
            <TableHead className="font-semibold">Qtd Depo Únicos</TableHead>
            <TableHead className="font-semibold">Testemunhas Ativo</TableHead>
            <TableHead className="font-semibold">Classificação</TableHead>
            <TableHead className="font-semibold text-center">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((processo) => (
            <TableRow key={processo.cnj} className="hover:bg-muted/20">
              <TableCell className="font-mono text-sm">
                {applyPIIMask(processo.cnj, isPiiMasked)}
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="text-xs">
                  {processo.uf}
                </Badge>
              </TableCell>
              <TableCell className="max-w-[150px] truncate" title={processo.comarca || ''}>
                {applyPIIMask(processo.comarca, isPiiMasked) || '—'}
              </TableCell>
              <TableCell>
                <Badge variant="secondary" className="text-xs">
                  {processo.fase || '—'}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge 
                  className={`text-xs ${getStatusColor(processo.status)}`}
                >
                  {processo.status || '—'}
                </Badge>
              </TableCell>
              <TableCell className="max-w-[180px] truncate" title={processo.reclamante_limpo || ''}>
                {applyPIIMask(processo.reclamante_limpo, isPiiMasked) || '—'}
              </TableCell>
              <TableCell className="text-center">
                {processo.qtd_total_depos_unicos ? (
                  <RiskBadge score={processo.qtd_total_depos_unicos} />
                ) : '—'}
              </TableCell>
              <TableCell>
                <ArrayField 
                  items={processo.testemunhas_ativo_limpo} 
                  maxVisible={2}
                  isPiiMasked={isPiiMasked}
                />
              </TableCell>
              <TableCell>
                <Badge 
                  variant={processo.classificacao_final === 'ALTO RISCO' ? 'destructive' : 'secondary'}
                  className="text-xs"
                >
                  {processo.classificacao_final || '—'}
                </Badge>
              </TableCell>
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