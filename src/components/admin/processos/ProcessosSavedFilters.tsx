import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { 
  Save, 
  X, 
  Filter,
  Star,
  Trash2
} from 'lucide-react';
import { ProcessoFiltersState } from '@/types/processos-explorer';
import { useToast } from '@/hooks/use-toast';

interface SavedFilter {
  id: string;
  name: string;
  filters: ProcessoFiltersState;
  createdAt: string;
}

interface ProcessosSavedFiltersProps {
  currentFilters: ProcessoFiltersState;
  onFiltersApply: (filters: ProcessoFiltersState) => void;
}

export function ProcessosSavedFilters({ 
  currentFilters, 
  onFiltersApply 
}: ProcessosSavedFiltersProps) {
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [filterName, setFilterName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const STORAGE_KEY = 'processos_saved_filters';

  // Carregar filtros salvos do localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setSavedFilters(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Erro ao carregar filtros salvos:', error);
    }
  }, []);

  // Salvar filtros no localStorage
  const saveToStorage = (filters: SavedFilter[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
      setSavedFilters(filters);
    } catch (error) {
      console.error('Erro ao salvar filtros:', error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar os filtros. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  // Verificar se há filtros ativos
  const hasActiveFilters = () => {
    return (
      currentFilters.search.trim() !== '' ||
      currentFilters.uf.length > 0 ||
      currentFilters.comarca.length > 0 ||
      currentFilters.status.length > 0 ||
      currentFilters.fase.length > 0 ||
      currentFilters.classificacao.length > 0 ||
      currentFilters.scoreRange[0] > 0 ||
      currentFilters.scoreRange[1] < 100 ||
      Object.values(currentFilters.flags).some(Boolean)
    );
  };

  // Salvar filtro atual
  const handleSaveFilter = async () => {
    if (!filterName.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Por favor, digite um nome para o filtro.",
        variant: "destructive",
      });
      return;
    }

    if (!hasActiveFilters()) {
      toast({
        title: "Nenhum filtro ativo",
        description: "Configure alguns filtros antes de salvar.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    try {
      const newFilter: SavedFilter = {
        id: Date.now().toString(),
        name: filterName.trim(),
        filters: { ...currentFilters },
        createdAt: new Date().toISOString()
      };

      const updatedFilters = [newFilter, ...savedFilters];
      saveToStorage(updatedFilters);

      toast({
        title: "Filtro salvo",
        description: `"${filterName}" foi salvo com sucesso.`,
      });

      setFilterName('');
      setIsPopoverOpen(false);
    } catch (error) {
      console.error('Erro ao salvar filtro:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Aplicar filtro salvo
  const handleApplyFilter = (savedFilter: SavedFilter) => {
    onFiltersApply(savedFilter.filters);
    toast({
      title: "Filtro aplicado",
      description: `Filtro "${savedFilter.name}" foi aplicado.`,
    });
  };

  // Excluir filtro salvo
  const handleDeleteFilter = (filterId: string) => {
    const updatedFilters = savedFilters.filter(f => f.id !== filterId);
    saveToStorage(updatedFilters);
    
    toast({
      title: "Filtro excluído",
      description: "O filtro foi removido com sucesso.",
    });
  };

  // Gerar resumo do filtro
  const getFilterSummary = (filters: ProcessoFiltersState): string => {
    const parts = [];
    
    if (filters.search) parts.push(`Busca: "${filters.search}"`);
    if (filters.uf.length > 0) parts.push(`UF: ${filters.uf.join(', ')}`);
    if (filters.status.length > 0) parts.push(`Status: ${filters.status.join(', ')}`);
    if (filters.classificacao.length > 0) parts.push(`Class.: ${filters.classificacao.join(', ')}`);
    
    const activeFlags = Object.entries(filters.flags)
      .filter(([_, active]) => active)
      .map(([key]) => key);
    if (activeFlags.length > 0) parts.push(`Flags: ${activeFlags.join(', ')}`);
    
    return parts.join(' • ') || 'Filtros diversos';
  };

  return (
    <div className="flex items-center gap-2">
      {/* Chips de filtros salvos */}
      {savedFilters.slice(0, 3).map((savedFilter) => (
        <div key={savedFilter.id} className="flex items-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleApplyFilter(savedFilter)}
            className="h-7 px-2 text-xs flex items-center gap-1"
          >
            <Star className="h-2.5 w-2.5" />
            {savedFilter.name}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDeleteFilter(savedFilter.id)}
            className="h-7 w-7 p-0 ml-1 hover:bg-destructive hover:text-destructive-foreground"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ))}

      {/* Botão Salvar Filtro */}
      <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            disabled={!hasActiveFilters()}
            className="h-7 px-2 text-xs flex items-center gap-1"
          >
            <Save className="h-3 w-3" />
            Salvar filtro
          </Button>
        </PopoverTrigger>
        
        <PopoverContent className="w-80" align="start">
          <div className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Salvar Filtro Atual</h4>
              <p className="text-xs text-muted-foreground">
                {getFilterSummary(currentFilters)}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="filter-name" className="text-xs">
                Nome do filtro
              </Label>
              <Input
                id="filter-name"
                value={filterName}
                onChange={(e) => setFilterName(e.target.value)}
                placeholder="Ex: Processos Alto Risco SP"
                className="h-8"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSaveFilter();
                  }
                }}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsPopoverOpen(false)}
                className="h-7 px-3 text-xs"
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={handleSaveFilter}
                disabled={isSaving || !filterName.trim()}
                className="h-7 px-3 text-xs"
              >
                {isSaving ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Mostrar mais filtros salvos se houver */}
      {savedFilters.length > 3 && (
        <Badge variant="outline" className="text-xs">
          +{savedFilters.length - 3} mais
        </Badge>
      )}
    </div>
  );
}