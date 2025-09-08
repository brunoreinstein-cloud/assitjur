import { memo, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Scale, Users } from "lucide-react";
import { useMapaTestemunhasStore } from "@/lib/store/mapa-testemunhas";

type TabType = 'processos' | 'testemunhas';

const KEYBOARD_SHORTCUTS = {
  processos: { key: 'p', label: '⌘P' },
  testemunhas: { key: 't', label: '⌘T' }
} as const;

export const TabsSwitcher = memo(() => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const activeTab = useMapaTestemunhasStore(s => s.activeTab);
  const setActiveTab = useMapaTestemunhasStore(s => s.setActiveTab);

  // ✅ Callback memoizado para mudança de tab
  const handleTabChange = useCallback((newTab: string) => {
    const tabType = newTab as TabType;
    setActiveTab(tabType);
    
    // ✅ Sincronizar URL imediatamente
    const params = new URLSearchParams(searchParams);
    params.set('tab', tabType);
    navigate(`/mapa?${params.toString()}`, { replace: true });
  }, [setActiveTab, searchParams, navigate]);

  // ✅ Efeito único para inicialização
  useEffect(() => {
    const urlTab = searchParams.get('tab') as TabType | null;
    if (urlTab && (urlTab === 'processos' || urlTab === 'testemunhas') && urlTab !== activeTab) {
      setActiveTab(urlTab);
    }
  }, []); // ✅ Executar apenas uma vez na montagem

  // ✅ Keyboard shortcuts otimizados
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || 
          e.target instanceof HTMLTextAreaElement ||
          (e.target as HTMLElement | null)?.closest?.('[contenteditable]')) {
        return;
      }
      if (!(e.metaKey || e.ctrlKey)) return;
      Object.entries(KEYBOARD_SHORTCUTS).forEach(([tab, config]) => {
        if (e.key === config.key) {
          e.preventDefault();
          setActiveTab(tab as TabType);
        }
      });
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [setActiveTab]);

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full sm:w-auto">
        <TabsList className="grid w-full grid-cols-2 sm:w-auto">
          <TabsTrigger value="processos" className="gap-2">
            <Scale className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Por Processo</span>
            <span className="sm:hidden">Processos</span>
          </TabsTrigger>
          <TabsTrigger value="testemunhas" className="gap-2">
            <Users className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Por Testemunha</span>
            <span className="sm:hidden">Testemunhas</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="hidden lg:flex text-xs text-muted-foreground gap-4" role="note">
        {Object.entries(KEYBOARD_SHORTCUTS).map(([tab, config]) => (
          <div key={tab} className="flex items-center gap-1">
            <kbd className="px-2 py-1 bg-muted rounded text-xs">{config.label}</kbd>
            <span className="capitalize">{tab}</span>
          </div>
        ))}
      </div>
    </div>
  );
});

TabsSwitcher.displayName = 'TabsSwitcher';
