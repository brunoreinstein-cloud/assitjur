import React from 'react';
import { ProcessosExplorer } from '@/components/admin/processos/ProcessosExplorer';
import { BulkDeleteManager } from '@/components/admin/BulkDeleteManager';
import { RestoreButton } from '@/components/admin/RestoreButton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ProcessosTable() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Gestão de Processos</CardTitle>
              <p className="text-muted-foreground text-sm">
                Visualizar e gerenciar todos os processos da organização
              </p>
            </div>
            <div className="flex gap-2">
              <RestoreButton />
              <BulkDeleteManager type="processos" />
            </div>
          </div>
        </CardHeader>
      </Card>
      
      <ProcessosExplorer />
    </div>
  );
}