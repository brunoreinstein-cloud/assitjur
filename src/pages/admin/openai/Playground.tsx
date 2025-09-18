import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Play, Zap, Clock, DollarSign } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

const OpenAIPlayground = () => {
  const { profile } = useAuth();
  const [testInput, setTestInput] = useState({ cnj: '', nome: '', comarca: '', ano: '' });
  const [result, setResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [metrics, setMetrics] = useState<any>(null);

  const handleTest = async (streaming = false) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-openai-test', {
        body: { 
          input: testInput,
          streaming,
          org_id: profile?.organization_id 
        }
      });
      
      if (error) throw error;
      
      setResult(data.response);
      setMetrics(data.metrics);
      
      toast({
        title: "Teste executado",
        description: `Resposta gerada em ${data.metrics?.duration_ms}ms`,
      });
    } catch (error: any) {
      toast({
        title: "Erro no teste",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Playground de Testes</h1>
        <p className="text-muted-foreground">
          Teste a IA com dados reais da sua base
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Entrada de Teste</CardTitle>
            <CardDescription>Configure os dados para teste</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>CNJ do Processo</Label>
              <Input
                placeholder="0000000-00.0000.0.00.0000"
                value={testInput.cnj}
                onChange={(e) => setTestInput({ ...testInput, cnj: e.target.value })}
              />
            </div>
            <div>
              <Label>Nome da Pessoa</Label>
              <Input
                placeholder="João da Silva"
                value={testInput.nome}
                onChange={(e) => setTestInput({ ...testInput, nome: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Comarca</Label>
                <Input
                  placeholder="São Paulo"
                  value={testInput.comarca}
                  onChange={(e) => setTestInput({ ...testInput, comarca: e.target.value })}
                />
              </div>
              <div>
                <Label>Ano</Label>
                <Input
                  placeholder="2024"
                  value={testInput.ano}
                  onChange={(e) => setTestInput({ ...testInput, ano: e.target.value })}
                />
              </div>
            </div>
            
            <div className="flex space-x-2">
              <Button 
                onClick={() => handleTest(false)} 
                disabled={isLoading}
                className="flex-1"
              >
                <Play className="h-4 w-4 mr-2" />
                Executar
              </Button>
              <Button 
                onClick={() => handleTest(true)} 
                disabled={isLoading}
                variant="outline"
                className="flex-1"
              >
                <Zap className="h-4 w-4 mr-2" />
                Streaming
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resultado</CardTitle>
            <CardDescription>Resposta da IA</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : result ? (
              <div className="space-y-4">
                <div className="bg-muted p-4 rounded-lg">
                  <pre className="whitespace-pre-wrap text-sm">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </div>
                
                {metrics && (
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div className="flex items-center space-x-1">
                      <Clock className="h-3 w-3" />
                      <span>{metrics.duration_ms}ms</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <DollarSign className="h-3 w-3" />
                      <span>{metrics.tokens_in + metrics.tokens_out} tokens</span>
                    </div>
                    <div>
                      <Badge variant="outline">{metrics.model}</Badge>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Play className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Execute um teste para ver o resultado</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OpenAIPlayground;