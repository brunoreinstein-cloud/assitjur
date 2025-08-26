import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  FileText, 
  User, 
  Plus, 
  Copy,
  ExternalLink,
  AlertTriangle,
  TrendingUp,
  Clock
} from 'lucide-react';
import { useChatStore } from '@/stores/useChatStore';
import { useToast } from '@/components/ui/use-toast';

// Mock data
const mockProcessos = [
  {
    id: 'proc-1',
    cnj: '0001234-56.2023.5.02.0001',
    uf: 'SP',
    comarca: 'São Paulo',
    fase: 'Instrução',
    status: 'Ativo',
    reclamante: 'João da Silva Santos',
    triangulacao: true,
    troca: false,
    prova: true,
    scoreRisco: 85
  },
  {
    id: 'proc-2', 
    cnj: '0005678-90.2023.5.02.0002',
    uf: 'SP',
    comarca: 'Santos',
    fase: 'Julgamento',
    status: 'Aguardando',
    reclamante: 'Maria dos Santos',
    triangulacao: true,
    troca: true,
    prova: false,
    scoreRisco: 92
  }
];

const mockTestemunhas = [
  {
    id: 'test-1',
    nome: 'João da Silva Santos',
    qtdDepoimentos: 15,
    ambosPolos: true,
    jaReclamante: true,
    cnjs: [
      '0001234-56.2023.5.02.0001',
      '0002345-67.2023.5.02.0003', 
      '0003456-78.2023.5.02.0004'
    ],
    scoreRisco: 88
  },
  {
    id: 'test-2',
    nome: 'Maria Santos Oliveira', 
    qtdDepoimentos: 8,
    ambosPolos: false,
    jaReclamante: false,
    cnjs: [
      '0005678-90.2023.5.02.0002',
      '0006789-01.2023.5.02.0005'
    ],
    scoreRisco: 65
  }
];

export function ContextCards() {
  const [searchCNJ, setSearchCNJ] = useState('');
  const [searchTestemunha, setSearchTestemunha] = useState('');
  const { setContext, ctx } = useChatStore();
  const { toast } = useToast();

  const handleUseContext = (type: 'processo' | 'testemunha', data: any) => {
    if (type === 'processo') {
      setContext({ ...ctx, cnj: data.cnj, rows: [data] });
      toast({
        title: "Contexto adicionado",
        description: `Processo ${data.cnj} adicionado ao contexto da conversa.`,
      });
    } else {
      setContext({ ...ctx, testemunha: data.nome, rows: [data] });
      toast({
        title: "Contexto adicionado", 
        description: `Testemunha ${data.nome} adicionada ao contexto da conversa.`,
      });
    }
  };

  const handleCopyCitation = async (type: 'processo' | 'testemunha', ref: string) => {
    const citation = `[${type === 'processo' ? 'Processo' : 'Testemunha'}: ${ref}]`;
    try {
      await navigator.clipboard.writeText(citation);
      toast({
        title: "Citação copiada!",
        description: "Referência copiada para a área de transferência.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao copiar",
        description: "Não foi possível copiar a citação.",
      });
    }
  };

  const filteredProcessos = mockProcessos.filter(p => 
    p.cnj.toLowerCase().includes(searchCNJ.toLowerCase()) ||
    p.reclamante.toLowerCase().includes(searchCNJ.toLowerCase()) ||
    p.comarca.toLowerCase().includes(searchCNJ.toLowerCase())
  );

  const filteredTestemunhas = mockTestemunhas.filter(t =>
    t.nome.toLowerCase().includes(searchTestemunha.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <h3 className="font-semibold mb-2">Contexto da Conversa</h3>
        <p className="text-sm text-muted-foreground">
          Busque e adicione dados específicos para enriquecer a análise.
        </p>
      </div>

      <Tabs defaultValue="processos" className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-2 m-2">
          <TabsTrigger value="processos">Por Processo</TabsTrigger>
          <TabsTrigger value="testemunhas">Por Testemunha</TabsTrigger>
        </TabsList>

        <TabsContent value="processos" className="flex-1 overflow-hidden mt-0">
          <div className="p-4 pb-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="CNJ, nome ou comarca..."
                value={searchCNJ}
                onChange={(e) => setSearchCNJ(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <ScrollArea className="flex-1 px-4">
            <div className="space-y-3 pb-4">
              {filteredProcessos.map((processo) => (
                <Card key={processo.id} className="border-l-4 border-l-primary/30">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        <CardTitle className="text-sm font-mono">
                          {processo.cnj}
                        </CardTitle>
                      </div>
                      <Badge 
                        variant={processo.scoreRisco > 80 ? 'destructive' : 'secondary'}
                        className="text-xs"
                      >
                        {processo.scoreRisco}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0 space-y-2">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-muted-foreground">UF:</span> {processo.uf}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Fase:</span> {processo.fase}
                      </div>
                      <div className="col-span-2">
                        <span className="text-muted-foreground">Comarca:</span> {processo.comarca}
                      </div>
                      <div className="col-span-2">
                        <span className="text-muted-foreground">Reclamante:</span> {processo.reclamante}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {processo.triangulacao && (
                        <Badge variant="outline" className="text-xs bg-red-50 text-red-700">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Triangulação
                        </Badge>
                      )}
                      {processo.troca && (
                        <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700">
                          <TrendingUp className="w-3 h-3 mr-1" />
                          Troca Direta
                        </Badge>
                      )}
                      {processo.prova && (
                        <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                          <ExternalLink className="w-3 h-3 mr-1" />
                          Prova Emprestada
                        </Badge>
                      )}
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleUseContext('processo', processo)}
                        className="flex-1"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Usar
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => handleCopyCitation('processo', processo.cnj)}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="testemunhas" className="flex-1 overflow-hidden mt-0">
          <div className="p-4 pb-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Nome da testemunha..."
                value={searchTestemunha}
                onChange={(e) => setSearchTestemunha(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <ScrollArea className="flex-1 px-4">
            <div className="space-y-3 pb-4">
              {filteredTestemunhas.map((testemunha) => (
                <Card key={testemunha.id} className="border-l-4 border-l-secondary/30">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <CardTitle className="text-sm">
                          {testemunha.nome}
                        </CardTitle>
                      </div>
                      <Badge 
                        variant={testemunha.scoreRisco > 80 ? 'destructive' : 'secondary'}
                        className="text-xs"
                      >
                        {testemunha.scoreRisco}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0 space-y-2">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-muted-foreground">Depoimentos:</span> {testemunha.qtdDepoimentos}
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-muted-foreground">Ambos polos:</span>
                        {testemunha.ambosPolos ? (
                          <Badge variant="destructive" className="text-xs">Sim</Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">Não</Badge>
                        )}
                      </div>
                      <div className="col-span-2 flex items-center gap-1">
                        <span className="text-muted-foreground">Já foi reclamante:</span>
                        {testemunha.jaReclamante ? (
                          <Badge variant="destructive" className="text-xs">Sim</Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">Não</Badge>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground">CNJs relacionados:</div>
                      <div className="max-h-16 overflow-y-auto">
                        {testemunha.cnjs.slice(0, 3).map((cnj, index) => (
                          <div key={index} className="text-xs font-mono bg-muted/50 p-1 rounded mb-1">
                            {cnj}
                          </div>
                        ))}
                        {testemunha.cnjs.length > 3 && (
                          <div className="text-xs text-muted-foreground">
                            +{testemunha.cnjs.length - 3} processos
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleUseContext('testemunha', testemunha)}
                        className="flex-1"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Usar
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => handleCopyCitation('testemunha', testemunha.nome)}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}