import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Scale,
  AlertTriangle,
  FileText,
  Database,
  TrendingUp
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useMapaStore } from "@/stores/useMapaStore";
import { TabsSwitcher } from "@/components/mapa/TabsSwitcher";
import { RiskPanel } from "@/components/mapa/RiskPanel";
import { MaskPIISwitch } from "@/components/mapa/MaskPIISwitch";
import { ExportCsvButton } from "@/components/mapa/ExportCsvButton";
import { useToast } from "@/hooks/use-toast";

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
    tab,
    rows,
    total,
    loading,
    maskPII,
    setRows,
    setLoading
  } = useMapaStore();
  
  const { toast } = useToast();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
  }, [user, navigate]);

  // Load mock data
  useEffect(() => {
    setLoading(true);
    
    // Simulate API call delay
    const timer = setTimeout(() => {
      if (tab === 'por-processo') {
        setRows(mockProcessoData as any[], mockProcessoData.length);
      } else {
        setRows(mockTestemunhaData as any[], mockTestemunhaData.length);
      }
      setLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [tab, setRows, setLoading]);

  const stats = {
    totalProcessos: tab === 'por-processo' ? total : mockProcessoData.length,
    totalTestemunhas: tab === 'por-testemunha' ? total : mockTestemunhaData.length,
    processosAltoRisco: mockProcessoData.filter(p => p.classificacao_final === 'Risco Alto').length,
    testemunhasAmbosPolos: mockTestemunhaData.filter(t => t.foi_testemunha_em_ambos_polos).length
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
            </div>
            <div className="flex items-center gap-3">
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
        {!maskPII && (
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

        {/* Risk Panel */}
        <RiskPanel />

        {/* Main Content */}
        <div className="mt-8">
          <TabsSwitcher />
          
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <div className="animate-pulse text-muted-foreground">Carregando dados...</div>
            </div>
          ) : (
            <Card className="rounded-2xl border-border/50 mt-6">
              <CardContent className="p-6">
                <div className="text-center py-12">
                  <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    {tab === 'por-processo' ? 'Dados de Processos' : 'Dados de Testemunhas'}
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Visualização detalhada dos dados. {total} registros encontrados.
                  </p>
                  
                  {/* Sample Data Preview */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto text-sm">
                    {rows.slice(0, 6).map((row: any, index) => (
                      <div key={index} className="p-4 bg-muted/30 rounded-lg text-left">
                        <div className="font-medium text-foreground mb-2">
                          {tab === 'por-processo' ? row.cnj : row.nome_testemunha}
                        </div>
                        <div className="text-xs text-muted-foreground space-y-1">
                          {tab === 'por-processo' ? (
                            <>
                              <div>{row.uf} - {row.comarca}</div>
                              <div>Fase: {row.fase}</div>
                              <Badge 
                                className={`text-xs ${
                                  row.classificacao_final === 'Risco Alto' ? 'bg-destructive' : 
                                  row.classificacao_final === 'Risco Médio' ? 'bg-warning' : 'bg-success'
                                }`}
                              >
                                {row.classificacao_final}
                              </Badge>
                            </>
                          ) : (
                            <>
                              <div>{row.qtd_depoimentos} depoimentos</div>
                              <div>Ambos polos: {row.foi_testemunha_em_ambos_polos ? 'Sim' : 'Não'}</div>
                              <Badge 
                                className={`text-xs ${
                                  row.classificacao_estrategica === 'Crítico' ? 'bg-destructive' :
                                  row.classificacao_estrategica === 'Atenção' ? 'bg-warning' : 'bg-secondary'
                                }`}
                              >
                                {row.classificacao_estrategica}
                              </Badge>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;