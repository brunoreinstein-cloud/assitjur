import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Scale, Users } from "lucide-react";
import { useMapaStore, syncUrlWithState, parseUrlToState } from "@/stores/useMapaStore";

export const TabsSwitcher = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { tab, setTab, setProcessoFilters, setTestemunhaFilters, setPage } = useMapaStore();

  // Initialize state from URL on mount
  useEffect(() => {
    const urlState = parseUrlToState(searchParams);
    
    if (urlState.tab && urlState.tab !== tab) {
      setTab(urlState.tab);
    }
    
    if (urlState.processoFilters) {
      setProcessoFilters(urlState.processoFilters);
    }
    
    if (urlState.testemunhaFilters) {
      setTestemunhaFilters(urlState.testemunhaFilters);
    }
    
    if (urlState.page && urlState.page !== 1) {
      setPage(urlState.page);
    }
  }, []);

  // Sync URL when state changes
  useEffect(() => {
    const store = useMapaStore.getState();
    syncUrlWithState(store, (params) => {
      navigate(`/dados/mapa?${params.toString()}`, { replace: true });
    });
  }, [tab, navigate]);

  const handleTabChange = (newTab: string) => {
    setTab(newTab as 'por-processo' | 'por-testemunha');
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      
      if (e.key === 'g' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        return;
      }
      
      if (e.key === 'p' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setTab('por-processo');
        return;
      }
      
      if (e.key === 't' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setTab('por-testemunha');
        return;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [setTab]);

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <Tabs value={tab} onValueChange={handleTabChange} className="w-full sm:w-auto">
        <TabsList className="grid w-full grid-cols-2 sm:w-auto">
          <TabsTrigger value="por-processo" className="gap-2">
            <Scale className="h-4 w-4" />
            <span className="hidden sm:inline">Por Processo</span>
            <span className="sm:hidden">Processos</span>
          </TabsTrigger>
          <TabsTrigger value="por-testemunha" className="gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Por Testemunha</span>
            <span className="sm:hidden">Testemunhas</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Keyboard shortcuts help */}
      <div className="hidden lg:flex text-xs text-muted-foreground gap-4">
        <kbd className="px-2 py-1 bg-muted rounded text-xs">⌘P</kbd>
        <span>Processos</span>
        <kbd className="px-2 py-1 bg-muted rounded text-xs">⌘T</kbd>
        <span>Testemunhas</span>
      </div>
    </div>
  );
};