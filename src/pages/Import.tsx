import React from 'react';
import { ImporterWizard } from '@/components/importer/ImporterWizard';

const Import = () => {
  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Importador de Planilhas - AssistJur.IA
            </h1>
          <p className="mt-2 text-muted-foreground">
            Importe e normalize dados de testemunhas e processos
          </p>
        </div>
        <ImporterWizard />
      </div>
    </div>
  );
};

export default Import;