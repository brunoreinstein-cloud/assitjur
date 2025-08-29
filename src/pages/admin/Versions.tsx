import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
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
  const [versions, setVersions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeVersion, setActiveVersion] = useState<any>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchVersions();
    }
  }, [user]);

  const fetchVersions = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('versions')
        .select('*')
        .order('number', { ascending: false });

      if (error) throw error;
      
      setVersions(data || []);
      setActiveVersion(data?.find(v => v.status === 'published') || null);
    } catch (error) {
      console.error('Error fetching versions:', error);
      toast({
        title: "Erro",
        description: "Falha ao carregar versões",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handlePublish = async (versionId: string) => {
    try {
      const { error } = await supabase.functions.invoke('publish-version', {
        body: { versionId }
      });
      
      if (error) throw error;
      
      toast({
        title: "Sucesso",
        description: "Versão publicada com sucesso"
      });
      
      fetchVersions();
    } catch (error) {
      console.error('Error publishing version:', error);
      toast({
        title: "Erro",
        description: "Falha ao publicar versão",
        variant: "destructive"
      });
    }
  };

  const handleRollback = async (versionId: string, versionNumber: number) => {
    try {
      const { error } = await supabase.functions.invoke('rollback-version', {
        body: { toVersionId: versionId }
      });
      
      if (error) throw error;
      
      toast({
        title: "Sucesso", 
        description: `Rollback para v${versionNumber} realizado com sucesso`
      });
      
      fetchVersions();
    } catch (error) {
      console.error('Error rolling back:', error);
      toast({
        title: "Erro",
        description: "Falha ao realizar rollback",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string, isActive: boolean) => {
    if (isActive && status === 'published') {
      return <Badge className="bg-success text-success-foreground">ATIVA</Badge>;
    }
    
    switch (status) {
      case 'draft':
        return <Badge variant="secondary">RASCUNHO</Badge>;
      case 'published':
      case 'archived':
        return <Badge variant="outline">ARQUIVADA</Badge>;
      default:
        return <Badge variant="secondary">{status?.toUpperCase()}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Versões & Rollback</h1>
          <p className="text-muted-foreground">Carregando versões...</p>
        </div>
      </div>
    );
  }

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
              {versions.length > 0 ? versions.map((version) => (
                <TableRow key={version.id}>
                  <TableCell className="font-medium">
                    v{version.number}
                  </TableCell>
                  <TableCell>
                    <code className="text-sm bg-muted px-2 py-1 rounded">
                      {version.file_checksum?.slice(0, 8) || 'N/A'}
                    </code>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(version.status, version.status === 'published')}
                  </TableCell>
                  <TableCell>
                    {version.summary?.imported?.toLocaleString() || 'N/A'}
                  </TableCell>
                  <TableCell>{formatDateTime(version.created_at)}</TableCell>
                  <TableCell>{version.summary?.created_by || 'Sistema'}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" title="Visualizar">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" title="Baixar">
                        <Download className="h-4 w-4" />
                      </Button>
                      {version.status === 'draft' && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-success hover:text-success/80"
                          onClick={() => handlePublish(version.id)}
                          title="Publicar versão"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}
                      {version.status === 'archived' && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-primary hover:text-primary/80"
                          onClick={() => handleRollback(version.id, version.number)}
                          title="Fazer rollback"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    Nenhuma versão encontrada
                  </TableCell>
                </TableRow>
              )}
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
            {activeVersion ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Versão:</span>
                  <Badge className="bg-success text-success-foreground">v{activeVersion.number}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Hash:</span>
                  <code className="text-sm bg-muted px-2 py-1 rounded">
                    {activeVersion.file_checksum?.slice(0, 8) || 'N/A'}
                  </code>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Registros:</span>
                  <span className="text-sm">{activeVersion.summary?.imported?.toLocaleString() || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Publicada em:</span>
                  <span className="text-sm">{formatDateTime(activeVersion.published_at)}</span>
                </div>
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-4">
                Nenhuma versão ativa encontrada
              </div>
            )}
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
            {versions.find(v => v.status === 'archived') && (
              <Button 
                variant="outline" 
                className="w-full justify-start text-primary hover:text-primary/80"
                onClick={() => {
                  const lastArchived = versions.find(v => v.status === 'archived');
                  if (lastArchived) {
                    handleRollback(lastArchived.id, lastArchived.number);
                  }
                }}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Rollback Disponível
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Versions;