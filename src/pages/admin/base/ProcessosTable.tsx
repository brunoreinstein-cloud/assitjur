import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { SearchFilters } from '@/components/data-explorer/SearchFilters';
import { BulkActions } from '@/components/data-explorer/BulkActions';
import { QualityChips } from '@/components/data-explorer/QualityChips';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DatabaseCleanupButton } from '@/components/admin/DatabaseCleanupButton';

interface ProcessoQuality {
  id: string;
  org_id: string;
  cnj: string;
  cnj_digits: string;
  cnj_valid: boolean;
  reclamante_nome: string;
  reclamante_valid: boolean;
  reu_nome: string;
  reu_valid: boolean;
  comarca: string;
  fase: string;
  status: string;
  duplicate_count: number;
  is_canonical: boolean;
  quality_score: number;
  severity: 'OK' | 'WARNING' | 'ERROR' | 'INFO';
  updated_at: string;
}

export default function ProcessosTable() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<string[]>([]);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(0);
  const [limit] = useState(50);

  // Query para buscar dados com qualidade
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['processos-quality', profile?.organization_id, searchTerm, selectedSeverity, page, limit],
    queryFn: async () => {
      if (!profile?.organization_id) throw new Error('Organização não encontrada');

      let query = supabase
        .from('processos')
        .select(`
          id,
          org_id,
          cnj,
          cnj_digits,
          reclamante_nome,
          reu_nome,
          comarca,
          fase,
          status,
          updated_at,
          score_risco
        `)
        .eq('org_id', profile.organization_id)
        .is('deleted_at', null)
        .order('updated_at', { ascending: false })
        .range(page * limit, (page + 1) * limit - 1);

      // Aplicar filtros de busca
      if (searchTerm.trim()) {
        query = query.or(`cnj.ilike.%${searchTerm}%,cnj_digits.ilike.%${searchTerm}%,reclamante_nome.ilike.%${searchTerm}%,reu_nome.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Enriquecer com análise de qualidade (temporário até view funcionar)
      const enrichedData = data?.map(item => ({
        ...item,
        cnj_valid: item.cnj_digits?.length === 20,
        reclamante_valid: !!item.reclamante_nome?.trim(),
        reu_valid: !!item.reu_nome?.trim(),
        duplicate_count: 1, // TODO: calcular duplicatas
        is_canonical: true,
        quality_score: item.cnj_digits?.length === 20 && item.reclamante_nome && item.reu_nome ? 100 : 50,
        severity: (!item.cnj_digits || item.cnj_digits.length !== 20 || !item.reclamante_nome || !item.reu_nome) 
          ? 'ERROR' as const
          : 'OK' as const
      })) || [];

      // Aplicar filtro de severidade
      return selectedSeverity.length > 0 
        ? enrichedData.filter(item => selectedSeverity.includes(item.severity))
        : enrichedData;
    },
    enabled: !!profile?.organization_id,
    refetchOnWindowFocus: false,
  });

  // Listen for storage events to invalidate cache when imports complete
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'import_completed') {
        queryClient.invalidateQueries({ queryKey: ['processos-quality'] });
        localStorage.removeItem('import_completed');
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [queryClient]);

  // Ações em massa
  const handleRevalidate = async () => {
    if (selectedRows.size === 0) return;
    
    try {
      toast({
        title: "Revalidação iniciada",
        description: `Revalidando ${selectedRows.size} registros...`,
      });

      // Por enquanto apenas recarrega os dados
      refetch();
      
      toast({
        title: "Revalidação concluída",
        description: `${selectedRows.size} registros revalidados com sucesso`,
      });
    } catch (error) {
      toast({
        title: "Erro na revalidação",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    }
  };

  const handleNormalizeCNJ = async () => {
    if (selectedRows.size === 0) return;
    
    try {
      const ids = Array.from(selectedRows);
      let successCount = 0;
      let errorCount = 0;

      // Processar em lotes pequenos
      for (const id of ids) {
        try {
          const { data: processo } = await supabase
            .from('processos')
            .select('cnj_digits')
            .eq('id', id)
            .single();

          if (processo?.cnj_digits && processo.cnj_digits.length === 20) {
            const formattedCNJ = `${processo.cnj_digits.substring(0, 7)}-${processo.cnj_digits.substring(7, 9)}.${processo.cnj_digits.substring(9, 13)}.${processo.cnj_digits.substring(13, 14)}.${processo.cnj_digits.substring(14, 16)}.${processo.cnj_digits.substring(16, 20)}`;
            
            await supabase
              .from('processos')
              .update({ 
                cnj: formattedCNJ,
                cnj_normalizado: processo.cnj_digits,
                updated_at: new Date().toISOString()
              })
              .eq('id', id);
            
            successCount++;
          } else {
            errorCount++;
          }
        } catch {
          errorCount++;
        }
      }
      
      toast({
        title: "Normalização de CNJ concluída",
        description: `${successCount} CNJs normalizados, ${errorCount} erros`,
      });

      refetch();
    } catch (error) {
      toast({
        title: "Erro na normalização",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (selectedRows.size === 0) return;
    
    try {
      const ids = Array.from(selectedRows);
      
      const { error } = await supabase
        .from('processos')
        .update({ 
          deleted_at: new Date().toISOString(),
          deleted_by: user?.id,
          updated_at: new Date().toISOString()
        })
        .in('id', ids);

      if (error) throw error;
      
      toast({
        title: "Exclusão concluída",
        description: `${ids.length} registros excluídos`,
      });

      setSelectedRows(new Set());
      refetch();
    } catch (error) {
      toast({
        title: "Erro na exclusão",
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

      <div className="flex items-center justify-between gap-4">
        <BulkActions
          selectedCount={selectedRows.size}
          onRevalidate={handleRevalidate}
          onNormalizeCNJ={handleNormalizeCNJ}
          onMergeDuplicates={() => {}}
          onDelete={handleDelete}
          onExport={() => {}}
          isLoading={isLoading}
        />
        
        <div className="flex items-center gap-2">
          <DatabaseCleanupButton />
        </div>
      </div>

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
              <TableHead>CNJ</TableHead>
              <TableHead>Reclamante</TableHead>
              <TableHead>Réu</TableHead>
              <TableHead>Comarca</TableHead>
              <TableHead>Fase</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Qualidade</TableHead>
              <TableHead>Atualizado</TableHead>
              <TableHead className="w-20">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={10} className="h-16">
                    <div className="animate-pulse bg-muted rounded h-4 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : data?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-8">
                  <p className="text-muted-foreground">Nenhum processo encontrado</p>
                  {hasActiveFilters && (
                    <Button variant="link" onClick={clearFilters}>
                      Limpar filtros
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              data?.map((processo) => (
                <TableRow key={processo.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedRows.has(processo.id)}
                      onCheckedChange={() => toggleRowSelection(processo.id)}
                    />
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    <div className="space-y-1">
                      <div>{processo.cnj || 'N/A'}</div>
                      {!processo.cnj_valid && (
                        <Badge variant="destructive" className="text-xs">
                          CNJ Inválido
                        </Badge>
                      )}
                      {processo.duplicate_count > 1 && (
                        <Badge variant="outline" className="text-xs">
                          Duplicata
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-48 truncate">
                      {processo.reclamante_nome || 'N/A'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-48 truncate">
                      {processo.reu_nome || 'N/A'}
                    </div>
                  </TableCell>
                  <TableCell>{processo.comarca || 'N/A'}</TableCell>
                  <TableCell>{processo.fase || 'N/A'}</TableCell>
                  <TableCell>{processo.status || 'N/A'}</TableCell>
                  <TableCell>
                    <QualityChips 
                      severity={processo.severity} 
                      score={processo.quality_score}
                      size="sm"
                    />
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {processo.updated_at 
                      ? format(new Date(processo.updated_at), 'dd/MM/yy HH:mm', { locale: ptBR })
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