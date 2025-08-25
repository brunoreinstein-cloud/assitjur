import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Database, FileCheck, Upload, AlertTriangle } from 'lucide-react';

const Dashboard = () => {
  // Mock data - will be replaced with real data from Supabase
  const stats = {
    basePublicada: {
      versao: 'v1.2.3',
      hash: 'a1b2c3',
      linhas: 15420,
      dataPublicacao: '2024-01-15'
    },
    integridade: 98.5,
    ultimoUpload: '2024-01-14 14:30',
    alertasCriticos: 2
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard Admin</h1>
        <p className="text-muted-foreground">
          Visão geral do sistema e base de dados
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Base Publicada
            </CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.basePublicada.versao}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.basePublicada.linhas.toLocaleString()} registros
            </p>
            <div className="mt-2">
              <Badge variant="secondary" className="text-xs">
                Hash: {stats.basePublicada.hash}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Integridade da Base
            </CardTitle>
            <FileCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.integridade}%
            </div>
            <p className="text-xs text-muted-foreground">
              Qualidade dos dados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Último Upload
            </CardTitle>
            <Upload className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              Ontem
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.ultimoUpload}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Alertas Críticos
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {stats.alertasCriticos}
            </div>
            <p className="text-xs text-muted-foreground">
              Requerem atenção
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Status da Base Ativa</CardTitle>
            <CardDescription>
              Informações detalhadas da versão atual
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="font-medium">Versão:</span>
              <Badge variant="default">{stats.basePublicada.versao}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Hash:</span>
              <code className="text-sm bg-muted px-2 py-1 rounded">
                {stats.basePublicada.hash}
              </code>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Total de Registros:</span>
              <span>{stats.basePublicada.linhas.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Data de Publicação:</span>
              <span>{stats.basePublicada.dataPublicacao}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Últimas Atividades</CardTitle>
            <CardDescription>
              Resumo das ações mais recentes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Base v1.2.3 publicada</p>
                  <p className="text-xs text-muted-foreground">Há 2 dias</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Novo arquivo importado</p>
                  <p className="text-xs text-muted-foreground">Há 1 dia</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">2 alertas de qualidade</p>
                  <p className="text-xs text-muted-foreground">Há 3 horas</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;