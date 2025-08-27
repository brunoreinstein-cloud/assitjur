import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ResultBlock } from '@/stores/useChatStore';
import { FileText, Users, Calendar, Network } from 'lucide-react';
import { Citations } from '../Citations';

interface DetailsProps {
  block: ResultBlock;
}

export function Details({ block }: DetailsProps) {
  const { data, citations } = block;

  return (
    <Card className="min-h-fit">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <FileText className="h-4 w-4 text-blue-600" />
          {block.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 min-h-fit">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <Network className="h-5 w-5 text-blue-600 mx-auto mb-1" />
            <div className="text-lg font-semibold text-blue-900">{data.connections}</div>
            <div className="text-xs text-blue-700">Conexões</div>
          </div>
          
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <FileText className="h-5 w-5 text-green-600 mx-auto mb-1" />
            <div className="text-lg font-semibold text-green-900">{data.processes}</div>
            <div className="text-xs text-green-700">Processos</div>
          </div>

          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <Users className="h-5 w-5 text-purple-600 mx-auto mb-1" />
            <div className="text-lg font-semibold text-purple-900">{data.commonPatterns.length}</div>
            <div className="text-xs text-purple-700">Padrões</div>
          </div>

          <div className="text-center p-3 bg-orange-50 rounded-lg">
            <Calendar className="h-5 w-5 text-orange-600 mx-auto mb-1" />
            <div className="text-lg font-semibold text-orange-900">{data.timeline}</div>
            <div className="text-xs text-orange-700">Período</div>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="text-sm font-medium text-foreground">Padrões Identificados</h4>
          <div className="flex flex-wrap gap-2">
            {data.commonPatterns.map((pattern: string, index: number) => (
              <Badge key={index} variant="outline" className="text-xs">
                {pattern}
              </Badge>
            ))}
          </div>
        </div>

        {citations && <Citations citations={citations} />}
      </CardContent>
    </Card>
  );
}