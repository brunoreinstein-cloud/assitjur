import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { 
  Users, 
  Scale,
  AlertTriangle,
  FileText,
  Database,
  TrendingUp,
  Calendar,
  Clock,
  Filter,
  X,
  Info,
  Settings
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { 
  useMapaTestemunhasStore,
  selectActiveTab,
  selectProcessos,
  selectTestemunhas,
  selectIsLoading,
  selectIsPiiMasked,
  selectHasError,
  selectErrorMessage,
  selectLastUpdate,
  selectProcessoFilters,
  selectTestemunhaFilters
} from "@/lib/store/mapa-testemunhas";
import { ProcessoTable } from "@/components/mapa-testemunhas/ProcessoTable";
import { TestemunhaTable } from "@/components/mapa-testemunhas/TestemunhaTable";
import { FilterDrawer } from "@/components/mapa-testemunhas/FilterDrawer";
import { ColumnVisibilityMenu } from "@/components/mapa-testemunhas/ColumnVisibilityMenu";
import { VisualizationSelector } from "@/components/mapa-testemunhas/VisualizationSelector";
import { DetailDrawer } from "@/components/mapa-testemunhas/DetailDrawer";
import { ImportModal } from "@/components/mapa-testemunhas/ImportModal";
import { MaskPIISwitch } from "@/components/mapa/MaskPIISwitch";
import { ExportCsvButton } from "@/components/mapa/ExportCsvButton";
import { useToast } from "@/hooks/use-toast";
import { useDebounce } from "@/hooks/useDebounce";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { fetchProcessos, fetchTestemunhas } from "@/services/mapa-testemunhas";
import { PorProcesso, PorTestemunha } from "@/types/mapa-testemunhas";
import { ChatBar } from "@/features/testemunhas/ChatBar";
import { ResultBlocks } from "@/features/testemunhas/ResultBlocks";
import { LoadingHints } from "@/features/testemunhas/LoadingHints";
import { LoadMoreButton } from "@/components/mapa-testemunhas/LoadMoreButton";
import { ConnectionStatus } from "@/components/mapa-testemunhas/ConnectionStatus";
import { DataState, DataStatus } from "@/components/ui/data-state";
import { MapaErrorBoundary } from "@/components/mapa-testemunhas/MapaErrorBoundary";
import { DebugToggle } from "@/components/mapa-testemunhas/DebugToggle";
import { DebugMode } from "@/lib/debug-mode";
import { DiagnosticPanel } from "@/components/mapa-testemunhas/DiagnosticPanel";
import { DensitySelector } from "@/components/mapa-testemunhas/DensitySelector";
import { ContextBreadcrumb } from "@/components/mapa-testemunhas/ContextBreadcrumb";

// Updated types to match mapa-testemunhas structure
type Processo = PorProcesso;
type Testemunha = PorTestemunha;
type TabType = 'processos' | 'testemunhas';

interface StatsData {
  totalProcessos: number;
  totalTestemunhas: number;
  processosAltoRisco: number;
  testemunhasAmbosPolos: number;
  pctProcAlto: number;
  pctAmbos: number;
}

const MapaPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, loading } = useAuth();
  const { toast } = useToast();
  
  // Zustand selectors - optimized for re-rendering
  const activeTab = useMapaTestemunhasStore(selectActiveTab);
  const processos = useMapaTestemunhasStore(selectProcessos);
  const testemunhas = useMapaTestemunhasStore(selectTestemunhas);
  const isLoading = useMapaTestemunhasStore(selectIsLoading);
  const isPiiMasked = useMapaTestemunhasStore(selectIsPiiMasked);
  const hasError = useMapaTestemunhasStore(selectHasError);
  const errorMessage = useMapaTestemunhasStore(selectErrorMessage);
  const lastUpdate = useMapaTestemunhasStore(selectLastUpdate);
  const processoFilters = useMapaTestemunhasStore(selectProcessoFilters);
  const testemunhaFilters = useMapaTestemunhasStore(selectTestemunhaFilters);

  const processoAbortRef = useRef<AbortController | null>(null);
  const testemunhaAbortRef = useRef<AbortController | null>(null);
  const isLoadingRef = useRef(false);
  const isFirstLoadRef = useRef(true);
  const hasAppliedUrlParams = useRef(false);
  
  // Filter drawer state
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [isDiagnosticOpen, setIsDiagnosticOpen] = useState(false);
  
  // Chat selectors
  const chatResult = useMapaTestemunhasStore(s => s.chatResult);
  const chatStatus = useMapaTestemunhasStore(s => s.chatStatus);
  
  // Individual setters
  const setActiveTab = useMapaTestemunhasStore(s => s.setActiveTab);
  const setProcessos = useMapaTestemunhasStore(s => s.setProcessos);
  const setTestemunhas = useMapaTestemunhasStore(s => s.setTestemunhas);
  const setIsLoading = useMapaTestemunhasStore(s => s.setIsLoading);
  const setLastUpdate = useMapaTestemunhasStore(s => s.setLastUpdate);
  const setError = useMapaTestemunhasStore(s => s.setError);
  const setIsImportModalOpen = useMapaTestemunhasStore(s => s.setIsImportModalOpen);
  const loadViews = useMapaTestemunhasStore(s => s.loadViews);
  const setProcessoFilters = useMapaTestemunhasStore(s => s.setProcessoFilters);
  const setTestemunhaFilters = useMapaTestemunhasStore(s => s.setTestemunhaFilters);
  const setSelectedProcesso = useMapaTestemunhasStore(s => s.setSelectedProcesso);
  const setSelectedTestemunha = useMapaTestemunhasStore(s => s.setSelectedTestemunha);

  // Stable state
  const [totalProcessos, setTotalProcessos] = useState(0);
  const [totalTestemunhas, setTotalTestemunhas] = useState(0);

  // Helper function for date formatting
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // KPIs calculation with useMemo - using real totals from API with robust validation
  const stats: StatsData = useMemo(() => {
    // Validar arrays e filtrar com fallback seguro
    const processosValidos = Array.isArray(processos) ? processos : [];
    const testemunhasValidas = Array.isArray(testemunhas) ? testemunhas : [];
    
    const processosAltoRisco = processosValidos.filter(p => 
      p?.classificacao_final === "Risco Alto" || 
      p?.classificacao_final === "Alto"
    ).length;
    
    const testemunhasAmbosPolos = testemunhasValidas.filter(t => 
      t?.foi_testemunha_em_ambos_polos === true
    ).length;
    
    // Função robusta de cálculo de porcentagem
    const pct = (a: number, b: number): number => {
      if (!isFinite(a) || !isFinite(b) || b <= 0) return 0;
      const result = Math.round((a / b) * 100);
      return isFinite(result) ? result : 0;
    };
    
    // Garantir que totais sejam números válidos
    const totalP = isFinite(totalProcessos) && totalProcessos > 0 ? totalProcessos : processosValidos.length;
    const totalT = isFinite(totalTestemunhas) && totalTestemunhas > 0 ? totalTestemunhas : testemunhasValidas.length;
    
    return { 
      totalProcessos: totalP, 
      totalTestemunhas: totalT, 
      processosAltoRisco, 
      testemunhasAmbosPolos,
      pctProcAlto: pct(processosAltoRisco, totalP), 
      pctAmbos: pct(testemunhasAmbosPolos, totalT) 
    };
  }, [processos, testemunhas, totalProcessos, totalTestemunhas]);

  const computeStatus = (items: any[]): DataStatus => {
    if (isLoading) return 'loading';
    if (hasError) return navigator.onLine ? 'error' : 'offline';
    return items.length ? 'success' : 'empty';
  };

  const processoStatus = computeStatus(processos);
  const testemunhaStatus = computeStatus(testemunhas);

  // Authentication guard - improved with loading check
  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
      return;
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      loadViews(user.id);
    }
  }, [user, loadViews]);

  // URL synchronization - runs only once on mount
  useEffect(() => {
    if (hasAppliedUrlParams.current) return;
    
    const tab = searchParams.get('tab') as TabType;
    const nome = searchParams.get('nome');
    const cnj = searchParams.get('cnj');
    const reclamante = searchParams.get('reclamante');
    
    // Set active tab from URL
    if (tab && (tab === 'processos' || tab === 'testemunhas') && tab !== activeTab) {
      setActiveTab(tab);
    }
    
    // Apply URL params as initial filters (before first load)
    if (nome) {
      setTestemunhaFilters({ search: decodeURIComponent(nome) });
    }
    
    if (cnj) {
      setProcessoFilters({ search: decodeURIComponent(cnj) });
    }
    
    if (reclamante) {
      setProcessoFilters({ search: decodeURIComponent(reclamante) });
    }
    
    // Mark as applied and clean URL
    if (nome || cnj || reclamante) {
      hasAppliedUrlParams.current = true;
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('nome');
      newParams.delete('cnj');
      newParams.delete('reclamante');
      setSearchParams(newParams, { replace: true });
    }
  }, []);
  
  // Separate effect for data-dependent selections (runs after data loads)
  useEffect(() => {
    if (!hasAppliedUrlParams.current || isLoadingRef.current) return;
    if (processos.length === 0 && testemunhas.length === 0) return;
    
    // Check if we have a search filter that matches loaded data
    if (testemunhaFilters.search && testemunhas.length > 0) {
      const testemunha = testemunhas.find(t => 
        t.nome_testemunha?.toLowerCase() === testemunhaFilters.search?.toLowerCase()
      );
      if (testemunha && !useMapaTestemunhasStore.getState().selectedTestemunha) {
        setSelectedTestemunha(testemunha);
        toast({ title: "Testemunha selecionada", description: testemunha.nome_testemunha });
      }
    }
    
    if (processoFilters.search && processos.length > 0) {
      const processo = processos.find(p => 
        p.cnj === processoFilters.search || p.numero_cnj === processoFilters.search
      );
      if (processo && !useMapaTestemunhasStore.getState().selectedProcesso) {
        setSelectedProcesso(processo);
        toast({ title: "Processo selecionado", description: processo.cnj || processo.numero_cnj });
      }
    }
  }, [processos.length, testemunhas.length]);

  const handleTabChange = (value: string) => {
    const newTab = value as TabType;
    setActiveTab(newTab);
    setSearchParams({ tab: newTab }, { replace: true });
    
    // Limpar seleções ao trocar de aba
    setSelectedProcesso(null);
    setSelectedTestemunha(null);
  };

  // Debounced filters to prevent excessive calls
  const debouncedProcessoFilters = useDebounce(processoFilters, 300);
  const debouncedTestemunhaFilters = useDebounce(testemunhaFilters, 300);

  // Stable data loading function - no deps on changing state
  const loadData = useCallback(async () => {
    if (!user || isLoadingRef.current) return;

    // Cancel previous requests
    processoAbortRef.current?.abort();
    testemunhaAbortRef.current?.abort();

    const processoController = new AbortController();
    const testemunhaController = new AbortController();
    processoAbortRef.current = processoController;
    testemunhaAbortRef.current = testemunhaController;

    isLoadingRef.current = true;
    setIsLoading(true);
    setError(false);

    try {
      const currentProcessoFilters = useMapaTestemunhasStore.getState().processoFilters;
      const currentTestemunhaFilters = useMapaTestemunhasStore.getState().testemunhaFilters;
      
      const [processosResult, testemunhasResult] = await Promise.all([
        fetchProcessos({ page: 1, limit: 100, filters: currentProcessoFilters }),
        fetchTestemunhas({ page: 1, limit: 100, filters: currentTestemunhaFilters })
      ]);

      if (processoController.signal.aborted || testemunhaController.signal.aborted) {
        return;
      }

      // Validar e normalizar dados antes de atualizar estado
      const processosData = Array.isArray(processosResult.data) ? processosResult.data : [];
      const testemunhasData = Array.isArray(testemunhasResult.data) ? testemunhasResult.data : [];
      
      setProcessos(processosData);
      setTestemunhas(testemunhasData);
      
      // Usar total da API ou length dos dados como fallback
      const totalP = isFinite(processosResult.total) ? processosResult.total : processosData.length;
      const totalT = isFinite(testemunhasResult.total) ? testemunhasResult.total : testemunhasData.length;
      
      setTotalProcessos(totalP);
      setTotalTestemunhas(totalT);

      const errorMsg = processosResult.error || testemunhasResult.error;
      if (errorMsg) {
        setError(true, `Erro ao conectar: ${errorMsg}`);
        toast({
          title: "Falha ao conectar",
          description: errorMsg,
          variant: "destructive",
        });
      } else if (isFirstLoadRef.current) {
        setLastUpdate(new Date());
        isFirstLoadRef.current = false;
      }
    } catch (error) {
      if ((error as any)?.name === 'AbortError') return;
      
      const message = error instanceof Error ? error.message : 'Erro ao carregar dados';
      setError(true, message);
      toast({
        title: "Falha na conexão",
        description: message,
        variant: "destructive",
      });
    } finally {
      if (!processoController.signal.aborted && !testemunhaController.signal.aborted) {
        isLoadingRef.current = false;
        setIsLoading(false);
      }
    }
  }, [user]);

  // Initial load on mount
  useEffect(() => {
    if (user) {
      loadData();
    }
    return () => {
      processoAbortRef.current?.abort();
      testemunhaAbortRef.current?.abort();
    };
  }, [user, loadData]);
  
  // Reload only when debounced filters change (after initial load)
  useEffect(() => {
    if (!isFirstLoadRef.current && user) {
      loadData();
    }
  }, [debouncedProcessoFilters, debouncedTestemunhaFilters, loadData]);

  // Ctrl+F shortcut to open filter drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        setIsFilterDrawerOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Helper to render active filter chips
  const getActiveFilterChips = () => {
    const filters = activeTab === 'processos' ? processoFilters : testemunhaFilters;
    const entries = Object.entries(filters);
    
    if (entries.length === 0) return null;

    const handleRemoveFilter = (key: string) => {
      if (activeTab === 'processos') {
        const newFilters = { ...processoFilters };
        delete newFilters[key as keyof typeof processoFilters];
        setProcessoFilters(newFilters);
      } else {
        const newFilters = { ...testemunhaFilters };
        delete newFilters[key as keyof typeof testemunhaFilters];
        setTestemunhaFilters(newFilters);
      }
    };

    return (
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-sm text-muted-foreground">Filtros ativos:</span>
        {entries.map(([key, value]) => (
          <Badge key={key} variant="secondary" className="gap-1">
            <span className="text-xs">{key}: {String(value)}</span>
            <button
              onClick={() => handleRemoveFilter(key)}
              className="ml-1 hover:bg-secondary-foreground/10 rounded-full p-0.5"
              aria-label={`Remover filtro ${key}`}
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>
    );
  };

  // Show loading during auth check
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" aria-live="polite">
        <div className="animate-pulse text-muted-foreground">Verificando autenticação...</div>
      </div>
    );
  }

  // Redirect if not authenticated
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/50 bg-card">
        <div className="container mx-auto px-6 py-6">
          <ContextBreadcrumb />
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <Database className="h-8 w-8 text-primary" aria-hidden="true" />
                Mapa de Testemunhas
                {hasError && (
                  <Badge variant="destructive" className="text-xs">
                    Modo Fallback
                  </Badge>
                )}
              </h1>
              <p className="text-muted-foreground mt-1">
                Análise estratégica de testemunhas e processos judiciais
              </p>
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" aria-hidden="true" />
                  <span>
                    Última atualização: {lastUpdate ? formatDate(lastUpdate) : '—'}
                  </span>
                </div>
                <Separator orientation="vertical" className="h-4" />
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" aria-hidden="true" />
                  <span>{hasError ? 'Dados mock' : 'Dados em tempo real'}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <DensitySelector />
              <Button
                variant="outline"
                onClick={() => setIsImportModalOpen(true)}
                className="gap-2"
                aria-label="Importar dados via Excel"
              >
                <FileText className="h-4 w-4" aria-hidden="true" />
                Importar Dados
              </Button>
              {DebugMode.isEnabled() && (
                <Sheet open={isDiagnosticOpen} onOpenChange={setIsDiagnosticOpen}>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Settings className="h-4 w-4" />
                      Diagnóstico
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-[400px]">
                    <SheetHeader>
                      <SheetTitle>Diagnóstico do Sistema</SheetTitle>
                      <SheetDescription>
                        Ferramentas de desenvolvimento e diagnóstico
                      </SheetDescription>
                    </SheetHeader>
                    <div className="mt-6">
                      <DiagnosticPanel />
                    </div>
                  </SheetContent>
                </Sheet>
              )}
              <DebugToggle />
              <MaskPIISwitch />
              <ExportCsvButton 
                data={activeTab === "processos" ? processos : testemunhas}
                fileName={activeTab === "processos" ? "por_processo.csv" : "por_testemunha.csv"}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-6">
        {/* Error State */}
        {hasError && (
          <Card className="rounded-2xl border-destructive/50 bg-destructive/5 mb-6">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                <span className="font-medium">Erro:</span>
                <span className="text-sm">{errorMessage}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <TooltipProvider>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Tooltip>
              <TooltipTrigger asChild>
                <Card className="rounded-2xl border-border/50 hover:shadow-md transition-shadow cursor-help">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Scale className="h-4 w-4 text-primary" aria-hidden="true" />
                      Total de Processos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-primary">{stats.totalProcessos.toLocaleString('pt-BR')}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Processos cadastrados {processos.length < stats.totalProcessos && `(exibindo ${processos.length})`}
                    </p>
                  </CardContent>
                </Card>
              </TooltipTrigger>
              <TooltipContent>
                <p>Total de processos jurídicos cadastrados no sistema</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Card className="rounded-2xl border-border/50 hover:shadow-md transition-shadow cursor-help">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Users className="h-4 w-4 text-emerald-600" aria-hidden="true" />
                      Total de Testemunhas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-emerald-600">{stats.totalTestemunhas.toLocaleString('pt-BR')}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Testemunhas identificadas {testemunhas.length < stats.totalTestemunhas && `(exibindo ${testemunhas.length})`}
                    </p>
                  </CardContent>
                </Card>
              </TooltipTrigger>
              <TooltipContent>
                <p>Total de testemunhas únicas identificadas em todos os processos</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Card className="rounded-2xl border-border/50 hover:shadow-md transition-shadow cursor-help">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-destructive" aria-hidden="true" />
                      Processos de Alto Risco
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <div className="text-3xl font-bold text-destructive">{stats.processosAltoRisco}</div>
                      <Badge variant="destructive" className="text-xs">
                        {stats.pctProcAlto}%
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Requerem atenção especial</p>
                  </CardContent>
                </Card>
              </TooltipTrigger>
              <TooltipContent>
                <p>Processos classificados como alto risco que necessitam atenção imediata</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Card className="rounded-2xl border-border/50 hover:shadow-md transition-shadow cursor-help">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-orange-500" aria-hidden="true" />
                      Atua nos Dois Polos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <div className="text-3xl font-bold text-orange-600">{stats.testemunhasAmbosPolos}</div>
                      <Badge variant="secondary" className="text-xs">
                        {stats.pctAmbos}%
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Testemunhas em ambos os polos</p>
                  </CardContent>
                </Card>
              </TooltipTrigger>
              <TooltipContent>
                <p>Testemunhas que participaram tanto como testemunha da reclamante quanto da ré</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>

        {/* Chat Assistant Section */}
        <div id="chat-assistant-section" className="mb-8 space-y-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Assistente de Análise</h2>
            <Alert className="inline-flex items-center gap-2 py-2 px-3 w-auto border-violet-200 bg-violet-50">
              <Info className="h-4 w-4 text-violet-600" />
              <AlertDescription className="text-xs text-violet-900">
                IA Assistiva LGPD Compliant.{' '}
                <a href="/privacidade" className="underline font-medium hover:text-violet-700">
                  Saiba mais
                </a>
              </AlertDescription>
            </Alert>
          </div>
          
          <ChatBar />
          {chatResult && (
            <div className="mt-6">
              <ResultBlocks blocks={chatResult} />
            </div>
          )}
          {chatStatus === 'loading' && (
            <div className="mt-6">
              <LoadingHints />
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="mt-8">
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
              <TabsList className="grid w-full lg:w-auto grid-cols-2">
                <TabsTrigger value="processos" className="flex items-center gap-2">
                  <Scale className="h-4 w-4" aria-hidden="true" />
                  Por Processo
                </TabsTrigger>
                <TabsTrigger value="testemunhas" className="flex items-center gap-2">
                  <Users className="h-4 w-4" aria-hidden="true" />
                  Por Testemunha
                </TabsTrigger>
              </TabsList>
              <div className="flex gap-2">
                {user && <VisualizationSelector userId={user.id} />}
                <ColumnVisibilityMenu />
              </div>
            </div>

            <TabsContent value="processos" className="space-y-6">
              <ConnectionStatus
                isLoading={isLoading}
                hasError={hasError}
                errorMessage={errorMessage}
                isConnected={!hasError || processos.length > 3}
                dataCount={processos.length}
                dataType="processos"
              />
              
              {/* Filter Button + Active Chips */}
              <div className="flex flex-col gap-3">
                <Button
                  variant="outline"
                  onClick={() => setIsFilterDrawerOpen(true)}
                  className="w-full sm:w-auto gap-2"
                >
                  <Filter className="h-4 w-4" />
                  Filtros Avançados
                  <kbd className="ml-auto hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100">
                    <span className="text-xs">⌘</span>F
                  </kbd>
                </Button>
                {getActiveFilterChips()}
              </div>

              {processoStatus !== 'success' ? (
                <DataState status={processoStatus} onRetry={loadData} />
              ) : (
                <ProcessoTable data={processos} />
              )}
            </TabsContent>

            <TabsContent value="testemunhas" className="space-y-6">
              <ConnectionStatus
                isLoading={isLoading}
                hasError={hasError}
                errorMessage={errorMessage}
                isConnected={!hasError || testemunhas.length > 3}
                dataCount={testemunhas.length}
                dataType="testemunhas"
              />
              
              {/* Filter Button + Active Chips */}
              <div className="flex flex-col gap-3">
                <Button
                  variant="outline"
                  onClick={() => setIsFilterDrawerOpen(true)}
                  className="w-full sm:w-auto gap-2"
                >
                  <Filter className="h-4 w-4" />
                  Filtros Avançados
                  <kbd className="ml-auto hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100">
                    <span className="text-xs">⌘</span>F
                  </kbd>
                </Button>
                {getActiveFilterChips()}
              </div>

              {testemunhaStatus !== 'success' ? (
                <DataState status={testemunhaStatus} onRetry={loadData} />
              ) : (
                <TestemunhaTable data={testemunhas} status={testemunhaStatus} onRetry={loadData} />
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Modals and Drawers */}
        <DetailDrawer />
        <ImportModal />
        <FilterDrawer open={isFilterDrawerOpen} onOpenChange={setIsFilterDrawerOpen} />
      </div>
    </div>
  );
};

// Wrap with error boundary for production-grade error handling
const MapaPageWithErrorBoundary = () => (
  <MapaErrorBoundary>
    <MapaPage />
  </MapaErrorBoundary>
);

export default MapaPageWithErrorBoundary;