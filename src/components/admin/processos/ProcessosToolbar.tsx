import React, { useMemo, useState } from 'react';
import { Search, Filter, SlidersHorizontal, X, Upload, Eye, EyeOff, Users, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { ProcessoFiltersState } from '@/types/processos-explorer';
import { useDebounce } from '@/hooks/useDebounce';
import { ProcessosSavedFilters } from './ProcessosSavedFilters';
import { ProcessosDeleteConfirmModal } from './ProcessosDeleteConfirmModal';

interface ProcessosToolbarProps {
  filters: ProcessoFiltersState;
  onFiltersChange: (filters: ProcessoFiltersState) => void;
  isPiiMasked: boolean;
  onPiiMaskChange: (masked: boolean) => void;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  onExport: () => void;
  selectedCount: number;
  totalCount: number;
  onBulkDelete?: () => void;
  processos?: any[];
}

const UF_OPTIONS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG',
  'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

const STATUS_OPTIONS = ['Ativo', 'Arquivado', 'Suspenso', 'Baixado'];
const FASE_OPTIONS = ['Conhecimento', 'Execução', 'Recursal', 'Liquidação'];
const CLASSIFICACAO_OPTIONS = ['Baixo', 'Médio', 'Alto'];

export function ProcessosToolbar({
  filters,
  onFiltersChange,
  isPiiMasked,
  onPiiMaskChange,
  hasActiveFilters,
  onClearFilters,
  onExport,
  selectedCount,
  totalCount,
  onBulkDelete,
  processos = []
}: ProcessosToolbarProps) {
  const [searchTerm, setSearchTerm] = useState(filters.search);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const debouncedSearch = useDebounce(searchTerm, 300);

  // Debounced search effect  
  React.useEffect(() => {
    onFiltersChange({ ...filters, search: debouncedSearch });
  }, [debouncedSearch]);

  const updateFilters = (updates: Partial<ProcessoFiltersState>) => {
    onFiltersChange({ ...filters, ...updates });
  };

  const toggleFlag = (flag: keyof ProcessoFiltersState['flags']) => {
    updateFilters({
      flags: { ...filters.flags, [flag]: !filters.flags[flag] }
    });
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.search.trim()) count++;
    if (filters.uf.length > 0) count++;
    if (filters.status.length > 0) count++;
    if (filters.fase.length > 0) count++;
    if (filters.classificacao.length > 0) count++;
    if (filters.scoreRange[0] > 0 || filters.scoreRange[1] < 100) count++;
    if (Object.values(filters.flags).some(Boolean)) count++;
    return count;
  }, [filters]);

  const handleBulkDelete = async () => {
    setIsDeleting(true);
    try {
      if (onBulkDelete) {
        await onBulkDelete();
      }
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Main Toolbar */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        {/* Search and Quick Filters */}
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por CNJ, Reclamante, Réu..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Filtro de Testemunhas Rápido */}
          <Select
            value={filters.search.includes('testemunhas:') ? filters.search.split('testemunhas:')[1] : 'todas'}
            onValueChange={(value) => {
              if (value === 'todas') {
                updateFilters({ search: filters.search.replace(/testemunhas:\w+/g, '').trim() });
              } else {
                const cleanSearch = filters.search.replace(/testemunhas:\w+/g, '').trim();
                updateFilters({ search: `${cleanSearch} testemunhas:${value}`.trim() });
              }
            }}
          >
            <SelectTrigger className="w-40">
              <Users className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas</SelectItem>
              <SelectItem value="ativas">Ativas</SelectItem>
              <SelectItem value="passivas">Passivas</SelectItem>
              <SelectItem value="0">Sem testemunhas</SelectItem>
            </SelectContent>
          </Select>

          {/* Advanced Filters */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="relative">
                <Filter className="h-4 w-4 mr-2" />
                Filtros
                {activeFiltersCount > 0 && (
                  <Badge 
                    variant="secondary" 
                    className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                  >
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-96 p-6" align="start">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Filtros Avançados</h4>
                  {hasActiveFilters && (
                    <Button variant="ghost" size="sm" onClick={onClearFilters}>
                      <X className="h-4 w-4 mr-1" />
                      Limpar
                    </Button>
                  )}
                </div>

                {/* UF Filter */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">UF</Label>
                  <Select
                    value={filters.uf[0] || ''}
                    onValueChange={(value) => updateFilters({ uf: value ? [value] : [] })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um estado" />
                    </SelectTrigger>
                    <SelectContent>
                      {UF_OPTIONS.map((uf) => (
                        <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Status Filter */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Status</Label>
                  <Select
                    value={filters.status[0] || ''}
                    onValueChange={(value) => updateFilters({ status: value ? [value] : [] })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um status" />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((status) => (
                        <SelectItem key={status} value={status}>{status}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Fase Filter */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Fase</Label>
                  <Select
                    value={filters.fase[0] || ''}
                    onValueChange={(value) => updateFilters({ fase: value ? [value] : [] })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma fase" />
                    </SelectTrigger>
                    <SelectContent>
                      {FASE_OPTIONS.map((fase) => (
                        <SelectItem key={fase} value={fase}>{fase}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Classificação Filter */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Classificação</Label>
                  <Select
                    value={filters.classificacao[0] || ''}
                    onValueChange={(value) => updateFilters({ classificacao: value ? [value] : [] })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma classificação" />
                    </SelectTrigger>
                    <SelectContent>
                      {CLASSIFICACAO_OPTIONS.map((class_) => (
                        <SelectItem key={class_} value={class_}>{class_}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Score Range */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">
                    Score de Risco ({filters.scoreRange[0]} - {filters.scoreRange[1]})
                  </Label>
                  <Slider
                    value={filters.scoreRange}
                    onValueChange={(value) => updateFilters({ scoreRange: value as [number, number] })}
                    max={100}
                    min={0}
                    step={5}
                    className="w-full"
                  />
                </div>

                {/* Flags */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Flags de Risco</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="triangulacao"
                        checked={filters.flags.triangulacao}
                        onCheckedChange={() => toggleFlag('triangulacao')}
                      />
                      <Label htmlFor="triangulacao" className="text-sm cursor-pointer">
                        Triangulação
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="troca"
                        checked={filters.flags.troca}
                        onCheckedChange={() => toggleFlag('troca')}
                      />
                      <Label htmlFor="troca" className="text-sm cursor-pointer">
                        Troca Direta
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="prova"
                        checked={filters.flags.prova}
                        onCheckedChange={() => toggleFlag('prova')}
                      />
                      <Label htmlFor="prova" className="text-sm cursor-pointer">
                        Prova Emprestada
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="duplo"
                        checked={filters.flags.duplo}
                        onCheckedChange={() => toggleFlag('duplo')}
                      />
                      <Label htmlFor="duplo" className="text-sm cursor-pointer">
                        Duplo Papel
                      </Label>
                    </div>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* PII Mask Toggle */}
          <div className="flex items-center gap-2 px-3 py-2 border rounded-lg bg-background">
            <Label htmlFor="pii-mask" className="text-sm font-medium cursor-pointer">
              PII: {isPiiMasked ? 'ON' : 'OFF'}
            </Label>
            <Switch
              id="pii-mask"
              checked={isPiiMasked}
              onCheckedChange={onPiiMaskChange}
            />
          </div>

          <Button variant="outline" onClick={onExport}>
            <Upload className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>

          {/* Mais Ações Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => setIsDeleteModalOpen(true)}
                className="text-destructive focus:text-destructive"
              >
                Excluir Todos os Processos
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Filtros Salvos */}
      <ProcessosSavedFilters
        currentFilters={filters}
        onFiltersApply={onFiltersChange}
      />

      {/* Active Filters Chips */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Filtros ativos:</span>
          
          {filters.search.trim() && (
            <Badge variant="secondary" className="gap-1">
              <Search className="h-3 w-3" />
              "{filters.search}"
              <button
                onClick={() => {
                  setSearchTerm('');
                  updateFilters({ search: '' });
                }}
                className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          {filters.uf.map((uf) => (
            <Badge key={uf} variant="secondary" className="gap-1">
              UF: {uf}
              <button
                onClick={() => updateFilters({ uf: filters.uf.filter(u => u !== uf) })}
                className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}

          {filters.status.map((status) => (
            <Badge key={status} variant="secondary" className="gap-1">
              Status: {status}
              <button
                onClick={() => updateFilters({ status: filters.status.filter(s => s !== status) })}
                className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}

          {/* Flags chips */}
          {Object.entries(filters.flags)
            .filter(([_, active]) => active)
            .map(([flag]) => (
              <Badge key={flag} variant="secondary" className="gap-1">
                {flag === 'triangulacao' && 'Triangulação'}
                {flag === 'troca' && 'Troca Direta'}
                {flag === 'prova' && 'Prova Emprestada'}
                {flag === 'duplo' && 'Duplo Papel'}
                <button
                  onClick={() => toggleFlag(flag as keyof ProcessoFiltersState['flags'])}
                  className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}

          <Button variant="ghost" size="sm" onClick={onClearFilters}>
            <X className="h-4 w-4 mr-1" />
            Limpar Todos
          </Button>
        </div>
      )}

      {/* Status Bar */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div>
          {selectedCount > 0 ? (
            <span className="font-medium">
              {selectedCount} de {totalCount} processos selecionados
            </span>
          ) : (
            <span>
              {totalCount.toLocaleString('pt-BR')} processos encontrados
            </span>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ProcessosDeleteConfirmModal
        open={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleBulkDelete}
        processos={processos}
        isDeleting={isDeleting}
      />
    </div>
  );
}