import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { SearchFilters } from '@/components/data-explorer/SearchFilters';
import { BulkActions } from '@/components/data-explorer/BulkActions';
import { QualityChips } from '@/components/data-explorer/QualityChips';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Eye, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PessoaQuality {
  id: string;
  org_id: string;
  nome_civil: string;
  nome_valid: boolean;
  cpf_mask: string;
  apelidos: string[];
  duplicate_count: number;
  is_canonical: boolean;
  quality_score: number;
  severity: 'OK' | 'WARNING' | 'ERROR' | 'INFO';
  updated_at: string;
}

export default function TestemunhasTable() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<string[]>([]);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(0);
  const [limit] = useState(50);

  // Query para buscar dados de pessoas/testemunhas
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['pessoas-quality', profile?.organization_id, searchTerm, selectedSeverity, page, limit],
    queryFn: async () => {
      if (!profile?.organization_id) throw new Error('Organização não encontrada');

      let query = supabase
        .from('pessoas')
        .select(`
          id,
          org_id,
          nome_civil,
          cpf_mask,
          apelidos,
          updated_at
        `)
        .eq('org_id', profile.organization_id)
        .order('updated_at', { ascending: false })
        .range(page * limit, (page + 1) * limit - 1);

      // Aplicar filtros de busca
      if (searchTerm.trim()) {
        query = query.or(`
          nome_civil.ilike.%${searchTerm}%,
          cpf_mask.ilike.%${searchTerm}%
        `);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Enriquecer com análise de qualidade (temporário até view funcionar)
      const enrichedData = data?.map(item => ({
        ...item,
        nome_valid: !!item.nome_civil?.trim(),
        duplicate_count: 1, // TODO: calcular duplicatas
        is_canonical: true,
        quality_score: item.nome_civil?.trim() ? 100 : 25,
        severity: !item.nome_civil?.trim() ? 'ERROR' as const : 'OK' as const
      })) || [];

      // Aplicar filtro de severidade
      return selectedSeverity.length > 0 
        ? enrichedData.filter(item => selectedSeverity.includes(item.severity))
        : enrichedData;
    },
    enabled: !!profile?.organization_id,
  });

  // Ações em massa específicas para testemunhas
  const handleFillDefaultReu = async () => {
    if (selectedRows.size === 0) return;
    
    try {
      // TODO: Implementar RPC para preencher réu padrão em testemunhas
      toast({
        title: "Funcionalidade em desenvolvimento",
        description: "Aplicar réu padrão será implementado em breve",
      });
    } catch (error) {
      toast({
        title: "Erro ao aplicar réu padrão",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    }
  };

  // Controles de seleção
  const toggleRowSelection = (id: string) => {
    const newSelection = new Set(selectedRows);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedRows(newSelection);
  };

  const toggleAllSelection = () => {
    if (selectedRows.size === data?.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(data?.map(item => item.id)));
    }
  };

  const hasActiveFilters = searchTerm.trim() !== '' || selectedSeverity.length > 0;

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedSeverity([]);
    setPage(0);
  };

  if (error) {
    return (
      <div className="p-6 text-center">
        <p className="text-destructive">Erro ao carregar dados: {error.message}</p>
        <Button variant="outline" onClick={() => refetch()}>Tentar novamente</Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <SearchFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedSeverity={selectedSeverity}
        onSeverityChange={setSelectedSeverity}
        onClearFilters={clearFilters}
        hasActiveFilters={hasActiveFilters}
      />

      <BulkActions
        selectedCount={selectedRows.size}
        onRevalidate={() => refetch()}
        onNormalizeCNJ={() => {}} // Não aplicável a testemunhas
        onFillDefaultReu={handleFillDefaultReu}
        onMergeDuplicates={() => {}}
        onDelete={() => {}}
        onExport={() => {}}
        isLoading={isLoading}
        showTestemunhaActions={true}
      />

      <div className="border rounded-md bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={data?.length > 0 && selectedRows.size === data.length}
                  onCheckedChange={toggleAllSelection}
                />
              </TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>CPF</TableHead>
              <TableHead>Apelidos</TableHead>
              <TableHead>Qualidade</TableHead>
              <TableHead>Atualizado</TableHead>
              <TableHead className="w-20">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={7} className="h-16">
                    <div className="animate-pulse bg-muted rounded h-4 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : data?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <p className="text-muted-foreground">Nenhuma testemunha encontrada</p>
                  {hasActiveFilters && (
                    <Button variant="link" onClick={clearFilters}>
                      Limpar filtros
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              data?.map((pessoa) => (
                <TableRow key={pessoa.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedRows.has(pessoa.id)}
                      onCheckedChange={() => toggleRowSelection(pessoa.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="max-w-64 truncate">
                      {pessoa.nome_civil || 'N/A'}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {pessoa.cpf_mask || 'N/A'}
                  </TableCell>
                  <TableCell>
                    <div className="max-w-48">
                      {pessoa.apelidos && pessoa.apelidos.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {pessoa.apelidos.slice(0, 2).map((apelido, idx) => (
                            <span key={idx} className="text-xs bg-muted px-2 py-1 rounded">
                              {apelido}
                            </span>
                          ))}
                          {pessoa.apelidos.length > 2 && (
                            <span className="text-xs text-muted-foreground">
                              +{pessoa.apelidos.length - 2}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Nenhum</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <QualityChips 
                      severity={pessoa.severity} 
                      score={pessoa.quality_score}
                      size="sm"
                    />
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {pessoa.updated_at 
                      ? format(new Date(pessoa.updated_at), 'dd/MM/yy HH:mm', { locale: ptBR })
                      : 'N/A'
                    }
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination TODO */}
      <div className="flex items-center justify-center">
        <p className="text-sm text-muted-foreground">
          Mostrando {data?.length || 0} registros
        </p>
      </div>
    </div>
  );
}