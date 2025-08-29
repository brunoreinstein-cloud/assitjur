import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ReviewUpdateButton } from '@/components/admin/ReviewUpdateButton';
import { RefreshCw, Search, Filter } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Processo {
  cnj: string;
  status?: string;
  fase?: string;
  reclamante_nome?: string;
  classificacao_final?: string;
  triangulacao_confirmada?: boolean;
  troca_direta?: boolean;
  contem_prova_emprestada?: boolean;
  reclamante_foi_testemunha?: boolean;
  observacoes?: string;
  updated_at?: string;
}

export function ProcessosTable() {
  const [processos, setProcessos] = useState<Processo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [classificacaoFilter, setClassificacaoFilter] = useState('all');
  const { toast } = useToast();

  const loadProcessos = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('processos')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setProcessos(data as Processo[] || []);
    } catch (error) {
      console.error('Erro ao carregar processos:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar processos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProcessos();
  }, []);

  const filteredProcessos = processos.filter(processo => {
    const matchesSearch = !searchTerm || 
      processo.cnj?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      processo.reclamante_nome?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || processo.status === statusFilter;
    const matchesClassificacao = classificacaoFilter === 'all' || processo.classificacao_final === classificacaoFilter;
    
    return matchesSearch && matchesStatus && matchesClassificacao;
  });

  const getClassificacaoBadge = (classificacao?: string) => {
    switch (classificacao) {
      case 'CRÍTICO':
        return <Badge variant="destructive">CRÍTICO</Badge>;
      case 'ATENÇÃO':
        return <Badge variant="default">ATENÇÃO</Badge>;
      case 'OBSERVAÇÃO':
        return <Badge variant="secondary">OBSERVAÇÃO</Badge>;
      default:
        return <Badge variant="outline">-</Badge>;
    }
  };

  const getPatternFlags = (processo: Processo) => {
    const flags = [];
    if (processo.triangulacao_confirmada) flags.push('🔺 Triangulação');
    if (processo.troca_direta) flags.push('🔄 Troca Direta');
    if (processo.contem_prova_emprestada) flags.push('⚠️ Prova Emprestada');
    if (processo.reclamante_foi_testemunha) flags.push('👤 Duplo Papel');
    return flags;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            Processos AssistJur.IA ({filteredProcessos.length})
          </CardTitle>
          <div className="flex gap-2">
            <ReviewUpdateButton 
              orgId="current-org" 
              onSuccess={loadProcessos}
            />
            <Button 
              variant="outline" 
              onClick={loadProcessos}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
        </div>

        {/* Filtros */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por CNJ ou reclamante..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Status</SelectItem>
              <SelectItem value="ativo">Ativo</SelectItem>
              <SelectItem value="concluido">Concluído</SelectItem>
              <SelectItem value="suspenso">Suspenso</SelectItem>
              <SelectItem value="desconhecido">Desconhecido</SelectItem>
            </SelectContent>
          </Select>

          <Select value={classificacaoFilter} onValueChange={setClassificacaoFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Classificação" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Classificações</SelectItem>
              <SelectItem value="CRÍTICO">CRÍTICO</SelectItem>
              <SelectItem value="ATENÇÃO">ATENÇÃO</SelectItem>
              <SelectItem value="OBSERVAÇÃO">OBSERVAÇÃO</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>CNJ</TableHead>
                <TableHead>Reclamante</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Classificação</TableHead>
                <TableHead>Padrões Detectados</TableHead>
                <TableHead>Observações</TableHead>
                <TableHead>Atualizado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Carregando processos...
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredProcessos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Nenhum processo encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filteredProcessos.map((processo) => (
                  <TableRow key={processo.cnj}>
                    <TableCell className="font-mono text-sm">
                      {processo.cnj}
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <div className="truncate" title={processo.reclamante_nome}>
                        {processo.reclamante_nome || '-'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {processo.status || 'Desconhecido'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {getClassificacaoBadge(processo.classificacao_final)}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {getPatternFlags(processo).map((flag, index) => (
                          <span key={index} className="text-xs bg-muted px-2 py-1 rounded">
                            {flag}
                          </span>
                        ))}
                        {getPatternFlags(processo).length === 0 && (
                          <span className="text-muted-foreground text-xs">Nenhum</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <div className="text-xs text-muted-foreground truncate" title={processo.observacoes}>
                        {processo.observacoes || 'Validação nos autos é obrigatória'}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {processo.updated_at ? 
                        new Date(processo.updated_at).toLocaleDateString('pt-BR') : 
                        '-'
                      }
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {filteredProcessos.length > 0 && (
          <div className="mt-4 text-sm text-muted-foreground">
            Mostrando {filteredProcessos.length} de {processos.length} processos
          </div>
        )}
      </CardContent>
    </Card>
  );
}