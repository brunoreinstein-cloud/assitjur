import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Download, FileSpreadsheet, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TemplateDownloadCard } from '@/components/template/TemplateDownloadCard';
import { FieldDictionary } from '@/components/template/FieldDictionary';
import { Examples } from '@/components/template/Examples';
import { Checklist } from '@/components/template/Checklist';
import { TrustNote } from '@/components/template/TrustNote';

export default function TemplatePage() {
  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <Link to="/import" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao Importador
          </Link>
          
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-3">
              <FileSpreadsheet className="h-10 w-10 text-primary" />
              <h1 className="text-4xl font-bold tracking-tight text-foreground">
                Templates de Importação
              </h1>
            </div>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Baixe os templates oficiais e configure seus dados no formato correto para importação no Mapa de Testemunhas
            </p>
          </div>

          {/* Alert de Diretrizes */}
          <Alert className="mt-6 border-blue-200 bg-blue-50 dark:bg-blue-950">
            <CheckCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800 dark:text-blue-200">
              <strong>Novas Diretrizes:</strong> Validação rigorosa com mapeamento estrito de colunas e CNJs com 20 dígitos exatos
            </AlertDescription>
          </Alert>
        </div>

        {/* Cards de Download */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Downloads dos Templates
            </CardTitle>
            <CardDescription>
              Escolha o formato mais adequado para seu fluxo de trabalho
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <TemplateDownloadCard
                title="Excel Completo (XLSX)"
                description="Arquivo completo com 3 abas: Por Processo, Por Testemunha e Dicionário de Campos"
                downloadUrl="https://fgjypmlszuzkgvhuszxn.supabase.co/functions/v1/templates-xlsx"
                icon="xlsx"
                filename="template-assistjur.xlsx"
                recommended={true}
              />
              
              <TemplateDownloadCard
                title="CSV – Por Processo"
                description="Apenas dados de processos em formato CSV (separador ponto e vírgula)"
                downloadUrl="https://fgjypmlszuzkgvhuszxn.supabase.co/functions/v1/templates-csv?sheet=Por%20Processo"
                icon="csv"
                filename="template-por-processo.csv"
              />
              
              <TemplateDownloadCard
                title="CSV – Por Testemunha"
                description="Apenas dados de testemunhas em formato CSV (separador ponto e vírgula)"
                downloadUrl="https://fgjypmlszuzkgvhuszxn.supabase.co/functions/v1/templates-csv?sheet=Por%20Testemunha"
                icon="csv"
                filename="template-por-testemunha.csv"
              />
            </div>
          </CardContent>
        </Card>

        {/* Checklist de Validação */}
        <div className="mb-12">
          <Checklist />
        </div>

        {/* Dicionário de Campos */}
        <div className="mb-12">
          <FieldDictionary />
        </div>

        {/* Exemplos Visuais */}
        <div className="mb-12">
          <Examples />
        </div>

        {/* Nota de Segurança e LGPD */}
        <div className="mb-12">
          <TrustNote />
        </div>

        {/* CTA para importação */}
        <Card className="text-center">
          <CardContent className="pt-8 pb-8">
            <h3 className="text-xl font-semibold mb-4">Pronto para Importar?</h3>
            <p className="text-muted-foreground mb-6">
              Agora que você tem o template, acesse o sistema de importação para enviar seus dados
            </p>
            <div className="flex gap-4 justify-center">
              <Link to="/dados/mapa">
                <Button size="lg" className="px-8">
                  <FileSpreadsheet className="h-5 w-5 mr-2" />
                  Importar Mapa de Testemunhas
                </Button>
              </Link>
              <Link to="/admin/base-import">
                <Button variant="outline" size="lg" className="px-8">
                  <Download className="h-5 w-5 mr-2" />
                  Base de Dados (Admin)
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}