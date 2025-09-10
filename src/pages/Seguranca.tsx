import React from 'react';
import { SegurancaHeader } from '@/components/seguranca/SegurancaHeader';
import { DataHandlingSection } from '@/components/seguranca/DataHandlingSection';
import { Footer } from '@/components/site/Footer';

export default function Seguranca() {
  return (
    <div className="min-h-screen bg-background">
      <head>
        <title>Segurança de Dados - AssistJur.IA</title>
        <meta
          name="description"
          content="Mascaramento de dados, trilha de auditoria e práticas de LGPD no AssistJur.IA."
        />
      </head>
      <SegurancaHeader />
      <main>
        <DataHandlingSection />
      </main>
      <Footer />
    </div>
  );
}
