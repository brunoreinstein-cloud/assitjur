import { create } from 'zustand';
import { PorProcesso, PorTestemunha, ProcessoFilters, TestemunhaFilters } from '@/types/mapa-testemunhas';

interface MapaTestemunhasStore {
  // Data
  processos: PorProcesso[];
  testemunhas: PorTestemunha[];
  
  // UI State
  activeTab: 'processos' | 'testemunhas';
  selectedProcesso: PorProcesso | null;
  selectedTestemunha: PorTestemunha | null;
  isDetailDrawerOpen: boolean;
  isImportModalOpen: boolean;
  isLoading: boolean;
  isPiiMasked: boolean;
  
  // Filters
  processoFilters: ProcessoFilters;
  testemunhaFilters: TestemunhaFilters;
  
  // Pagination
  processosPage: number;
  testemunhasPage: number;
  pageSize: number;
  totalProcessos: number;
  totalTestemunhas: number;
  
  // Actions
  setActiveTab: (tab: 'processos' | 'testemunhas') => void;
  setProcessos: (processos: PorProcesso[]) => void;
  setTestemunhas: (testemunhas: PorTestemunha[]) => void;
  setSelectedProcesso: (processo: PorProcesso | null) => void;
  setSelectedTestemunha: (testemunha: PorTestemunha | null) => void;
  setIsDetailDrawerOpen: (open: boolean) => void;
  setIsImportModalOpen: (open: boolean) => void;
  setIsLoading: (loading: boolean) => void;
  setIsPiiMasked: (masked: boolean) => void;
  setProcessoFilters: (filters: Partial<ProcessoFilters>) => void;
  setTestemunhaFilters: (filters: Partial<TestemunhaFilters>) => void;
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