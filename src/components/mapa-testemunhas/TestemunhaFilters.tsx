
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import { useMapaTestemunhasStore } from "@/lib/store/mapa-testemunhas";
import { TestemunhaFilters as TestemunhaFiltersType } from "@/types/mapa-testemunhas";

export function TestemunhaFilters() {
  const { testemunhaFilters, setTestemunhaFilters, resetFilters } = useMapaTestemunhasStore();

  const updateFilter = (key: keyof TestemunhaFiltersType, value: string | number | boolean | undefined) => {
    if (value === '' || value === undefined || value === 'TODOS') {
      const newFilters = { ...testemunhaFilters };
      delete newFilters[key];
      setTestemunhaFilters(newFilters);
    } else {
      setTestemunhaFilters({ [key]: value });
    }
  };

  const clearAllFilters = () => {
    resetFilters();
  };

  const hasActiveFilters = Object.keys(testemunhaFilters).length > 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Search className="h-5 w-5" />
          Filtros - Por Testemunha
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
            placeholder="Nome da testemunha..."
            value={testemunhaFilters.search || ''}
            onChange={(e) => updateFilter('search', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="ambosPolos">Em Ambos os Polos</Label>
          <Select
            value={testemunhaFilters.ambosPolos !== undefined ? testemunhaFilters.ambosPolos.toString() : 'TODOS'}
            onValueChange={(value) => updateFilter('ambosPolos', value === 'TODOS' ? undefined : value === 'true')}
          >
            <SelectTrigger id="ambosPolos">
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TODOS">Todos</SelectItem>
              <SelectItem value="true">Sim</SelectItem>
              <SelectItem value="false">Não</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="jaFoiReclamante">Já Foi Reclamante</Label>
          <Select
            value={testemunhaFilters.jaFoiReclamante !== undefined ? testemunhaFilters.jaFoiReclamante.toString() : 'TODOS'}
            onValueChange={(value) => updateFilter('jaFoiReclamante', value === 'TODOS' ? undefined : value === 'true')}
          >
            <SelectTrigger id="jaFoiReclamante">
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TODOS">Todos</SelectItem>
              <SelectItem value="true">Sim</SelectItem>
              <SelectItem value="false">Não</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="temTriangulacao">Participou Triangulação</Label>
          <Select
            value={testemunhaFilters.temTriangulacao !== undefined ? testemunhaFilters.temTriangulacao.toString() : 'TODOS'}
            onValueChange={(value) => updateFilter('temTriangulacao', value === 'TODOS' ? undefined : value === 'true')}
          >
            <SelectTrigger id="temTriangulacao">
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TODOS">Todos</SelectItem>
              <SelectItem value="true">Sim</SelectItem>
              <SelectItem value="false">Não</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="temTroca">Participou Troca</Label>
          <Select
            value={testemunhaFilters.temTroca !== undefined ? testemunhaFilters.temTroca.toString() : 'TODOS'}
            onValueChange={(value) => updateFilter('temTroca', value === 'TODOS' ? undefined : value === 'true')}
          >
            <SelectTrigger id="temTroca">
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TODOS">Todos</SelectItem>
              <SelectItem value="true">Sim</SelectItem>
              <SelectItem value="false">Não</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="qtdMin">Qtd Depoimentos (Mín)</Label>
          <Input
            id="qtdMin"
            type="number"
            placeholder="0"
            value={testemunhaFilters.qtdDeposMin || ''}
            onChange={(e) => updateFilter('qtdDeposMin', e.target.value ? Number(e.target.value) : undefined)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="qtdMax">Qtd Depoimentos (Máx)</Label>
          <Input
            id="qtdMax"
            type="number"
            placeholder="∞"
            value={testemunhaFilters.qtdDeposMax || ''}
            onChange={(e) => updateFilter('qtdDeposMax', e.target.value ? Number(e.target.value) : undefined)}
          />
        </div>
      </div>
    </div>
  );
}