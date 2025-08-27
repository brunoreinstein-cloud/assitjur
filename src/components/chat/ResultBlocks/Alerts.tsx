import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ResultBlock } from '@/stores/useChatStore';
import { AlertTriangle, XCircle, CheckCircle2 } from 'lucide-react';
import { Citations } from '../Citations';

interface AlertsProps {
  block: ResultBlock;
}

export function Alerts({ block }: AlertsProps) {
  const { data, citations } = block;

  return (
    <Card className="border-l-4 border-l-red-500">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          {block.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Alert className="border-red-200 bg-red-50">
            <XCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <span className="font-medium">Triangulação Detectada:</span> {data.triangulation ? 'Sim' : 'Não'}
            </AlertDescription>
          </Alert>

          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              <span className="font-medium">Depoimentos Repetidos:</span> {data.repeatedTestimony ? 'Sim' : 'Não'}
            </AlertDescription>
          </Alert>
        </div>

        <div className="space-y-3">
          <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            Padrões Suspeitos Identificados
          </h4>
          <div className="space-y-2">
            {data.suspiciousPatterns.map((pattern: string, index: number) => (
              <div key={index} className="flex items-start gap-2 p-2 bg-red-50 rounded border-l-2 border-red-300">
                <XCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-red-800">{pattern}</span>
              </div>
            ))}
          </div>
        </div>

        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <span className="font-medium">Atenção:</span> Os padrões identificados sugerem coordenação entre testemunhas. 
            Recomenda-se análise jurídica detalhada e possível arguição de suspeição.
          </AlertDescription>
        </Alert>

        {citations && <Citations citations={citations} />}
      </CardContent>
    </Card>
  );
}