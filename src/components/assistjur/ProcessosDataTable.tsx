import React, { useState } from 'react';
import { useAssistJurProcessos, ProcessosFilters } from '@/hooks/useAssistJurProcessos';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrayField } from '@/components/mapa-testemunhas/ArrayField';
import { applyPIIMask } from '@/utils/pii-mask';
import { Eye, Download, Filter, X, ExternalLink, Bug } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

export function ProcessosDataTable() {
  const [filters, setFilters] = useState<ProcessosFilters>({});
  const [isPiiMasked, setIsPiiMasked] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const { 
    data: processos, 
    totalCount, 
    currentPage, 
    totalPages, 
    isLoading, 
    error, 
    setPage 
  } = useAssistJurProcessos(filters);

  const handleSearchChange = (search: string) => {
    setFilters(prev => ({ ...prev, search: search.trim() || undefined }));
    setPage(1);
  };

  const handleClassificacaoChange = (classificacao: string) => {
    if (classificacao === 'all') {
      setFilters(prev => ({ ...prev, classificacao: undefined }));
    } else {
      setFilters(prev => ({ ...prev, classificacao: [classificacao] }));
    }
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({});
    setPage(1);
  };

  const getClassificacaoColor = (classificacao: string) => {
    switch (classificacao?.toLowerCase()) {
      case 'crítico': return 'destructive';
      case 'atenção': return 'secondary';
      case 'observação': return 'outline';
      default: return 'secondary';
    }
  };

  const exportToCSV = () => {
    try {
      const headers = ['CNJ', 'Reclamante', 'Reclamada', 'Testemunhas Ativas', 'Testemunhas Passivas', 'Qtd Total', 'Classificação', 'Data Criação'];
      const csvData = [
        headers.join(','),
        ...processos.map(processo => [
          processo.cnj,
          `"${processo.reclamante}"`,
          `"${processo.reclamada}"`,
          `"${processo.testemunhas_ativas.join('; ')}"`,
          `"${processo.testemunhas_passivas.join('; ')}"`,
          processo.qtd_testemunhas,
          `"${processo.classificacao}"`,
          format(new Date(processo.created_at), 'dd/MM/yyyy', { locale: ptBR })
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `assistjur-processos-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      link.click();
      
      toast.success(`Exportação concluída: ${processos.length} processos`);
    } catch (err) {
      console.error('Erro na exportação CSV:', err);
      toast.error('Erro ao exportar dados. Tente novamente.');
    }
  };

  const openLogs = () => {
    const logsUrl = 'https://supabase.com/dashboard/project/fgjypmlszuzkgvhuszxn/functions/assistjur-processos/logs';
    window.open(logsUrl, '_blank');
    toast.info('Abrindo logs da Edge Function...');
  };

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center space-y-4">
          <div className="space-y-2">
            <p className="text-destructive font-medium">Erro ao carregar processos</p>
            <p className="text-sm text-muted-foreground">{error.message}</p>
          </div>
          <div className="flex items-center justify-center gap-2">
            <Button variant="outline" onClick={() => window.location.reload()}>
              Tentar novamente
            </Button>
            <Button variant="outline" onClick={openLogs} size="sm">
              <Bug className="h-4 w-4 mr-2" />
              Abrir Logs
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com controles */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold">Processos AssistJur.IA</h2>
            <p className="text-muted-foreground">
              {totalCount} processos encontrados
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filtros
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsPiiMasked(!isPiiMasked)}
            >
              {isPiiMasked ? 'Mostrar Dados' : 'Mascarar PII'}
            </Button>
            <Button variant="outline" onClick={exportToCSV}>
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
            <Button variant="outline" onClick={openLogs} size="sm">
              <ExternalLink className="h-4 w-4 mr-2" />
              Abrir Logs
            </Button>
          </div>
        </div>

        {/* Filtros expansíveis */}
        {showFilters && (
          <div className="border-t pt-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Buscar</label>
                <Input
                  placeholder="CNJ, reclamante, reclamada..."
                  value={filters.search || ''}
                  onChange={(e) => handleSearchChange(e.target.value)}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Classificação</label>
                <Select 
                  value={filters.classificacao?.[0] || 'all'} 
                  onValueChange={handleClassificacaoChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="crítico">Crítico</SelectItem>
                    <SelectItem value="atenção">Atenção</SelectItem>
                    <SelectItem value="observação">Observação</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button variant="outline" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-2" />
                  Limpar
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Tabela de dados */}
      <Card>
        <div className="border border-border/50 rounded-2xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="font-semibold">CNJ</TableHead>
                <TableHead className="font-semibold">Reclamante</TableHead>
                <TableHead className="font-semibold">Reclamada</TableHead>
                <TableHead className="font-semibold">Testemunhas Ativas</TableHead>
                <TableHead className="font-semibold">Testemunhas Passivas</TableHead>
                <TableHead className="font-semibold text-center">Qtd Total</TableHead>
                <TableHead className="font-semibold">Classificação</TableHead>
                <TableHead className="font-semibold">Data</TableHead>
                <TableHead className="font-semibold text-center">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell className="h-16">
                      <div className="animate-pulse bg-muted rounded h-4 w-24" />
                    </TableCell>
                    <TableCell className="h-16">
                      <div className="animate-pulse bg-muted rounded h-4 w-32" />
                    </TableCell>
                    <TableCell className="h-16">
                      <div className="animate-pulse bg-muted rounded h-4 w-28" />
                    </TableCell>
                    <TableCell className="h-16">
                      <div className="animate-pulse bg-muted rounded h-4 w-20" />
                    </TableCell>
                    <TableCell className="h-16">
                      <div className="animate-pulse bg-muted rounded h-4 w-20" />
                    </TableCell>
                    <TableCell className="h-16">
                      <div className="animate-pulse bg-muted rounded h-4 w-8" />
                    </TableCell>
                    <TableCell className="h-16">
                      <div className="animate-pulse bg-muted rounded h-4 w-16" />
                    </TableCell>
                    <TableCell className="h-16">
                      <div className="animate-pulse bg-muted rounded h-4 w-12" />
                    </TableCell>
                    <TableCell className="h-16">
                      <div className="animate-pulse bg-muted rounded h-4 w-8" />
                    </TableCell>
                  </TableRow>
                ))
              ) : processos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    <p className="text-muted-foreground">Nenhum processo encontrado</p>
                    {(filters.search || filters.classificacao) && (
                      <Button variant="link" onClick={clearFilters}>
                        Limpar filtros
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                processos.map((processo) => (
                  <TableRow key={processo.cnj} className="hover:bg-muted/20">
                    <TableCell className="font-mono text-xs max-w-[120px] truncate">
                      {applyPIIMask(processo.cnj, isPiiMasked)}
                    </TableCell>
                    <TableCell className="font-medium max-w-[150px] truncate">
                      {applyPIIMask(processo.reclamante, isPiiMasked)}
                    </TableCell>
                    <TableCell className="max-w-[150px] truncate">
                      {applyPIIMask(processo.reclamada, isPiiMasked)}
                    </TableCell>
                    <TableCell className="max-w-[200px]">
                      <ArrayField 
                        items={processo.testemunhas_ativas} 
                        maxVisible={2}
                        isPiiMasked={isPiiMasked}
                      />
                    </TableCell>
                    <TableCell className="max-w-[200px]">
                      <ArrayField 
                        items={processo.testemunhas_passivas} 
                        maxVisible={2}
                        isPiiMasked={isPiiMasked}
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className="text-xs">
                        {processo.qtd_testemunhas}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={getClassificacaoColor(processo.classificacao)}
                        className="text-xs"
                      >
                        {processo.classificacao}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {format(new Date(processo.created_at), 'dd/MM/yy', { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t">
            <p className="text-sm text-muted-foreground">
              Página {currentPage} de {totalPages} • {totalCount} registros
            </p>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setPage(Math.max(1, currentPage - 1))}
                disabled={currentPage <= 1}
              >
                Anterior
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setPage(currentPage + 1)}
                disabled={currentPage >= totalPages}
              >
                Próxima
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}