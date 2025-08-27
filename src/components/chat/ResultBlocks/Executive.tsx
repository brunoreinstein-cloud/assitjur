import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ResultBlock } from '@/stores/useChatStore';
import { Pin, TrendingUp, AlertTriangle } from 'lucide-react';
import { Citations } from '../Citations';

interface ExecutiveProps {
  block: ResultBlock;
}

export function Executive({ block }: ExecutiveProps) {
  const { data, citations } = block;

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'ALTO': return 'text-red-600 bg-red-50 border-red-200';
      case 'MÉDIO': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'BAIXO': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <Card className="border-l-4 border-l-violet-500">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Pin className="h-4 w-4 text-violet-600" />
          {block.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="prose prose-sm max-w-none">
          <p className="text-muted-foreground leading-relaxed">
            {data.summary}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Nível de Risco</span>
              <Badge className={getRiskColor(data.riskLevel)}>
                {data.riskLevel}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Confiança</span>
              <div className="flex items-center gap-2">
                <Progress value={data.confidence} className="w-16 h-2" />
                <span className="text-sm text-muted-foreground">{data.confidence}%</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
            <TrendingUp className="h-4 w-4 text-violet-600" />
            <span className="text-sm font-medium">Requer atenção especial</span>
          </div>
        </div>

        {citations && <Citations citations={citations} />}
      </CardContent>
    </Card>
  );
}