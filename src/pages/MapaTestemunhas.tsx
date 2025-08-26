import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  FileSpreadsheet, 
  Download, 
  Eye, 
  EyeOff, 
  Users, 
  Scale,
  AlertTriangle
} from "lucide-react";
import { useMapaTestemunhasStore } from "@/lib/store/mapa-testemunhas";
import { ProcessoFilters } from "@/components/mapa-testemunhas/ProcessoFilters";
import { TestemunhaFilters } from "@/components/mapa-testemunhas/TestemunhaFilters";
import { ProcessoTable } from "@/components/mapa-testemunhas/ProcessoTable";
import { TestemunhaTable } from "@/components/mapa-testemunhas/TestemunhaTable";
import { ImportModal } from "@/components/mapa-testemunhas/ImportModal";
import { DetailDrawer } from "@/components/mapa-testemunhas/DetailDrawer";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { PorProcesso, PorTestemunha } from "@/types/mapa-testemunhas";

export default function MapaTestemunhas() {
  const {
    activeTab,
    setActiveTab,
    processos,
    testemunhas,
    setProcessos,
    setTestemunhas,
    setIsImportModalOpen,
    isPiiMasked,
    setIsPiiMasked,
    isLoading,
    setIsLoading,
    processoFilters,
    testemunhaFilters,
    processosPage,
    testemunhasPage,
    pageSize
  } = useMapaTestemunhasStore();
  
  const { toast } = useToast();

  // Load data based on active tab and filters
  useEffect(() => {
    loadData();
  }, [activeTab, processoFilters, testemunhaFilters, processosPage, testemunhasPage]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'processos') {
        const { data, error } = await supabase.functions.invoke('mapa-testemunhas-processos', {
          body: {
            filters: processoFilters,
            page: processosPage,
            limit: pageSize
          }
        });
        
        if (error) throw error;
        setProcessos(data.data || []);
      } else {
        const { data, error } = await supabase.functions.invoke('mapa-testemunhas-testemunhas', {
          body: {
            filters: testemunhaFilters,
            page: testemunhasPage,
            limit: pageSize
          }
        });
        
        if (error) throw error;
        setTestemunhas(data.data || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar os dados. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      const endpoint = activeTab === 'processos' ? 'export-processos' : 'export-testemunhas';
      const filters = activeTab === 'processos' ? processoFilters : testemunhaFilters;
      
      const { data, error } = await supabase.functions.invoke(endpoint, {
        body: { filters, includeAllColumns: true }
      });

      if (error) throw error;

      // Create and download CSV
      const blob = new Blob([data], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `mapa-testemunhas-${activeTab}-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();

      toast({
        title: "Exportação concluída!",
        description: "Arquivo CSV baixado com sucesso."
      });
    } catch (error) {
      toast({
        title: "Erro na exportação",
        description: "Não foi possível exportar os dados.",
        variant: "destructive"
      });
    }
  };

  const stats = {
    totalProcessos: processos.length,
    totalTestemunhas: testemunhas.length,
    processosAltoRisco: processos.filter(p => p.classificacao_final === 'ALTO RISCO').length,
    testemunhasAmbosPolos: testemunhas.filter(t => t.foi_testemunha_em_ambos_polos).length
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/50 bg-card">
        <div className="container mx-auto px-6 py-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold">Mapa de Testemunhas</h1>
              <p className="text-muted-foreground mt-1">
                Análise estratégica de testemunhas e processos judiciais
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => setIsPiiMasked(!isPiiMasked)}
                className="gap-2"
              >
                {isPiiMasked ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {isPiiMasked ? 'Mostrar PII' : 'Mascarar PII'}
              </Button>
              <Button
                variant="outline"
                onClick={handleExportCSV}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Exportar CSV
              </Button>
              <Button
                onClick={() => setIsImportModalOpen(true)}
                className="gap-2"
              >
                <FileSpreadsheet className="h-4 w-4" />
                Importar Excel
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="rounded-2xl border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Scale className="h-4 w-4" />
                Total de Processos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalProcessos}</div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                Total de Testemunhas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalTestemunhas}</div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                Processos Alto Risco
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className="text-2xl font-bold text-destructive">{stats.processosAltoRisco}</div>
                <Badge variant="destructive" className="text-xs">
                  {stats.totalProcessos > 0 ? Math.round((stats.processosAltoRisco / stats.totalProcessos) * 100) : 0}%
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4 text-warning" />
                Ambos os Polos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className="text-2xl font-bold text-warning">{stats.testemunhasAmbosPolos}</div>
                <Badge variant="secondary" className="text-xs">
                  {stats.totalTestemunhas > 0 ? Math.round((stats.testemunhasAmbosPolos / stats.totalTestemunhas) * 100) : 0}%
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* PII Warning */}
        {!isPiiMasked && (
          <Card className="rounded-2xl border-warning/50 bg-warning/5 mb-6">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-warning">
                <AlertTriangle className="h-4 w-4" />
                <span className="font-medium">Conteúdo assistivo. Revisão humana obrigatória.</span>
                <span className="text-sm">Dados sensíveis visíveis.</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'processos' | 'testemunhas')}>
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="processos" className="gap-2">
              <Scale className="h-4 w-4" />
              Por Processo
            </TabsTrigger>
            <TabsTrigger value="testemunhas" className="gap-2">
              <Users className="h-4 w-4" />
              Por Testemunha
            </TabsTrigger>
          </TabsList>

          <TabsContent value="processos" className="space-y-6">
            <ProcessoFilters />
            {isLoading ? (
              <div className="flex items-center justify-center p-12">
                <div className="animate-pulse text-muted-foreground">Carregando...</div>
              </div>
            ) : (
              <ProcessoTable data={processos} />
            )}
          </TabsContent>

          <TabsContent value="testemunhas" className="space-y-6">
            <TestemunhaFilters />
            {isLoading ? (
              <div className="flex items-center justify-center p-12">
                <div className="animate-pulse text-muted-foreground">Carregando...</div>
              </div>
            ) : (
              <TestemunhaTable data={testemunhas} />
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Modals and Drawers */}
      <ImportModal />
      <DetailDrawer />
    </div>
  );
}