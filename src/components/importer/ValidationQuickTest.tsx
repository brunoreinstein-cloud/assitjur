import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle } from 'lucide-react';

// Componente simples para testar se as importações funcionam
export const ValidationQuickTest: React.FC = () => {
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-success" />
          Sistema Funcionando
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">Importações OK</Badge>
            <span className="text-sm text-muted-foreground">Componentes carregados</span>
          </div>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-success" />
            <span className="text-sm text-muted-foreground">
              Sistema de correção operacional
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};