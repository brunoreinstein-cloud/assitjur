import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Scale, Users } from "lucide-react";
import { useMapaTestemunhasStore } from "@/lib/store/mapa-testemunhas";

export const TabsSwitcher = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const activeTab = useMapaTestemunhasStore((s) => s.activeTab);
  const setActiveTab = useMapaTestemunhasStore((s) => s.setActiveTab);

  // Initialize state from URL on mount
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (
      tab &&
      (tab === "processos" || tab === "testemunhas") &&
      tab !== activeTab
    ) {
      setActiveTab(tab);
    }
  }, [searchParams, activeTab, setActiveTab]);

  // Sync URL when state changes
  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    params.set("tab", activeTab);
    navigate(`/mapa?${params.toString()}`, { replace: true });
  }, [activeTab, navigate, searchParams]);

  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab as "processos" | "testemunhas");
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;

      if (e.key === "p" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setActiveTab("processos");
        return;
      }

      if (e.key === "t" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setActiveTab("testemunhas");
        return;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [setActiveTab]);

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="w-full sm:w-auto"
      >
        <TabsList className="grid w-full grid-cols-2 sm:w-auto">
          <TabsTrigger value="processos" className="gap-2">
            <Scale className="h-4 w-4" />
            <span className="hidden sm:inline">Por Processo</span>
            <span className="sm:hidden">Processos</span>
          </TabsTrigger>
          <TabsTrigger value="testemunhas" className="gap-2">
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
