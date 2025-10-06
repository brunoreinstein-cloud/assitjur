import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, X, Save, Bookmark } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface SearchFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedSeverity: string[];
  onSeverityChange: (severity: string[]) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}

const severityOptions = [
  {
    value: "ERROR",
    label: "Erro",
    color: "bg-destructive text-destructive-foreground",
  },
  {
    value: "WARNING",
    label: "Atenção",
    color: "bg-warning text-warning-foreground",
  },
  { value: "INFO", label: "Info", color: "bg-primary text-primary-foreground" },
  { value: "OK", label: "OK", color: "bg-success text-success-foreground" },
];

export function SearchFilters({
  searchTerm,
  onSearchChange,
  selectedSeverity,
  onSeverityChange,
  onClearFilters,
  hasActiveFilters,
}: SearchFiltersProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const handleSeverityToggle = (severity: string) => {
    const newSeverity = selectedSeverity.includes(severity)
      ? selectedSeverity.filter((s) => s !== severity)
      : [...selectedSeverity, severity];
    onSeverityChange(newSeverity);
  };

  const removeSeverityFilter = (severity: string) => {
    onSeverityChange(selectedSeverity.filter((s) => s !== severity));
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por CNJ, reclamante, réu ou testemunha..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 pr-4 h-10"
        />
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="h-4 w-4" />
              Filtros
              {hasActiveFilters && (
                <Badge
                  variant="secondary"
                  className="ml-1 px-1.5 py-0.5 text-xs"
                >
                  {selectedSeverity.length}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-4" align="start">
            <div className="space-y-4">
              <h4 className="font-semibold text-sm">Filtrar por Severidade</h4>

              <div className="grid grid-cols-2 gap-2">
                {severityOptions.map((option) => (
                  <Button
                    key={option.value}
                    variant={
                      selectedSeverity.includes(option.value)
                        ? "default"
                        : "outline"
                    }
                    size="sm"
                    onClick={() => handleSeverityToggle(option.value)}
                    className="justify-start gap-2"
                  >
                    <div className={`w-2 h-2 rounded-full ${option.color}`} />
                    {option.label}
                  </Button>
                ))}
              </div>

              <div className="flex justify-between pt-2 border-t">
                <Button variant="ghost" size="sm" className="gap-2">
                  <Save className="h-4 w-4" />
                  Salvar Filtro
                </Button>
                <Button variant="ghost" size="sm" className="gap-2">
                  <Bookmark className="h-4 w-4" />
                  Filtros Salvos
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Active Filters */}
        {selectedSeverity.map((severity) => {
          const option = severityOptions.find((opt) => opt.value === severity);
          return (
            <Badge key={severity} variant="secondary" className="gap-1">
              <div className={`w-2 h-2 rounded-full ${option?.color}`} />
              {option?.label}
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 ml-1 hover:bg-transparent"
                onClick={() => removeSeverityFilter(severity)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          );
        })}

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="gap-2 text-muted-foreground"
          >
            <X className="h-4 w-4" />
            Limpar Filtros
          </Button>
        )}
      </div>
    </div>
  );
}

export default SearchFilters;
