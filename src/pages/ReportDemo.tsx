import React from 'react';
import { ReportGenerator } from '@/components/reports/ReportGenerator';
import { mockReportData } from '@/lib/mock-data/report-sample';
import { AppLayout } from '@/components/navigation/AppLayout';

export function ReportDemo() {
  return (
    <AppLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Relatório Conclusivo</h1>
            <p className="text-muted-foreground mt-1">
              Template para geração de relatórios conclusivos de análise de padrões
            </p>
          </div>
        </div>
        
        <ReportGenerator 
          mockData={mockReportData}
        />
      </div>
    </AppLayout>
  );
}