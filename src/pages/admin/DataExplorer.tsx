import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Database, 
  Search, 
  Edit, 
  Trash2, 
  Filter,
  Download,
  Eye
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const DataExplorer = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);

  // Mock data - will be replaced with real data from Supabase
  const processos = [
    {
      id: '1',
      cnj: '5001234-12.2024.5.01.0001',
      cnj_normalizado: '50012341220245010001',
      comarca: 'São Paulo',
      tribunal: 'TRT 2ª Região',
      fase: 'Instrução',
      status: 'Em andamento',
      reclamante_nome: 'João Silva',
      reu_nome: 'Empresa ABC Ltda',
      data_audiencia: '2024-02-15',
      triangulacao_confirmada: true,
      score_risco: 75,
      created_at: '2024-01-15 10:30'
    },
    {
      id: '2',
      cnj: '5001234-12.2024.5.01.0002',
      cnj_normalizado: '50012341220245010002',
      comarca: 'Rio de Janeiro',
      tribunal: 'TRT 1ª Região',
      fase: 'Sentença',
      status: 'Finalizado',
      reclamante_nome: 'Maria Oliveira',
      reu_nome: 'Empresa XYZ S.A.',
      data_audiencia: '2024-01-20',
      triangulacao_confirmada: false,
      score_risco: 45,
      created_at: '2024-01-10 14:20'
    }
  ];

  const pessoas = [
    {
      id: '1',
      nome_civil: 'João Silva',
      cpf_mask: '123.456.789-**',
      apelidos: ['João', 'J. Silva'],
      processos_count: 3,
      created_at: '2024-01-15 10:30'
    },
    {
      id: '2',
      nome_civil: 'Maria Oliveira',
      cpf_mask: '987.654.321-**',
      apelidos: ['Maria', 'M. Oliveira'],
      processos_count: 1,
      created_at: '2024-01-10 14:20'
    }
  ];

  const handleEdit = (record: any) => {
    setSelectedRecord(record);
    setIsEditDialogOpen(true);
  };

  const handleDelete = (record: any) => {
    toast({
      title: "Registro excluído",
      description: `${record.cnj || record.nome_civil} foi removido da base`,
    });
  };

  const getScoreBadge = (score: number) => {
    if (score >= 70) return <Badge variant="destructive">Alto ({score})</Badge>;
    if (score >= 40) return <Badge variant="default" className="bg-orange-500">Médio ({score})</Badge>;
    return <Badge variant="secondary">Baixo ({score})</Badge>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Explorar Dados</h1>
        <p className="text-muted-foreground">
          Visualize, edite e gerencie registros da base de dados
        </p>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Busca e Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Buscar por CNJ, nome ou CPF..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os registros</SelectItem>
                <SelectItem value="high_risk">Alto risco</SelectItem>
                <SelectItem value="triangulation">Com triangulação</SelectItem>
                <SelectItem value="recent">Recentes</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filtros Avançados
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="processos" className="space-y-4">
        <TabsList>
          <TabsTrigger value="processos">Processos</TabsTrigger>
          <TabsTrigger value="pessoas">Pessoas</TabsTrigger>
        </TabsList>

        <TabsContent value="processos">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Processos ({processos.length.toLocaleString()})
                </div>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Exportar
                </Button>
              </CardTitle>
              <CardDescription>
                Listagem completa dos processos na base
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>CNJ</TableHead>
                    <TableHead>Comarca</TableHead>
                    <TableHead>Reclamante</TableHead>
                    <TableHead>Réu</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {processos.map((processo) => (
                    <TableRow key={processo.id}>
                      <TableCell className="font-mono text-sm">
                        {processo.cnj}
                      </TableCell>
                      <TableCell>{processo.comarca}</TableCell>
                      <TableCell>{processo.reclamante_nome}</TableCell>
                      <TableCell>{processo.reu_nome}</TableCell>
                      <TableCell>
                        <Badge variant={processo.status === 'Em andamento' ? 'default' : 'secondary'}>
                          {processo.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {getScoreBadge(processo.score_risco)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleEdit(processo)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleEdit(processo)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-red-600"
                            onClick={() => handleDelete(processo)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pessoas">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Pessoas ({pessoas.length.toLocaleString()})
                </div>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Exportar
                </Button>
              </CardTitle>
              <CardDescription>
                Listagem de pessoas identificadas na base
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome Civil</TableHead>
                    <TableHead>CPF</TableHead>
                    <TableHead>Apelidos</TableHead>
                    <TableHead>Processos</TableHead>
                    <TableHead>Criado em</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pessoas.map((pessoa) => (
                    <TableRow key={pessoa.id}>
                      <TableCell className="font-medium">
                        {pessoa.nome_civil}
                      </TableCell>
                      <TableCell className="font-mono">
                        {pessoa.cpf_mask}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {pessoa.apelidos.map((apelido, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {apelido}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {pessoa.processos_count}
                        </Badge>
                      </TableCell>
                      <TableCell>{pessoa.created_at}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleEdit(pessoa)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleEdit(pessoa)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-red-600"
                            onClick={() => handleDelete(pessoa)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Registro</DialogTitle>
            <DialogDescription>
              Faça alterações nos dados do registro selecionado
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Formulário de edição será implementado aqui
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={() => setIsEditDialogOpen(false)}>
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DataExplorer;