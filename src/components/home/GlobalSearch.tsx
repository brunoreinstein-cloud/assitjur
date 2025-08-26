import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, FileText, Users, MapPin } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { useHomeStore } from "@/lib/store/home";

interface SearchResult {
  cnjs: string[];
  testemunhas: string[];
  comarcas: string[];
}

export const GlobalSearch = () => {
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<SearchResult>({ cnjs: [], testemunhas: [], comarcas: [] });
  const navigate = useNavigate();
  const { searchQuery, setSearchQuery } = useHomeStore();

  // Mock search function
  const mockSearch = (query: string): SearchResult => {
    const q = query.toLowerCase();
    
    if (q.includes('jo')) {
      return {
        cnjs: ["0001234-56.2024.5.01.0001"],
        testemunhas: ["João Pereira"],
        comarcas: ["Joinville"]
      };
    }
    
    if (q.includes('ana')) {
      return {
        cnjs: ["0001234-56.2024.5.01.0001"],
        testemunhas: [],
        comarcas: ["Rio de Janeiro"]
      };
    }

    if (q.includes('rj') || q.includes('rio')) {
      return {
        cnjs: ["0001234-56.2024.5.01.0001"],
        testemunhas: [],
        comarcas: ["Rio de Janeiro"]
      };
    }

    return { cnjs: [], testemunhas: [], comarcas: [] };
  };

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "/" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
      if (e.key === "u" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        // Open upload modal
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.length >= 2) {
      setResults(mockSearch(query));
    } else {
      setResults({ cnjs: [], testemunhas: [], comarcas: [] });
    }
  };

  const handleSelect = (type: string, value: string) => {
    setOpen(false);
    
    switch (type) {
      case 'cnj':
        navigate(`/dados/mapa?tab=por-processo&cnj=${encodeURIComponent(value)}`);
        break;
      case 'testemunha':
        navigate(`/dados/mapa?tab=por-testemunha&nome=${encodeURIComponent(value)}`);
        break;
      case 'comarca':
        navigate(`/dados/mapa?tab=por-processo&comarca=${encodeURIComponent(value)}`);
        break;
    }
  };

  return (
    <>
      <Button
        variant="outline"
        className="w-full max-w-sm justify-start text-sm text-muted-foreground"
        onClick={() => setOpen(true)}
      >
        <Search className="mr-2 h-4 w-4" />
        Pesquisar CNJ, testemunha ou comarca...
        <kbd className="pointer-events-none ml-auto inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
          <span className="text-xs">⌘</span>/
        </kbd>
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput 
          placeholder="Pesquisar CNJ, testemunha ou comarca..." 
          value={searchQuery}
          onValueChange={handleSearch}
        />
        <CommandList>
          <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
          
          {results.cnjs.length > 0 && (
            <CommandGroup heading="CNJs">
              {results.cnjs.map((cnj) => (
                <CommandItem
                  key={cnj}
                  onSelect={() => handleSelect('cnj', cnj)}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  {cnj}
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {results.testemunhas.length > 0 && (
            <CommandGroup heading="Testemunhas">
              {results.testemunhas.map((testemunha) => (
                <CommandItem
                  key={testemunha}
                  onSelect={() => handleSelect('testemunha', testemunha)}
                >
                  <Users className="mr-2 h-4 w-4" />
                  {testemunha}
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {results.comarcas.length > 0 && (
            <CommandGroup heading="Comarcas">
              {results.comarcas.map((comarca) => (
                <CommandItem
                  key={comarca}
                  onSelect={() => handleSelect('comarca', comarca)}
                >
                  <MapPin className="mr-2 h-4 w-4" />
                  {comarca}
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
};