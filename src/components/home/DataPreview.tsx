import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, FileText, Users } from "lucide-react";
import { useHomeStore } from "@/lib/store/home";

export const DataPreview = () => {
  const navigate = useNavigate();
  const { 
    previewTab, 
    setPreviewTab, 
    previewProcesso, 
    previewTestemunha,
    previewLoading 
  } = useHomeStore();

  const getRiskColor = (classification: string) => {
    switch (classification?.toLowerCase()) {
      case 'risco alto':
      case 'crítico':
        return 'bg-destructive-light text-destructive border-destructive/20';
      case 'risco médio':
      case 'atenção':
        return 'bg-warning-light text-warning-foreground border-warning/20';
      case 'baixo':
      case 'observação':
        return 'bg-success-light text-success border-success/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const handleViewAll = () => {
    navigate(`/dados/mapa?tab=${previewTab === 'processo' ? 'por-processo' : 'por-testemunha'}`);
  };

  if (previewLoading) {
    return (
      <Card className="mb-12">
        <CardHeader>
          <div className="animate-pulse">
            <div className="h-6 bg-muted rounded w-1/3 mb-2"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse flex space-x-4">
                <div className="h-4 bg-muted rounded flex-1"></div>
                <div className="h-4 bg-muted rounded w-20"></div>
                <div className="h-4 bg-muted rounded w-24"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-12">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          Preview de Dados
        </CardTitle>
        <CardDescription>
          Visualize exemplos dos dados disponíveis nas duas modalidades de análise.
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Tabs 
          value={previewTab} 
          onValueChange={(value) => setPreviewTab(value as 'processo' | 'testemunha')}
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="processo" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Por Processo
            </TabsTrigger>
            <TabsTrigger value="testemunha" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Por Testemunha
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="processo" className="mt-6">
            <div className="overflow-x-auto">
              <div className="min-w-full space-y-3">
                {previewProcesso.map((item, index) => (
                  <div key={index} className="p-4 border border-border rounded-lg hover:bg-muted/30 transition-colors">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
                      <div>
                        <div className="text-sm font-medium text-muted-foreground">CNJ</div>
                        <div className="font-mono text-sm">{item.CNJ}</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-muted-foreground">UF/Comarca</div>
                        <div className="text-sm">{item.UF} - {item.Comarca}</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-muted-foreground">Reclamante</div>
                        <div className="text-sm">{item.Reclamante}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getRiskColor(item.Classificação_Final)}>
                          {item.Classificação_Final}
                        </Badge>
                        <Badge variant="outline">
                          {item.Qtd_Depos_Únicos} depos
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="testemunha" className="mt-6">
            <div className="overflow-x-auto">
              <div className="min-w-full space-y-3">
                {previewTestemunha.map((item, index) => (
                  <div key={index} className="p-4 border border-border rounded-lg hover:bg-muted/30 transition-colors">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
                      <div>
                        <div className="text-sm font-medium text-muted-foreground">Nome</div>
                        <div className="text-sm font-medium">{item.Nome_Testemunha}</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-muted-foreground">Depoimentos</div>
                        <div className="text-sm">{item.Qtd_Depoimentos}</div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Badge variant={item.Em_Ambos_Polos === "Sim" ? "destructive" : "outline"} className="text-xs">
                          {item.Em_Ambos_Polos === "Sim" ? "Ambos Polos" : "Polo Único"}
                        </Badge>
                        <Badge variant={item.Já_Foi_Reclamante === "Sim" ? "destructive" : "outline"} className="text-xs">
                          {item.Já_Foi_Reclamante === "Sim" ? "Foi Reclamante" : "Nunca Reclamante"}
                        </Badge>
                      </div>
                      <div>
                        <Badge className={getRiskColor(item.Classificação_Estratégica)}>
                          {item.Classificação_Estratégica}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="mt-6 flex justify-center">
          <Button onClick={handleViewAll} variant="outline" className="group">
            Ver tudo
            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};