import { create } from 'zustand';
import { Processo, Testemunha, FilterProcesso, FilterTestemunha, TabType, ErrorState } from '@/types/mapa';

interface MapaTestemunhasStore {
  // Data
  processos: Processo[];
  testemunhas: Testemunha[];
  
  // UI State
  activeTab: TabType;
  selectedProcesso: Processo | null;
  selectedTestemunha: Testemunha | null;
  isDetailDrawerOpen: boolean;
  isImportModalOpen: boolean;
  isLoading: boolean;
  isPiiMasked: boolean;
  hasError: boolean;
  errorMessage: string;
  lastUpdate: Date | null;
  
  // Filters
  processoFilters: FilterProcesso;
  testemunhaFilters: FilterTestemunha;
  
  // Pagination
  processosPage: number;
  testemunhasPage: number;
  pageSize: number;
  totalProcessos: number;
  totalTestemunhas: number;
  
  // Actions
  setActiveTab: (tab: TabType) => void;
  setProcessos: (processos: Processo[]) => void;
  setTestemunhas: (testemunhas: Testemunha[]) => void;
  setSelectedProcesso: (processo: Processo | null) => void;
  setSelectedTestemunha: (testemunha: Testemunha | null) => void;
  setIsDetailDrawerOpen: (open: boolean) => void;
  setIsImportModalOpen: (open: boolean) => void;
  setIsLoading: (loading: boolean) => void;
  setIsPiiMasked: (masked: boolean) => void;
  setError: (error: boolean, message?: string) => void;
  setLastUpdate: (date: Date | null) => void;
  setProcessoFilters: (filters: Partial<FilterProcesso>) => void;
  setTestemunhaFilters: (filters: Partial<FilterTestemunha>) => void;
  setProcessosPage: (page: number) => void;
  setTestemunhasPage: (page: number) => void;
  setTotalProcessos: (total: number) => void;
  setTotalTestemunhas: (total: number) => void;
  resetFilters: () => void;
}

export const useMapaTestemunhasStore = create<MapaTestemunhasStore>((set) => ({
  // Initial state
  processos: [],
  testemunhas: [],
  activeTab: 'processos',
  selectedProcesso: null,
  selectedTestemunha: null,
  isDetailDrawerOpen: false,
  isImportModalOpen: false,
  isLoading: false,
  isPiiMasked: false,
  hasError: false,
  errorMessage: '',
  lastUpdate: null,
  processoFilters: {},
  testemunhaFilters: {},
  processosPage: 1,
  testemunhasPage: 1,
  pageSize: 10,
  totalProcessos: 0,
  totalTestemunhas: 0,

  // Actions
  setActiveTab: (tab) => set({ activeTab: tab }),
  setProcessos: (processos) => set({ processos }),
  setTestemunhas: (testemunhas) => set({ testemunhas }),
  setSelectedProcesso: (processo) => set({ selectedProcesso: processo }),
  setSelectedTestemunha: (testemunha) => set({ selectedTestemunha: testemunha }),
  setIsDetailDrawerOpen: (open) => set({ isDetailDrawerOpen: open }),
  setIsImportModalOpen: (open) => set({ isImportModalOpen: open }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setIsPiiMasked: (masked) => set({ isPiiMasked: masked }),
  setError: (error, message = '') => set({ hasError: error, errorMessage: message }),
  setLastUpdate: (date) => set({ lastUpdate: date }),
  setProcessoFilters: (filters) => 
    set((state) => ({ 
      processoFilters: { ...state.processoFilters, ...filters },
      processosPage: 1 
    })),
  setTestemunhaFilters: (filters) => 
    set((state) => ({ 
      testemunhaFilters: { ...state.testemunhaFilters, ...filters },
      testemunhasPage: 1 
    })),
  setProcessosPage: (page) => set({ processosPage: page }),
  setTestemunhasPage: (page) => set({ testemunhasPage: page }),
  setTotalProcessos: (total) => set({ totalProcessos: total }),
  setTotalTestemunhas: (total) => set({ totalTestemunhas: total }),
  resetFilters: () => set({ 
    processoFilters: {}, 
    testemunhaFilters: {},
    processosPage: 1,
    testemunhasPage: 1
  }),
}));

// Selectors for optimized re-rendering
export const selectActiveTab = (state: MapaTestemunhasStore) => state.activeTab;
export const selectProcessos = (state: MapaTestemunhasStore) => state.processos;
export const selectTestemunhas = (state: MapaTestemunhasStore) => state.testemunhas;
export const selectIsLoading = (state: MapaTestemunhasStore) => state.isLoading;
export const selectIsPiiMasked = (state: MapaTestemunhasStore) => state.isPiiMasked;
export const selectHasError = (state: MapaTestemunhasStore) => state.hasError;
export const selectErrorMessage = (state: MapaTestemunhasStore) => state.errorMessage;
export const selectLastUpdate = (state: MapaTestemunhasStore) => state.lastUpdate;
export const selectProcessoFilters = (state: MapaTestemunhasStore) => state.processoFilters;
export const selectTestemunhaFilters = (state: MapaTestemunhasStore) => state.testemunhaFilters;
export const selectIsImportModalOpen = (state: MapaTestemunhasStore) => state.isImportModalOpen;
export const selectSelectedProcesso = (state: MapaTestemunhasStore) => state.selectedProcesso;
export const selectSelectedTestemunha = (state: MapaTestemunhasStore) => state.selectedTestemunha;
export const selectIsDetailDrawerOpen = (state: MapaTestemunhasStore) => state.isDetailDrawerOpen;