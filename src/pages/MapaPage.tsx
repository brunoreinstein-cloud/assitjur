import { useEffect, useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Users, 
  Scale,
  AlertTriangle,
  FileText,
  Database,
  TrendingUp,
  Calendar,
  Clock
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
import { ProcessoFilters } from "@/components/mapa-testemunhas/ProcessoFilters";
import { TestemunhaFilters } from "@/components/mapa-testemunhas/TestemunhaFilters";
import { DetailDrawer } from "@/components/mapa-testemunhas/DetailDrawer";
import { ImportModal } from "@/components/mapa-testemunhas/ImportModal";
import { MaskPIISwitch } from "@/components/mapa/MaskPIISwitch";
import { ExportCsvButton } from "@/components/mapa/ExportCsvButton";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { fetchPorProcesso, fetchPorTestemunha } from "@/lib/supabase";
import { PorProcesso, PorTestemunha } from "@/types/mapa-testemunhas";
import { ChatBar } from "@/features/testemunhas/ChatBar";
import { ResultBlocks } from "@/features/testemunhas/ResultBlocks";
import { LoadingHints } from "@/features/testemunhas/LoadingHints";

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

  // Stable lastUpdate state
  const [isFirstLoad, setIsFirstLoad] = useState(true);

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

  // KPIs calculation with useMemo - fixed boolean check
  const stats: StatsData = useMemo(() => {
    const totalProcessos = processos.length;
    const totalTestemunhas = testemunhas.length;
    const processosAltoRisco = processos.filter(p => p.classificacao_final === "Risco Alto").length;
    const testemunhasAmbosPolos = testemunhas.filter(t => t.foi_testemunha_em_ambos_polos === true).length;
    const pct = (a: number, b: number) => b > 0 ? Math.round((a / b) * 100) : 0;
    
    return { 
      totalProcessos, 
      totalTestemunhas, 
      processosAltoRisco, 
      testemunhasAmbosPolos,
      pctProcAlto: pct(processosAltoRisco, totalProcessos), 
      pctAmbos: pct(testemunhasAmbosPolos, totalTestemunhas) 
    };
  }, [processos, testemunhas]);

  // Authentication guard - improved with loading check
  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
      return;
    }
  }, [user, loading, navigate]);

  // URL synchronization with tabs and view mode
  useEffect(() => {
    const tab = searchParams.get('tab') as TabType;
    const view = searchParams.get('view');
    
    if (tab && (tab === 'processos' || tab === 'testemunhas') && tab !== activeTab) {
      setActiveTab(tab);
    }
    
    // If view=chat is present, scroll to chat section
    if (view === 'chat') {
      setTimeout(() => {
        const chatElement = document.getElementById('chat-assistant-section');
        chatElement?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [searchParams, activeTab, setActiveTab]);

  const handleTabChange = (value: string) => {
    const newTab = value as TabType;
    setActiveTab(newTab);
    setSearchParams({ tab: newTab });
  };

  // Load real data from Supabase with filter integration
  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      setIsLoading(true);
      setError(false);
      
      try {
        // Apply current filters to the API calls
        const processosParams = {
          page: 1,
          pageSize: 1000, // Load all data for now - TODO: implement pagination
          filters: processoFilters
        };
        
        const testemunhasParams = {
          page: 1,
          pageSize: 1000, // Load all data for now - TODO: implement pagination
          filters: testemunhaFilters
        };

        // Fetch both datasets in parallel
        const [processosResult, testemunhasResult] = await Promise.all([
          fetchPorProcesso(processosParams),
          fetchPorTestemunha(testemunhasParams)
        ]);

        // Update store with real data
        setProcessos(processosResult.data);
        setTestemunhas(testemunhasResult.data);
        
        // Set lastUpdate only when data finishes loading
        if (isFirstLoad) {
          setLastUpdate(new Date());
          setIsFirstLoad(false);
        }
        
        setIsLoading(false);
        
        console.log('Data loaded successfully:', {
          processos: processosResult.data.length,
          testemunhas: testemunhasResult.data.length,
          appliedFilters: {
            processos: processoFilters,
            testemunhas: testemunhaFilters
          }
        });
        
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        setError(true, 'Falha ao carregar dados. Verifique sua conexão.');
        setIsLoading(false);
        
        toast({
          title: "Erro ao carregar dados",
          description: "Não foi possível carregar os dados do Supabase. Tente novamente.",
          variant: "destructive",
        });
      }
    };

    loadData();
    
  }, [user, setProcessos, setTestemunhas, setIsLoading, setError, setLastUpdate, isFirstLoad, toast, processoFilters, testemunhaFilters]);

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
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <Database className="h-8 w-8 text-primary" aria-hidden="true" />
                Mapa de Testemunhas
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
                  <span>Dados em tempo real</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => setIsImportModalOpen(true)}
                className="gap-2"
                aria-label="Importar dados via Excel"
              >
                <FileText className="h-4 w-4" aria-hidden="true" />
                Importar Dados
              </Button>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="rounded-2xl border-border/50 hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Scale className="h-4 w-4 text-primary" aria-hidden="true" />
                Total de Processos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{stats.totalProcessos}</div>
              <p className="text-xs text-muted-foreground mt-1">Processos cadastrados</p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border/50 hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4 text-emerald-600" aria-hidden="true" />
                Total de Testemunhas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-600">{stats.totalTestemunhas}</div>
              <p className="text-xs text-muted-foreground mt-1">Testemunhas identificadas</p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border/50 hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive" aria-hidden="true" />
                Processos Alto Risco
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

          <Card className="rounded-2xl border-border/50 hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-orange-500" aria-hidden="true" />
                Ambos os Polos
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
        </div>

        {/* Chat Assistant Section */}
        <div id="chat-assistant-section" className="mb-8 space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-xl font-semibold">Assistente de Análise</h2>
            <Badge variant="outline" className="text-xs">
              IA Assistiva • LGPD Compliant
            </Badge>
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
            </div>

            <TabsContent value="processos" className="space-y-6">
              <ProcessoFilters />
              {isLoading ? (
                <div className="flex items-center justify-center p-12" aria-live="polite">
                  <div className="animate-pulse text-muted-foreground">Carregando dados...</div>
                </div>
              ) : processos.length === 0 ? (
                <Card className="rounded-2xl border-border/50">
                  <CardContent className="p-8 text-center text-muted-foreground">
                    Nenhum registro encontrado.
                  </CardContent>
                </Card>
              ) : (
                <ProcessoTable data={processos} />
              )}
            </TabsContent>

            <TabsContent value="testemunhas" className="space-y-6">
              <TestemunhaFilters />
              {isLoading ? (
                <div className="flex items-center justify-center p-12" aria-live="polite">
                  <div className="animate-pulse text-muted-foreground">Carregando dados...</div>
                </div>
              ) : testemunhas.length === 0 ? (
                <Card className="rounded-2xl border-border/50">
                  <CardContent className="p-8 text-center text-muted-foreground">
                    Nenhum registro encontrado.
                  </CardContent>
                </Card>
              ) : (
                <TestemunhaTable data={testemunhas} />
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Modals and Drawers */}
        <DetailDrawer />
        <ImportModal />
      </div>
    </div>
  );
};

export default MapaPage;