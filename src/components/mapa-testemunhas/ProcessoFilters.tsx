
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import { useMapaTestemunhasStore } from "@/lib/store/mapa-testemunhas";
import { ProcessoFilters as ProcessoFiltersType } from "@/types/mapa-testemunhas";

const UF_OPTIONS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

const STATUS_OPTIONS = [
  'Ativo', 'Arquivado', 'Suspenso', 'Baixado', 'Cancelado'
];

const FASE_OPTIONS = [
  'Conhecimento', 'Execução', 'Recursal', 'Liquidação'
];

export function ProcessoFilters() {
  const { processoFilters, setProcessoFilters, resetFilters } = useMapaTestemunhasStore();

  const updateFilter = (key: keyof ProcessoFiltersType, value: string | number | undefined) => {
    if (value === '' || value === undefined || value === 'TODAS' || value === 'TODOS') {
      const newFilters = { ...processoFilters };
      delete newFilters[key];
      setProcessoFilters(newFilters);
    } else {
      setProcessoFilters({ [key]: value });
    }
  };

  const clearAllFilters = () => {
    resetFilters();
  };

  const hasActiveFilters = Object.keys(processoFilters).length > 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Search className="h-5 w-5" />
          Filtros - Por Processo
        </h3>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearAllFilters}>
            <X className="h-4 w-4 mr-1" />
            Limpar
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="search">Buscar</Label>
          <Input
            id="search"
            placeholder="CNJ, comarca, reclamante..."
            value={processoFilters.search || ''}
            onChange={(e) => updateFilter('search', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="testemunha">Testemunha</Label>
          <Input
            id="testemunha"
            placeholder="Nome da testemunha..."
            value={processoFilters.testemunha || ''}
            onChange={(e) => updateFilter('testemunha', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="uf">UF</Label>
          <Select
            value={processoFilters.uf || 'TODAS'}
            onValueChange={(value) => updateFilter('uf', value)}
          >
            <SelectTrigger id="uf">
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TODAS">Todas</SelectItem>
              {UF_OPTIONS.map((uf) => (
                <SelectItem key={uf} value={uf}>
                  {uf}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select
            value={processoFilters.status || 'TODOS'}
            onValueChange={(value) => updateFilter('status', value)}
          >
            <SelectTrigger id="status">
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TODOS">Todos</SelectItem>
              {STATUS_OPTIONS.map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="fase">Fase</Label>
          <Select
            value={processoFilters.fase || 'TODAS'}
            onValueChange={(value) => updateFilter('fase', value)}
          >
            <SelectTrigger id="fase">
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TODAS">Todas</SelectItem>
              {FASE_OPTIONS.map((fase) => (
                <SelectItem key={fase} value={fase}>
                  {fase}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="qtdMin">Qtd Depo Únicos (Mín)</Label>
          <Input
            id="qtdMin"
            type="number"
            placeholder="0"
            value={processoFilters.qtdDeposMin || ''}
            onChange={(e) => updateFilter('qtdDeposMin', e.target.value ? Number(e.target.value) : undefined)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="qtdMax">Qtd Depo Únicos (Máx)</Label>
          <Input
            id="qtdMax"
            type="number"
            placeholder="∞"
            value={processoFilters.qtdDeposMax || ''}
            onChange={(e) => updateFilter('qtdDeposMax', e.target.value ? Number(e.target.value) : undefined)}
          />
        </div>
      </div>
    </div>
  );
}