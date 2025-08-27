import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TemplateDownloadCard } from '@/components/template/TemplateDownloadCard';
import { FieldDictionary } from '@/components/template/FieldDictionary';
import { Examples } from '@/components/template/Examples';
import { Checklist } from '@/components/template/Checklist';
import { TrustNote } from '@/components/template/TrustNote';

export default function TemplatePage() {
  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link to="/import" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao Importador
          </Link>
          
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Template de Importação – HubJUR.IA
            </h1>
            <p className="mt-2 text-lg text-muted-foreground">
              Baixe o template oficial e configure seus dados no formato correto
            </p>
          </div>
        </div>

        {/* Cards de Download */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">Downloads</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <TemplateDownloadCard
              title="Baixar XLSX completo"
              description="Arquivo completo com 3 abas: Por Processo, Por Testemunha e Dicionário"
              downloadUrl="https://fgjypmlszuzkgvhuszxn.supabase.co/functions/v1/templates-xlsx"
              icon="xlsx"
              filename="template-hubjuria.xlsx"
            />
            
            <TemplateDownloadCard
              title="CSV – Por Processo"
              description="Apenas a aba Por Processo em formato CSV (separador ;)"
              downloadUrl="https://fgjypmlszuzkgvhuszxn.supabase.co/functions/v1/templates-csv?sheet=Por%20Processo"
              icon="csv"
              filename="template-por-processo.csv"
            />
            
            <TemplateDownloadCard
              title="CSV – Por Testemunha"
              description="Apenas a aba Por Testemunha em formato CSV (separador ;)"
              downloadUrl="https://fgjypmlszuzkgvhuszxn.supabase.co/functions/v1/templates-csv?sheet=Por%20Testemunha"
              icon="csv"
              filename="template-por-testemunha.csv"
            />
          </div>
        </section>

        {/* Dicionário de Campos */}
        <section className="mb-12">
          <FieldDictionary />
        </section>

        {/* Exemplos */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">Exemplos Visuais</h2>
          <Examples />
        </section>

        {/* Checklist */}
        <section className="mb-12">
          <Checklist />
        </section>

        {/* Nota de Confiança */}
        <section className="mb-8">
          <TrustNote />
        </section>

        {/* CTA para importador */}
        <div className="text-center">
          <Link to="/import">
            <Button size="lg" className="px-8">
              <Download className="h-5 w-5 mr-2" />
              Ir para o Importador
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}