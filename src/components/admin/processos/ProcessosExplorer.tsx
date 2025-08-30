import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, Database, RefreshCw } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { ProcessosToolbar } from './ProcessosToolbar';
import { ProcessosGrid } from './ProcessosGrid';
import { ProcessoDetailDrawer } from './ProcessoDetailDrawer';
import { ExportManager } from './ExportManager';
import { ProcessoRow, ProcessoQuery, ProcessoFiltersState, VersionInfo } from '@/types/processos-explorer';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { applyPIIMask } from '@/utils/pii-mask';

interface ProcessosExplorerProps {
  className?: string;
}

export function ProcessosExplorer({ className }: ProcessosExplorerProps) {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // UI State
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [selectedProcesso, setSelectedProcesso] = useState<ProcessoRow | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isPiiMasked, setIsPiiMasked] = useState(() => {
    return localStorage.getItem('processos_pii_masked') === 'true';
  });

  // Filters State
  const [filters, setFilters] = useState<ProcessoFiltersState>({
    search: '',
    uf: [],
    comarca: [],
    status: [],
    fase: [],
    classificacao: [],
    scoreRange: [0, 100],
    flags: {
      triangulacao: false,
      troca: false,
      prova: false,
      duplo: false
    }
  });

  // Pagination State
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [orderBy, setOrderBy] = useState<'updated_at'|'score_risco'|'uf'|'comarca'|'cnj'>('updated_at');
  const [orderDir, setOrderDir] = useState<'asc'|'desc'>('desc');

  // Save PII mask preference
  useEffect(() => {
    localStorage.setItem('processos_pii_masked', isPiiMasked.toString());
  }, [isPiiMasked]);

  // Build query from filters
  const buildQuery = (): ProcessoQuery => {
    const query: ProcessoQuery = {
      page,
      pageSize,
      orderBy,
      orderDir
    };

    if (filters.search.trim()) {
      query.q = filters.search.trim();
    }
    if (filters.uf.length > 0) query.uf = filters.uf;
    if (filters.comarca.length > 0) query.comarca = filters.comarca;
    if (filters.status.length > 0) query.status = filters.status;
    if (filters.fase.length > 0) query.fase = filters.fase;
    if (filters.classificacao.length > 0) query.class = filters.classificacao as any;
    if (filters.scoreRange[0] > 0 || filters.scoreRange[1] < 100) {
      query.scoreMin = filters.scoreRange[0];
      query.scoreMax = filters.scoreRange[1];
    }

    // Active flags only
    const activeFlags = Object.entries(filters.flags)
      .filter(([_, active]) => active)
      .reduce((acc, [key]) => ({ ...acc, [key]: true }), {});
    
    if (Object.keys(activeFlags).length > 0) {
      query.flags = activeFlags as any;
    }

    return query;
  };

  // Fetch version info
  const { data: versionInfo } = useQuery<VersionInfo>({
    queryKey: ['version-info', profile?.organization_id],
    queryFn: async () => {
      if (!profile?.organization_id) throw new Error('No organization');

      const { data, error } = await supabase
        .from('versions')
        .select('number, published_at, summary')
        .eq('org_id', profile.organization_id)
        .eq('status', 'published')
        .order('number', { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;
      
      return {
        number: data.number,
        publishedAt: data.published_at,
        totalRecords: 0 // TODO: extract from summary when available
      };
    },
    enabled: !!profile?.organization_id,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });

  // Fetch processos data
  const { 
    data: processosData, 
    isLoading, 
    error, 
    refetch 
  } = useQuery({
    queryKey: ['processos-explorer', profile?.organization_id, buildQuery()],
    queryFn: async () => {
      if (!profile?.organization_id) throw new Error('No organization');

      console.log('🔍 Fetching processos with query:', buildQuery());

      const { data, error } = await supabase.functions.invoke('mapa-testemunhas-processos', {
        body: {
          filters: buildQuery(),
          page,
          limit: pageSize
        }
      });

      if (error) throw error;
      
      // Apply PII masking if enabled
      const maskedData = {
        ...data,
        data: isPiiMasked ? applyPIIMask(data.data, true) : data.data
      };

      console.log('✅ Processos loaded:', maskedData);
      return maskedData;
    },
    enabled: !!profile?.organization_id,
    refetchOnWindowFocus: false,
    staleTime: 2 * 60 * 1000 // 2 minutes
  });

  // Handle row selection
  const handleRowSelection = (id: string, selected: boolean) => {
    const newSelection = new Set(selectedRows);
    if (selected) {
      newSelection.add(id);
    } else {
      newSelection.delete(id);
    }
    setSelectedRows(newSelection);
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected && processosData?.data) {
      setSelectedRows(new Set(processosData.data.map(p => p.id)));
    } else {
      setSelectedRows(new Set());
    }
  };

  // Handle row click
  const handleRowClick = (processo: ProcessoRow) => {
    setSelectedProcesso(processo);
    setIsDrawerOpen(true);
  };

  // Clear filters
  const handleClearFilters = () => {
    setFilters({
      search: '',
      uf: [],
      comarca: [],
      status: [],
      fase: [],
      classificacao: [],
      scoreRange: [0, 100],
      flags: {
        triangulacao: false,
        troca: false,
        prova: false,
        duplo: false
      }
    });
    setPage(1);
  };

  const hasActiveFilters = () => {
    return (
      filters.search.trim() !== '' ||
      filters.uf.length > 0 ||
      filters.comarca.length > 0 ||
      filters.status.length > 0 ||
      filters.fase.length > 0 ||
      filters.classificacao.length > 0 ||
      filters.scoreRange[0] > 0 ||
      filters.scoreRange[1] < 100 ||
      Object.values(filters.flags).some(Boolean)
    );
  };

  if (error) {
    return (
      <Card className="border-destructive/50 bg-destructive/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            Erro ao Carregar Dados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            {error instanceof Error ? error.message : 'Erro desconhecido'}
          </p>
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Tentar Novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Database className="h-8 w-8 text-primary" />
              Explorar Dados
            </h1>
            <p className="text-muted-foreground">Processos (versão {versionInfo?.number || '—'})</p>
          </div>
          
          <div className="flex items-center gap-2">
            {versionInfo && (
              <Badge variant="outline" className="text-xs">
                Versão v{versionInfo.number} • Última atualização: {' '}
                {new Date(versionInfo.publishedAt).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: '2-digit', 
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <ProcessosToolbar
        filters={filters}
        onFiltersChange={setFilters}
        isPiiMasked={isPiiMasked}
        onPiiMaskChange={setIsPiiMasked}
        hasActiveFilters={hasActiveFilters()}
        onClearFilters={handleClearFilters}
        onExport={() => setIsExportOpen(true)}
        selectedCount={selectedRows.size}
        totalCount={processosData?.count || 0}
      />

      {/* Loading State */}
      {isLoading && (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Grid */}
      {!isLoading && processosData && (
        <ProcessosGrid
          data={processosData.data}
          selectedRows={selectedRows}
          onRowSelection={handleRowSelection}
          onSelectAll={handleSelectAll}
          onRowClick={handleRowClick}
          page={page}
          pageSize={pageSize}
          total={processosData.count}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          orderBy={orderBy}
          orderDir={orderDir}
          onSort={(field, direction) => {
            setOrderBy(field);
            setOrderDir(direction);
            setPage(1);
          }}
          isPiiMasked={isPiiMasked}
        />
      )}

      {/* Empty State */}
      {!isLoading && processosData?.data.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Database className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum processo encontrado</h3>
            <p className="text-muted-foreground mb-4">
              {hasActiveFilters() 
                ? 'Nenhum processo corresponde aos filtros aplicados.' 
                : 'Não há dados disponíveis na versão publicada.'
              }
            </p>
            {hasActiveFilters() && (
              <Button variant="outline" onClick={handleClearFilters}>
                Limpar Filtros
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Detail Drawer */}
      <ProcessoDetailDrawer
        processo={selectedProcesso}
        open={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedProcesso(null);
        }}
        isPiiMasked={isPiiMasked}
      />

      {/* Export Manager */}
      <ExportManager
        open={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        data={processosData?.data || []}
        selectedData={processosData?.data?.filter(p => selectedRows.has(p.id)) || []}
        filters={buildQuery()}
        isPiiMasked={isPiiMasked}
      />
    </div>
  );
}