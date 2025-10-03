import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  FileText,
  Users,
  MapPin,
  Briefcase,
  ExternalLink,
  Copy,
  Filter,
  Loader2,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useUnifiedSearch } from "@/hooks/useUnifiedSearch";
import { useToast } from "@/hooks/use-toast";
import type { SearchScope, SearchEntityType } from "@/types/search";
import {
  SEARCH_PLACEHOLDERS,
  ENTITY_TYPE_LABELS,
  ENTITY_TYPE_COLORS,
} from "@/types/search";

const ENTITY_ICONS: Record<SearchEntityType, any> = {
  process: FileText,
  witness: Users,
  claimant: Users,
  lawyer: Briefcase,
  comarca: MapPin,
};

export const UnifiedSearch = () => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [scope, setScope] = useState<SearchScope>("all");
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const navigate = useNavigate();
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);

  const { data, isLoading } = useUnifiedSearch(searchQuery, scope, open);

  // Rotação de placeholders
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % SEARCH_PLACEHOLDERS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Atalho de teclado
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === "k" || e.key === "/") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
      if (e.key === "Escape" && open) {
        setSearchQuery("");
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open]);

  const handleSelect = (result: any) => {
    setOpen(false);

    switch (result.type) {
      case "process":
        navigate(
          `/dados/mapa?tab=por-processo&cnj=${encodeURIComponent(result.title)}`,
        );
        break;
      case "witness":
        navigate(
          `/dados/mapa?tab=por-testemunha&nome=${encodeURIComponent(result.title)}`,
        );
        break;
      case "claimant":
        navigate(
          `/dados/mapa?tab=por-processo&reclamante=${encodeURIComponent(result.title)}`,
        );
        break;
      default:
        toast({
          title: "Em desenvolvimento",
          description: `Visualização de ${result.type} em breve`,
        });
    }
  };

  const handleCopyCNJ = (cnj: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(cnj);
    toast({
      title: "CNJ copiado",
      description: cnj,
    });
  };

  const handleFilterByUF = (uf: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/dados/mapa?tab=por-processo&uf=${uf}`);
    setOpen(false);
  };

  const scopeChips = [
    { value: "all" as SearchScope, label: "Tudo", icon: Search },
    { value: "process" as SearchScope, label: "Processos", icon: FileText },
    { value: "witness" as SearchScope, label: "Testemunhas", icon: Users },
    { value: "claimant" as SearchScope, label: "Reclamantes", icon: Users },
  ];

  return (
    <>
      <Button
        variant="outline"
        className="w-full max-w-sm justify-start text-sm text-muted-foreground"
        onClick={() => setOpen(true)}
      >
        <Search className="mr-2 h-4 w-4" />
        {SEARCH_PLACEHOLDERS[placeholderIndex]}
        <kbd className="pointer-events-none ml-auto inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          ref={inputRef}
          placeholder="Digite nome, CNJ, CPF... Ex: risco:alto João da Silva"
          value={searchQuery}
          onValueChange={setSearchQuery}
        />

        {/* Chips de escopo com ícones */}
        {searchQuery && (
          <div className="flex gap-2 px-3 py-2 border-b">
            {scopeChips.map((chip) => {
              const ChipIcon = chip.icon;
              return (
                <Button
                  key={chip.value}
                  variant={scope === chip.value ? "default" : "outline"}
                  size="sm"
                  className="h-7 text-xs gap-1.5"
                  onClick={() => setScope(chip.value)}
                >
                  <ChipIcon className="h-3 w-3" strokeWidth={1.5} />
                  {chip.label}
                </Button>
              );
            })}
          </div>
        )}

        <CommandList>
          {isLoading && (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {!isLoading && searchQuery && searchQuery.length >= 2 && (
            <>
              {data?.results.length === 0 && (
                <CommandEmpty>
                  <div className="text-center py-6">
                    <p className="text-sm text-muted-foreground">
                      Nenhum resultado encontrado.
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Tente usar operadores:{" "}
                      <code className="bg-muted px-1 rounded">p:</code>{" "}
                      <code className="bg-muted px-1 rounded">w:</code>{" "}
                      <code className="bg-muted px-1 rounded">uf:RS</code>
                    </p>
                  </div>
                </CommandEmpty>
              )}

              {data?.results && data.results.length > 0 && (
                <>
                  {/* Agrupar por tipo */}
                  {["process", "witness", "claimant"].map((type) => {
                    const items = data.results.filter((r) => r.type === type);
                    if (items.length === 0) return null;

                    const Icon = ENTITY_ICONS[type as SearchEntityType];

                    return (
                      <CommandGroup
                        key={type}
                        heading={ENTITY_TYPE_LABELS[type as SearchEntityType]}
                      >
                        {items.map((result) => (
                          <CommandItem
                            key={result.id}
                            onSelect={() => handleSelect(result)}
                            className="flex items-start gap-3 py-3"
                          >
                            <div className="mt-0.5">
                              <Icon className="h-4 w-4 text-muted-foreground" />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium truncate">
                                  {result.title}
                                </span>
                                <Badge
                                  variant="secondary"
                                  className={`text-[10px] px-1.5 py-0 ${
                                    ENTITY_TYPE_COLORS[result.type]
                                  }`}
                                >
                                  {ENTITY_TYPE_LABELS[result.type]}
                                </Badge>
                              </div>

                              {result.subtitle && (
                                <p className="text-xs text-muted-foreground truncate">
                                  {result.subtitle}
                                </p>
                              )}

                              {/* Metadados específicos */}
                              {result.type === "process" && result.meta && (
                                <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                                  <span>
                                    Status:{" "}
                                    {result.meta.status || "Em andamento"}
                                  </span>
                                  {result.meta.statusInferido && (
                                    <Badge
                                      variant="outline"
                                      className="text-[9px] px-1 py-0 bg-muted/50"
                                    >
                                      Inferido
                                    </Badge>
                                  )}
                                  {result.meta.comarca && (
                                    <span>· {result.meta.comarca}</span>
                                  )}
                                  <Badge
                                    variant="outline"
                                    className="text-[9px] px-1 py-0"
                                  >
                                    {result.meta.classificacao || "Normal"}
                                  </Badge>
                                  {result.meta.confidence !== undefined && (
                                    <span className="text-[9px]">
                                      ·{" "}
                                      {Math.round(result.meta.confidence * 100)}
                                      % conf.
                                    </span>
                                  )}
                                </div>
                              )}

                              {result.type === "witness" && result.meta && (
                                <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                                  <span>
                                    {result.meta.depoimentos} depoimentos
                                  </span>
                                  {result.meta.ambosPoles && (
                                    <Badge
                                      variant="outline"
                                      className="text-[9px] px-1 py-0"
                                    >
                                      Ambos polos
                                    </Badge>
                                  )}
                                  <Badge
                                    variant="outline"
                                    className="text-[9px] px-1 py-0"
                                  >
                                    {result.meta.classificacao || "Normal"}
                                  </Badge>
                                  {result.meta.confidence !== undefined && (
                                    <span className="text-[9px]">
                                      ·{" "}
                                      {Math.round(result.meta.confidence * 100)}
                                      % conf.
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Ações rápidas */}
                            <div className="flex items-center gap-1">
                              {result.type === "process" && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0"
                                    onClick={(e) =>
                                      handleCopyCNJ(result.title, e)
                                    }
                                  >
                                    <Copy className="h-3 w-3" />
                                  </Button>
                                  {result.meta?.comarca && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-6 p-0"
                                      onClick={(e) =>
                                        handleFilterByUF(result.meta.comarca, e)
                                      }
                                    >
                                      <Filter className="h-3 w-3" />
                                    </Button>
                                  )}
                                </>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                              >
                                <ExternalLink className="h-3 w-3" />
                              </Button>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    );
                  })}
                </>
              )}
            </>
          )}

          {!searchQuery && (
            <div className="py-6 px-3 text-center text-sm text-muted-foreground space-y-3">
              <p className="font-medium">Busca inteligente com operadores</p>
              <div className="flex flex-wrap justify-center gap-2">
                <code className="bg-muted px-2 py-1 rounded text-xs font-mono">
                  risco:alto João Silva
                </code>
                <code className="bg-muted px-2 py-1 rounded text-xs font-mono">
                  depoimentos:&gt;3
                </code>
                <code className="bg-muted px-2 py-1 rounded text-xs font-mono">
                  uf:RS comarca:POA
                </code>
              </div>
              <p className="text-xs">
                Use prefixos: <code className="bg-muted px-1 rounded">p:</code>{" "}
                processo, <code className="bg-muted px-1 rounded">w:</code>{" "}
                testemunha, <code className="bg-muted px-1 rounded">r:</code>{" "}
                reclamante
              </p>
            </div>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
};
