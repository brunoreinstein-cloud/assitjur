import React, { memo, useState, useEffect } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown, Eye, MoreHorizontal, FileText, Edit, Trash2, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ProcessoRow } from '@/types/processos-explorer';
import { TooltipWrapper } from '@/components/ui/tooltip-wrapper';
import { ProcessosClassificationChip } from '@/components/admin/processos/ProcessosClassificationChip';
import { formatDatePtBR, formatRelativeTime, formatCNJ } from '@/utils/date-formatter';

interface ProcessosGridProps {
  data: ProcessoRow[];
  selectedRows: Set<string>;
  onRowSelection: (id: string, selected: boolean) => void;
  onSelectAll: (selected: boolean) => void;
  onRowClick: (processo: ProcessoRow) => void;
  orderBy: string;
  orderDir: 'asc' | 'desc';
  onSort: (field: any, direction: 'asc' | 'desc') => void;
  isPiiMasked: boolean;
  onLoadMore: () => void;
  hasMore: boolean;
  isLoadingMore: boolean;
  total: number;
}

export const ProcessosGrid = memo(function ProcessosGrid({
  data,
  selectedRows,
  onRowSelection,
  onSelectAll,
  onRowClick,
  orderBy,
  orderDir,
  onSort,
  isPiiMasked,
  onLoadMore,
  hasMore,
  isLoadingMore,
  total
}: ProcessosGridProps) {
  // Ordenação persistente
  useEffect(() => {
    const savedSort = localStorage.getItem('processos_sort');
    if (savedSort) {
      try {
        const { field, direction } = JSON.parse(savedSort);
        if (field !== orderBy || direction !== orderDir) {
          onSort(field, direction);
        }
      } catch {
        // Ignore parsing errors
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('processos_sort', JSON.stringify({
      field: orderBy,
      direction: orderDir
    }));
  }, [orderBy, orderDir]);

  // Navigation por teclado
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target !== document.body) return;
      
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => Math.max(0, prev - 1));
          break;
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => Math.min(data.length - 1, prev + 1));
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedIndex >= 0 && data[selectedIndex]) {
            onRowClick(data[selectedIndex]);
          }
          break;
        case 'Escape':
          setSelectedIndex(-1);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [data, selectedIndex, onRowClick]);

  const isAllSelected = data.length > 0 && data.every(p => selectedRows.has(p.id));
  const isPartiallySelected = data.some(p => selectedRows.has(p.id)) && !isAllSelected;

  const handleSort = (field: string) => {
    const newDirection = orderBy === field && orderDir === 'asc' ? 'desc' : 'asc';
    onSort(field as any, newDirection);
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (orderBy !== field) {
      return <ChevronsUpDown className="h-4 w-4 text-muted-foreground/50" />;
    }
    return orderDir === 'asc' 
      ? <ChevronUp className="h-4 w-4 text-foreground" />
      : <ChevronDown className="h-4 w-4 text-foreground" />;
  };

  const maskPII = (text?: string) => {
    if (!isPiiMasked || !text) return text;
    if (text.length <= 4) return '***';
    return text.slice(0, 2) + '***' + text.slice(-2);
  };

  const truncateText = (text: string, maxLength: number = 30) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '…';
  };

  return (
    <div className="space-y-4">
      {/* Badge PII ON */}
      {isPiiMasked && (
        <div className="flex justify-end">
          <Badge 
            variant="secondary" 
            className="bg-indigo-100 text-indigo-800 border-indigo-200"
          >
            <Shield className="h-3 w-3 mr-1" />
            PII ON
          </Badge>
        </div>
      )}

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="w-12">
                <Checkbox
                  checked={isAllSelected}
                  ref={(el) => {
                    if (el) {
                      const input = el.querySelector('input') as HTMLInputElement;
                      if (input) input.indeterminate = isPartiallySelected;
                    }
                  }}
                  onCheckedChange={onSelectAll}
                  aria-label="Selecionar todos"
                />
              </TableHead>
              
              <TableHead className="min-w-[180px]">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort('cnj')}
                  className="font-semibold justify-start p-0 h-auto hover:bg-transparent"
                >
                  CNJ
                  <SortIcon field="cnj" />
                </Button>
              </TableHead>
              
              <TableHead>UF</TableHead>
              <TableHead>Comarca</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Fase</TableHead>
              <TableHead>Reclamante</TableHead>
              <TableHead>Réu</TableHead>
              
              <TableHead className="text-center">
                <Button
                  variant="ghost" 
                  size="sm"
                  onClick={() => handleSort('testemunhas_total')}
                  className="font-semibold p-0 h-auto hover:bg-transparent"
                >
                  Qtd Total
                  <SortIcon field="testemunhas_total" />
                </Button>
              </TableHead>
              
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm" 
                  onClick={() => handleSort('classificacao_final')}
                  className="font-semibold justify-start p-0 h-auto hover:bg-transparent"
                >
                  Classificação
                  <SortIcon field="classificacao_final" />
                </Button>
              </TableHead>
              
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort('updated_at')}
                  className="font-semibold justify-start p-0 h-auto hover:bg-transparent"
                >
                  Data
                  <SortIcon field="updated_at" />
                </Button>
              </TableHead>
              
              <TableHead className="w-16">Ações</TableHead>
            </TableRow>
          </TableHeader>
          
          <TableBody>
            {data.map((processo, index) => {
              const totalTestemunhas = (processo.testemunhas_ativo?.length || 0) + (processo.testemunhas_passivo?.length || 0);
              const reclamanteText = processo.reclamante_nome || '—';
              const reuText = processo.reu_nome || '—';
              
              const isRowSelected = selectedRows.has(processo.id);
              const isKeyboardSelected = selectedIndex === index;
              
              return (
                <TableRow
                  key={processo.id}
                  className={`
                    h-11 cursor-pointer transition-colors
                    ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}
                    ${isRowSelected ? 'bg-blue-50 border-blue-200' : ''}
                    ${isKeyboardSelected ? 'ring-2 ring-blue-500 ring-inset' : ''}
                    hover:bg-muted/80
                  `}
                  onClick={() => onRowClick(processo)}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={isRowSelected}
                      onCheckedChange={(checked) => onRowSelection(processo.id, !!checked)}
                      aria-label={`Selecionar processo ${processo.cnj}`}
                    />
                  </TableCell>
                  
                  <TableCell className="font-mono text-sm">
                    <TooltipWrapper content={formatCNJ(processo.cnj)}>
                      <span>{formatCNJ(processo.cnj)}</span>
                    </TooltipWrapper>
                  </TableCell>
                  
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {processo.uf || '—'}
                    </Badge>
                  </TableCell>
                  
                  <TableCell>
                    <TooltipWrapper content={processo.comarca}>
                      <span className="text-sm">{truncateText(processo.comarca || '—', 15)}</span>
                    </TooltipWrapper>
                  </TableCell>
                  
                  <TableCell>
                    <Badge variant="secondary" className="text-xs">
                      {processo.status || '—'}
                    </Badge>
                  </TableCell>
                  
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {processo.fase || '—'}
                    </Badge>
                  </TableCell>
                  
                  <TableCell>
                    <TooltipWrapper content={maskPII(reclamanteText)}>
                      <span className="text-sm">
                        {truncateText(maskPII(reclamanteText), 20)}
                      </span>
                    </TooltipWrapper>
                  </TableCell>
                  
                  <TableCell>
                    <TooltipWrapper content={maskPII(reuText)}>
                      <span className="text-sm">
                        {truncateText(maskPII(reuText), 20)}
                      </span>
                    </TooltipWrapper>
                  </TableCell>
                  
                  <TableCell className="text-center">
                    <Badge variant="secondary" className="font-mono text-xs">
                      {totalTestemunhas}
                    </Badge>
                  </TableCell>
                  
                  <TableCell>
                    <ProcessosClassificationChip processo={processo} />
                  </TableCell>
                  
                  <TableCell>
                    <TooltipWrapper content={`Atualizado ${formatRelativeTime(processo.updated_at)}`}>
                      <span className="text-xs text-muted-foreground">
                        {formatDatePtBR(processo.updated_at)}
                      </span>
                    </TooltipWrapper>
                  </TableCell>
                  
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onRowClick(processo)}>
                          <Eye className="h-4 w-4 mr-2" />
                          Ver detalhes
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <FileText className="h-4 w-4 mr-2" />
                          Abrir logs
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Shield className="h-4 w-4 mr-2" />
                          Mascarar PII (linha)
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Load More */}
      <div className="flex flex-col items-center justify-center gap-4 py-4">
        <span className="text-sm text-muted-foreground">
          Mostrando {data.length} de {total.toLocaleString('pt-BR')}
        </span>
        {hasMore && (
          <Button onClick={onLoadMore} disabled={isLoadingMore}>
            {isLoadingMore ? 'Carregando...' : 'Carregar mais'}
          </Button>
        )}
      </div>
    </div>
  );
});