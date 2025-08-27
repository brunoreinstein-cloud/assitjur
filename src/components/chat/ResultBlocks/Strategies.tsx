import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ResultBlock } from '@/stores/useChatStore';
import { Target, CheckCircle2, Copy } from 'lucide-react';
import { Citations } from '../Citations';
import { useToast } from '@/hooks/use-toast';

interface StrategiesProps {
  block: ResultBlock;
}

export function Strategies({ block }: StrategiesProps) {
  const { data, citations } = block;
  const { toast } = useToast();

  const copyRecommendation = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Recomendação copiada",
      description: "O texto foi copiado para a área de transferência."
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'ALTA': return 'text-red-600 bg-red-50 border-red-200';
      case 'MÉDIA': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'BAIXA': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <Card className="border-l-4 border-l-green-500 min-h-fit">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Target className="h-4 w-4 text-green-600" />
          {block.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 min-h-fit">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-foreground">Estratégias Ativas</h4>
          <Badge className="bg-green-50 text-green-700 border-green-200">
            Polo Ativo
          </Badge>
        </div>

        <div className="space-y-3">
          {data.activeStrategies?.map((strategy: string, index: number) => (
            <div key={index} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-green-800 leading-relaxed">{strategy}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyRecommendation(strategy)}
                className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-100"
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          )) || []}
        </div>

        {data.defensiveActions && data.defensiveActions.length > 0 && (
          <>
            <div className="pt-2">
              <h4 className="text-sm font-medium text-foreground mb-3">Ações Defensivas</h4>
              <div className="space-y-2">
                {data.defensiveActions.map((action: string, index: number) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <Target className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm text-blue-800 leading-relaxed">{action}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyRecommendation(action)}
                      className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-100"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-start gap-2">
            <Target className="h-4 w-4 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <span className="font-medium">Próximos Passos:</span> Implementar as recomendações em ordem de prioridade, 
              começando pela arguição de suspeição das testemunhas identificadas como suspeitas.
            </div>
          </div>
        </div>

        {citations && <Citations citations={citations} />}
      </CardContent>
    </Card>
  );
}