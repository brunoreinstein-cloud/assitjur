import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import { useMapaTestemunhasStore } from "@/lib/store/mapa-testemunhas";
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

// Mock data for demonstration
const mockProcessoData = [
  {
    cnj: "0001234-56.2024.5.01.0001",
    uf: "RJ", 
    comarca: "Rio de Janeiro",
    fase: "Instrução",
    status: "Ativo",
    reclamante_limpo: "Ana Lima",
    qtd_total_depos_unicos: 2,
    classificacao_final: "Risco Médio",
    triangulacao_confirmada: true,
    troca_direta: false,
    contem_prova_emprestada: true,
    todas_testemunhas: ["João Pereira", "Beatriz Nunes"]
  },
  {
    cnj: "0009876-12.2023.5.04.0002",
    uf: "RS",
    comarca: "Porto Alegre", 
    fase: "Recurso",
    status: "Ativo",
    reclamante_limpo: "Carlos Souza",
    qtd_total_depos_unicos: 1,
    classificacao_final: "Risco Alto",
    triangulacao_confirmada: true,
    troca_direta: true,
    contem_prova_emprestada: false,
    todas_testemunhas: ["Rafael Gomes"]
  },
  {
    cnj: "0012345-00.2022.5.02.0003",
    uf: "SP",
    comarca: "São Paulo",
    fase: "Sentença", 
    status: "Encerrado",
    reclamante_limpo: "Marina Rocha",
    qtd_total_depos_unicos: 0,
    classificacao_final: "Baixo",
    triangulacao_confirmada: false,
    troca_direta: false,
    contem_prova_emprestada: false,
    todas_testemunhas: []
  }
];

const mockTestemunhaData = [
  {
    nome_testemunha: "João Pereira",
    qtd_depoimentos: 4,
    foi_testemunha_em_ambos_polos: true,
    ja_foi_reclamante: false,
    classificacao_estrategica: "Atenção",
    cnjs_como_testemunha: ["0001234-56.2024.5.01.0001", "0009876-12.2023.5.04.0002"]
  },
  {
    nome_testemunha: "Beatriz Nunes", 
    qtd_depoimentos: 2,
    foi_testemunha_em_ambos_polos: false,
    ja_foi_reclamante: true,
    classificacao_estrategica: "Observação",
    cnjs_como_testemunha: ["0001234-56.2024.5.01.0001"]
  },
  {
    nome_testemunha: "Rafael Gomes",
    qtd_depoimentos: 6,
    foi_testemunha_em_ambos_polos: true, 
    ja_foi_reclamante: false,
    classificacao_estrategica: "Crítico",
    cnjs_como_testemunha: ["0009876-12.2023.5.04.0002"]
  }
];

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    activeTab,
    processos,
    testemunhas,
    isLoading,
    isPiiMasked,
    setActiveTab,
    setProcessos,
    setTestemunhas,
    setIsLoading,
    setIsImportModalOpen
  } = useMapaTestemunhasStore();
  
  const { toast } = useToast();
  
  // Get current date and time for last update
  const lastUpdate = new Date();
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
  }, [user, navigate]);

  // Load mock data
  useEffect(() => {
    setIsLoading(true);
    
    // Simulate API call delay
    const timer = setTimeout(() => {
      setProcessos(mockProcessoData as any[]);
      setTestemunhas(mockTestemunhaData as any[]);
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [setProcessos, setTestemunhas, setIsLoading]);

  const stats = {
    totalProcessos: processos.length,
    totalTestemunhas: testemunhas.length,
    processosAltoRisco: processos.filter((p: any) => p.classificacao_final === 'Risco Alto').length,
    testemunhasAmbosPolos: testemunhas.filter((t: any) => t.foi_testemunha_em_ambos_polos).length
  };

  const getCurrentData = () => {
    return activeTab === 'processos' ? processos : testemunhas;
  };

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
                <Database className="h-8 w-8 text-primary" />
                Mapa de Testemunhas
              </h1>
              <p className="text-muted-foreground mt-1">
                Análise estratégica de testemunhas e processos judiciais
              </p>
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>Última atualização: {formatDate(lastUpdate)}</span>
                </div>
                <Separator orientation="vertical" className="h-4" />
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>Dados em tempo real</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => setIsImportModalOpen(true)}
                className="gap-2"
              >
                <FileText className="h-4 w-4" />
                Importar Dados
              </Button>
              <MaskPIISwitch />
              <ExportCsvButton />
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="rounded-2xl border-border/50 hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Scale className="h-4 w-4 text-blue-500" />
                Total de Processos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{stats.totalProcessos}</div>
              <p className="text-xs text-muted-foreground mt-1">Processos cadastrados</p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border/50 hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4 text-green-500" />
                Total de Testemunhas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{stats.totalTestemunhas}</div>
              <p className="text-xs text-muted-foreground mt-1">Testemunhas identificadas</p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border/50 hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                Processos Alto Risco
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className="text-3xl font-bold text-destructive">{stats.processosAltoRisco}</div>
                <Badge variant="destructive" className="text-xs">
                  {stats.totalProcessos > 0 ? Math.round((stats.processosAltoRisco / stats.totalProcessos) * 100) : 0}%
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Requerem atenção especial</p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border/50 hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-amber-500" />
                Ambos os Polos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className="text-3xl font-bold text-amber-600">{stats.testemunhasAmbosPolos}</div>
                <Badge variant="secondary" className="text-xs">
                  {stats.totalTestemunhas > 0 ? Math.round((stats.testemunhasAmbosPolos / stats.totalTestemunhas) * 100) : 0}%
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Testemunhas em ambos os polos</p>
            </CardContent>
          </Card>
        </div>

        {/* PII Warning */}
        {!isPiiMasked && (
          <Card className="rounded-2xl border-amber-500/50 bg-amber-500/5 mb-6">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-amber-600">
                <AlertTriangle className="h-4 w-4" />
                <span className="font-medium">Conteúdo assistivo. Revisão humana obrigatória.</span>
                <span className="text-sm">Dados sensíveis visíveis.</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content */}
        <div className="mt-8">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'processos' | 'testemunhas')}>
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
              <TabsList className="grid w-full lg:w-auto grid-cols-2">
                <TabsTrigger value="processos" className="flex items-center gap-2">
                  <Scale className="h-4 w-4" />
                  Por Processo
                </TabsTrigger>
                <TabsTrigger value="testemunhas" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Por Testemunha
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="processos" className="space-y-6">
              <ProcessoFilters />
              {isLoading ? (
                <div className="flex items-center justify-center p-12">
                  <div className="animate-pulse text-muted-foreground">Carregando dados...</div>
                </div>
              ) : (
                <ProcessoTable data={processos} />
              )}
            </TabsContent>

            <TabsContent value="testemunhas" className="space-y-6">
              <TestemunhaFilters />
              {isLoading ? (
                <div className="flex items-center justify-center p-12">
                  <div className="animate-pulse text-muted-foreground">Carregando dados...</div>
                </div>
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

export default Index;