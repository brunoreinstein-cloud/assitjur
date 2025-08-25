import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  History, 
  CheckCircle, 
  Clock, 
  Download, 
  RotateCcw,
  Eye
} from 'lucide-react';

const Versions = () => {
  // Mock data - will be replaced with real data from Supabase
  const versions = [
    {
      id: '1',
      version: 'v1.2.4',
      hash: 'a1b2c3d4',
      status: 'DRAFT',
      rows: 15420,
      createdAt: '2024-01-15 14:30',
      createdBy: 'admin@demo.com',
      isActive: false
    },
    {
      id: '2',
      version: 'v1.2.3',
      hash: 'e5f6g7h8',
      status: 'PUBLISHED',
      rows: 15380,
      createdAt: '2024-01-14 10:15',
      createdBy: 'admin@demo.com',
      isActive: true
    },
    {
      id: '3',
      version: 'v1.2.2',
      hash: 'i9j0k1l2',
      status: 'PUBLISHED',
      rows: 14920,
      createdAt: '2024-01-10 16:45',
      createdBy: 'admin@demo.com',
      isActive: false
    }
  ];

  const getStatusBadge = (status: string, isActive: boolean) => {
    if (isActive) {
      return <Badge variant="default" className="bg-green-500">ATIVA</Badge>;
    }
    
    switch (status) {
      case 'DRAFT':
        return <Badge variant="secondary">RASCUNHO</Badge>;
      case 'PUBLISHED':
        return <Badge variant="outline">PUBLICADA</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Versões & Rollback</h1>
        <p className="text-muted-foreground">
          Gerencie versões da base de dados e execute rollbacks quando necessário
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Histórico de Versões
          </CardTitle>
          <CardDescription>
            Lista de todas as versões criadas e seus status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Versão</TableHead>
                <TableHead>Hash</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Registros</TableHead>
                <TableHead>Criada em</TableHead>
                <TableHead>Autor</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {versions.map((version) => (
                <TableRow key={version.id}>
                  <TableCell className="font-medium">
                    {version.version}
                  </TableCell>
                  <TableCell>
                    <code className="text-sm bg-muted px-2 py-1 rounded">
                      {version.hash}
                    </code>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(version.status, version.isActive)}
                  </TableCell>
                  <TableCell>
                    {version.rows.toLocaleString()}
                  </TableCell>
                  <TableCell>{version.createdAt}</TableCell>
                  <TableCell>{version.createdBy}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                      {version.status === 'DRAFT' && (
                        <Button variant="ghost" size="sm" className="text-green-600">
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}
                      {!version.isActive && version.status === 'PUBLISHED' && (
                        <Button variant="ghost" size="sm" className="text-blue-600">
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Versão Ativa</CardTitle>
            <CardDescription>
              Informações da versão atualmente em produção
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Versão:</span>
                <Badge variant="default" className="bg-green-500">v1.2.3</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Hash:</span>
                <code className="text-sm bg-muted px-2 py-1 rounded">e5f6g7h8</code>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Registros:</span>
                <span className="text-sm">15,380</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Publicada em:</span>
                <span className="text-sm">14/01/2024 10:15</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
            <CardDescription>
              Operações frequentes com versões
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start">
              <Download className="h-4 w-4 mr-2" />
              Baixar Versão Ativa
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Eye className="h-4 w-4 mr-2" />
              Comparar Versões
            </Button>
            <Button variant="outline" className="w-full justify-start text-blue-600">
              <RotateCcw className="h-4 w-4 mr-2" />
              Rollback para v1.2.2
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Versions;