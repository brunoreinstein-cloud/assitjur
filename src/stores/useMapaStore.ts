import { create } from 'zustand';
import { PorProcesso, PorTestemunha } from '@/types/mapa-testemunhas';

export interface ProcessoFilters {
  search?: string;
  uf?: string[];
  status?: string[];
  fase?: string[];
  triangulacao?: boolean;
  troca_direta?: boolean;
  prova_emprestada?: boolean;
  rangeDeposUnicos?: [number, number];
}

export interface TestemunhaFilters {
  search?: string;
  rangeDepoimentos?: [number, number];
  ambos_polos?: boolean;
  ja_reclamante?: boolean;
  classificacao_estrategica?: string[];
}

export interface MapaState {
  // Navigation
  tab: 'por-processo' | 'por-testemunha';
  
  // Filters
  processoFilters: ProcessoFilters;
  testemunhaFilters: TestemunhaFilters;
  
  // Table state
  page: number;
  pageSize: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
  selectedRows: string[];
  columnVisibility: Record<string, boolean>;
  
  // Data
  rows: (PorProcesso | PorTestemunha)[];
  total: number;
  loading: boolean;
  
  // UI state
  maskPII: boolean;
  selectedItem: PorProcesso | PorTestemunha | null;
  isDetailDrawerOpen: boolean;
  
  // Actions
  setTab: (tab: 'por-processo' | 'por-testemunha') => void;
  setProcessoFilters: (filters: Partial<ProcessoFilters>) => void;
  setTestemunhaFilters: (filters: Partial<TestemunhaFilters>) => void;
  resetFilters: () => void;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  setSort: (sortBy?: string, sortDir?: 'asc' | 'desc') => void;
  setSelectedRows: (rows: string[]) => void;
  setColumnVisibility: (visibility: Record<string, boolean>) => void;
  setRows: (rows: (PorProcesso | PorTestemunha)[], total: number) => void;
  setLoading: (loading: boolean) => void;
  setMaskPII: (mask: boolean) => void;
  setSelectedItem: (item: PorProcesso | PorTestemunha | null) => void;
  setDetailDrawerOpen: (open: boolean) => void;
  
  // Preset filters
  applyTriangulacaoPreset: () => void;
  applyTrocaDiretaPreset: () => void;
  applyProvaEmprestadaPreset: () => void;
}

const initialProcessoFilters: ProcessoFilters = {};
const initialTestemunhaFilters: TestemunhaFilters = {};

export const useMapaStore = create<MapaState>((set, get) => ({
  // Initial state
  tab: 'por-processo',
  processoFilters: initialProcessoFilters,
  testemunhaFilters: initialTestemunhaFilters,
  page: 1,
  pageSize: 10,
  selectedRows: [],
  columnVisibility: {},
  rows: [],
  total: 0,
  loading: false,
  maskPII: false,
  selectedItem: null,
  isDetailDrawerOpen: false,

  // Actions
  setTab: (tab) => {
    set({ tab, page: 1, selectedRows: [] });
  },
  
  setProcessoFilters: (filters) => {
    set((state) => ({
      processoFilters: { ...state.processoFilters, ...filters },
      page: 1,
      selectedRows: []
    }));
  },
  
  setTestemunhaFilters: (filters) => {
    set((state) => ({
      testemunhaFilters: { ...state.testemunhaFilters, ...filters },
      page: 1,
      selectedRows: []
    }));
  },
  
  resetFilters: () => {
    set({
      processoFilters: initialProcessoFilters,
      testemunhaFilters: initialTestemunhaFilters,
      page: 1,
      selectedRows: []
    });
  },
  
  setPage: (page) => set({ page }),
  setPageSize: (pageSize) => set({ pageSize, page: 1 }),
  setSort: (sortBy, sortDir) => set({ sortBy, sortDir, page: 1 }),
  setSelectedRows: (selectedRows) => set({ selectedRows }),
  setColumnVisibility: (columnVisibility) => set({ columnVisibility }),
  setRows: (rows, total) => set({ rows, total }),
  setLoading: (loading) => set({ loading }),
  setMaskPII: (maskPII) => set({ maskPII }),
  setSelectedItem: (selectedItem) => set({ selectedItem }),
  setDetailDrawerOpen: (isDetailDrawerOpen) => set({ isDetailDrawerOpen }),
  
  // Preset filters
  applyTriangulacaoPreset: () => {
    set({
      tab: 'por-processo',
      processoFilters: { triangulacao: true },
      page: 1,
      selectedRows: []
    });
  },
  
  applyTrocaDiretaPreset: () => {
    set({
      tab: 'por-processo', 
      processoFilters: { troca_direta: true },
      page: 1,
      selectedRows: []
    });
  },
  
  applyProvaEmprestadaPreset: () => {
    set({
      tab: 'por-processo',
      processoFilters: { prova_emprestada: true },
      page: 1,
      selectedRows: []
    });
  },
}));

// URL sync utility
export const syncUrlWithState = (state: MapaState, updateUrl: (params: URLSearchParams) => void) => {
  const params = new URLSearchParams();
  
  params.set('tab', state.tab);
  
  if (state.tab === 'por-processo') {
    const filters = state.processoFilters;
    if (filters.search) params.set('search', filters.search);
    if (filters.uf?.length) params.set('uf', filters.uf.join(','));
    if (filters.status?.length) params.set('status', filters.status.join(','));
    if (filters.fase?.length) params.set('fase', filters.fase.join(','));
    if (filters.triangulacao) params.set('triangulacao', 'true');
    if (filters.troca_direta) params.set('troca', 'true');
    if (filters.prova_emprestada) params.set('prova', 'true');
  } else {
    const filters = state.testemunhaFilters;
    if (filters.search) params.set('search', filters.search);
    if (filters.ambos_polos) params.set('ambos_polos', 'true');
    if (filters.ja_reclamante) params.set('ja_reclamante', 'true');
    if (filters.classificacao_estrategica?.length) {
      params.set('classificacao', filters.classificacao_estrategica.join(','));
    }
  }
  
  if (state.page > 1) params.set('page', state.page.toString());
  if (state.sortBy) params.set('sort', `${state.sortBy}:${state.sortDir || 'asc'}`);
  
  updateUrl(params);
};

export const parseUrlToState = (searchParams: URLSearchParams): Partial<MapaState> => {
  const tab = (searchParams.get('tab') || 'por-processo') as 'por-processo' | 'por-testemunha';
  const page = parseInt(searchParams.get('page') || '1');
  const sort = searchParams.get('sort');
  let sortBy: string | undefined;
  let sortDir: 'asc' | 'desc' | undefined;
  
  if (sort) {
    const [field, direction] = sort.split(':');
    sortBy = field;
    sortDir = direction as 'asc' | 'desc';
  }
  
  const processoFilters: ProcessoFilters = {};
  const testemunhaFilters: TestemunhaFilters = {};
  
  const search = searchParams.get('search');
  if (search) {
    if (tab === 'por-processo') {
      processoFilters.search = search;
    } else {
      testemunhaFilters.search = search;
    }
  }
  
  if (tab === 'por-processo') {
    const uf = searchParams.get('uf');
    if (uf) processoFilters.uf = uf.split(',');
    
    const status = searchParams.get('status');
    if (status) processoFilters.status = status.split(',');
    
    const fase = searchParams.get('fase');
    if (fase) processoFilters.fase = fase.split(',');
    
    if (searchParams.get('triangulacao')) processoFilters.triangulacao = true;
    if (searchParams.get('troca')) processoFilters.troca_direta = true;
    if (searchParams.get('prova')) processoFilters.prova_emprestada = true;
  } else {
    if (searchParams.get('ambos_polos')) testemunhaFilters.ambos_polos = true;
    if (searchParams.get('ja_reclamante')) testemunhaFilters.ja_reclamante = true;
    
    const classificacao = searchParams.get('classificacao');
    if (classificacao) testemunhaFilters.classificacao_estrategica = classificacao.split(',');
  }
  
  return {
    tab,
    page,
    sortBy,
    sortDir,
    processoFilters,
    testemunhaFilters,
  };
};