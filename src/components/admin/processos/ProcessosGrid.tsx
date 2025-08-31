import React, { useMemo, memo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Eye, 
  ChevronUp, 
  ChevronDown,
  ArrowUpDown,
  Triangle,
  ArrowRightLeft,
  FileX,
  Users
} from 'lucide-react';
import { ProcessoRow } from '@/types/processos-explorer';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface ProcessosGridProps {
  data: ProcessoRow[];
  selectedRows: Set<string>;
  onRowSelection: (id: string, selected: boolean) => void;
  onSelectAll: (selected: boolean) => void;
  onRowClick: (processo: ProcessoRow) => void;
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  orderBy: string;
  orderDir: 'asc' | 'desc';
  onSort: (field: any, direction: 'asc' | 'desc') => void;
  isPiiMasked: boolean;
}

export const ProcessosGrid = memo(function ProcessosGrid({
  data,
  selectedRows,
  onRowSelection,
  onSelectAll,
  onRowClick,
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  orderBy,
  orderDir,
  onSort,
  isPiiMasked
}: ProcessosGridProps) {
  
  const isAllSelected = data.length > 0 && selectedRows.size === data.length;
  const isPartiallySelected = selectedRows.size > 0 && selectedRows.size < data.length;

  const handleSort = (field: string) => {
    if (orderBy === field) {
      onSort(field, orderDir === 'asc' ? 'desc' : 'asc');
    } else {
      onSort(field, 'asc');
    }
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (orderBy !== field) {
      return <ArrowUpDown className="h-4 w-4 text-muted-foreground" />;
    }
    return orderDir === 'asc' ? 
      <ChevronUp className="h-4 w-4" /> : 
      <ChevronDown className="h-4 w-4" />;
  };

  const getClassificacaoColor = (classificacao?: string) => {
    switch (classificacao?.toLowerCase()) {
      case 'alto':
        return 'destructive';
      case 'médio':
        return 'outline';
      case 'baixo':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const maskPII = (text?: string) => {
    if (!isPiiMasked || !text) return text;
    // Simple masking - first 2 chars + *** + last 2 chars
    if (text.length <= 4) return '***';
    return text.slice(0, 2) + '***' + text.slice(-2);
  };

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'dd/MM/yy HH:mm', { locale: ptBR });
    } catch {
      return dateStr;
    }
  };

  const formatCNJ = (cnj?: string) => {
    if (!cnj) return 'N/A';
    if (cnj.length === 20) {
      return `${cnj.slice(0, 7)}-${cnj.slice(7, 9)}.${cnj.slice(9, 13)}.${cnj.slice(13, 14)}.${cnj.slice(14, 16)}.${cnj.slice(16, 20)}`;
    }
    return cnj;
  };

  // Calculate pagination info
  const totalPages = Math.ceil(total / pageSize);
  const startRecord = ((page - 1) * pageSize) + 1;
  const endRecord = Math.min(page * pageSize, total);

  return (
    <div className="space-y-4">
      {/* Grid */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={onSelectAll}
                />
              </TableHead>
              
              <TableHead className="min-w-[180px]">
                <Button
                  variant="ghost"
                  className="h-auto p-0 font-semibold"
                  onClick={() => handleSort('cnj')}
                >
                  CNJ
                  <SortIcon field="cnj" />
                </Button>
              </TableHead>
              
              <TableHead>
                <Button
                  variant="ghost"
                  className="h-auto p-0 font-semibold"
                  onClick={() => handleSort('uf')}
                >
                  UF
                  <SortIcon field="uf" />
                </Button>
              </TableHead>
              
              <TableHead>
                <Button
                  variant="ghost"
                  className="h-auto p-0 font-semibold"
                  onClick={() => handleSort('comarca')}
                >
                  Comarca
                  <SortIcon field="comarca" />
                </Button>
              </TableHead>
              
              <TableHead>Status</TableHead>
              <TableHead>Fase</TableHead>
              <TableHead>Advogado Ativo</TableHead>
              <TableHead className="text-center"># Test.</TableHead>
              
              <TableHead>
                <Button
                  variant="ghost"
                  className="h-auto p-0 font-semibold"
                  onClick={() => handleSort('classificacao_final')}
                >
                  Classificação
                  <SortIcon field="classificacao_final" />
                </Button>
              </TableHead>
              
              <TableHead className="text-center">
                <Button
                  variant="ghost"
                  className="h-auto p-0 font-semibold"
                  onClick={() => handleSort('score_risco')}
                >
                  Score
                  <SortIcon field="score_risco" />
                </Button>
              </TableHead>
              
              <TableHead className="text-center">Flags</TableHead>
              
              <TableHead>
                <Button
                  variant="ghost"
                  className="h-auto p-0 font-semibold"
                  onClick={() => handleSort('updated_at')}
                >
                  Atualizado Em
                  <SortIcon field="updated_at" />
                </Button>
              </TableHead>
              
              <TableHead className="w-20">Ações</TableHead>
            </TableRow>
          </TableHeader>
          
          <TableBody>
            {data.map((processo) => {
              const isSelected = selectedRows.has(processo.id);
              const advPrincipal = processo.advogados_ativo?.[0];
              const totalTestemunhas = (processo.testemunhas_ativo?.length || 0) + (processo.testemunhas_passivo?.length || 0);
              
              return (
                <TableRow 
                  key={processo.id}
                  className={cn(
                    "cursor-pointer hover:bg-muted/50 transition-colors",
                    isSelected && "bg-muted/50 border-l-2 border-l-primary"
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    onRowClick(processo);
                  }}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(checked) => onRowSelection(processo.id, !!checked)}
                    />
                  </TableCell>
                  
                  <TableCell className="font-mono text-sm">
                    <div className="space-y-1">
                      <div>{formatCNJ(processo.cnj)}</div>
                      {processo.cnj_digits?.length !== 20 && (
                        <Badge variant="destructive" className="text-xs">
                          CNJ Inválido
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <Badge variant="outline" className="font-mono">
                      {processo.uf || '—'}
                    </Badge>
                  </TableCell>
                  
                  <TableCell>
                    <div className="max-w-[200px] truncate" title={processo.comarca || ''}>
                      {processo.comarca || '—'}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    {processo.status && (
                      <Badge variant="outline" className="text-xs">
                        {processo.status}
                      </Badge>
                    )}
                  </TableCell>
                  
                  <TableCell>
                    {processo.fase && (
                      <Badge variant="outline" className="text-xs">
                        {processo.fase}
                      </Badge>
                    )}
                  </TableCell>
                  
                  <TableCell>
                    <div className="max-w-[150px] truncate" title={advPrincipal || ''}>
                      {maskPII(advPrincipal) || '—'}
                    </div>
                    {(processo.advogados_ativo?.length || 0) > 1 && (
                      <div className="text-xs text-muted-foreground">
                        +{(processo.advogados_ativo?.length || 0) - 1} mais
                      </div>
                    )}
                  </TableCell>
                  
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{totalTestemunhas}</span>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    {processo.classificacao_final && (
                      <Badge variant={getClassificacaoColor(processo.classificacao_final)}>
                        {processo.classificacao_final}
                      </Badge>
                    )}
                  </TableCell>
                  
                  <TableCell className="text-center">
                    <div className="font-mono font-bold">
                      {processo.score_risco || '—'}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-1 flex-wrap">
                      {processo.triangulacao_confirmada && (
                        <Badge key={`${processo.id}-triangulacao`} variant="outline" className="text-xs gap-1 bg-purple-50 text-purple-700 border-purple-200">
                          <Triangle className="h-3 w-3" />
                          Triang.
                        </Badge>
                      )}
                      {processo.troca_direta && (
                        <Badge key={`${processo.id}-troca`} variant="outline" className="text-xs gap-1 bg-amber-50 text-amber-700 border-amber-200">
                          <ArrowRightLeft className="h-3 w-3" />
                          Troca
                        </Badge>
                      )}
                      {processo.prova_emprestada && (
                        <Badge key={`${processo.id}-prova`} variant="destructive" className="text-xs gap-1">
                          <FileX className="h-3 w-3" />
                          Prova
                        </Badge>
                      )}
                      {processo.reclamante_foi_testemunha && (
                        <Badge key={`${processo.id}-duplo`} variant="outline" className="text-xs gap-1 bg-sky-50 text-sky-700 border-sky-200">
                          <Users className="h-3 w-3" />
                          Duplo
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDate(processo.updated_at)}
                  </TableCell>
                  
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="sm" onClick={() => onRowClick(processo)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Mostrando {startRecord}-{endRecord} de {total} registros</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="border rounded px-2 py-1 text-sm"
          >
            <option key="25" value={25}>25 por página</option>
            <option key="50" value={50}>50 por página</option>
            <option key="100" value={100}>100 por página</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
          >
            Anterior
          </Button>
          
          <span className="text-sm">
            Página {page} de {totalPages}
          </span>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
          >
            Próxima
          </Button>
        </div>
      </div>
    </div>
  );
});