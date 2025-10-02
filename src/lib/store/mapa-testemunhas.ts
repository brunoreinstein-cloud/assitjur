import { create } from 'zustand';
import { PorProcesso, PorTestemunha, ProcessoFilters, TestemunhaFilters } from '@/types/mapa-testemunhas';
import type { Density } from '@/components/ui/design-tokens';

// Chat-related types
export type QueryKind = 'processo' | 'testemunha' | 'reclamante';
export type MessageRole = 'user' | 'assistant';
export type BlockType = 'executive' | 'details' | 'alerts' | 'strategies';
export type ExportType = 'pdf' | 'csv' | 'json';
export type ChatStatus = 'idle' | 'loading' | 'success' | 'error';

export interface Citation {
  source: 'por_processo' | 'por_testemunha' | 'outro';
  ref: string;
}

export interface ResultBlock {
  type: BlockType;
  title: string;
  icon: string;
  data: any;
  citations?: Citation[];
  meta?: {
    status?: string;
    classificacao?: string;
    riscoNivel?: string;
    confidence?: number;
    observacoes?: string;
  };
  context?: {
    type?: 'processo' | 'testemunha';
    data?: any;
    meta?: any;
  };
}

export interface Message {
  id: string;
  role: MessageRole;
  content?: string;
  blocks?: ResultBlock[];
  exporting?: boolean;
  timestamp: Date;
}

// Type aliases for the store
type Processo = PorProcesso;
type Testemunha = PorTestemunha;
type FilterProcesso = ProcessoFilters;
type FilterTestemunha = TestemunhaFilters;
type TabType = 'processos' | 'testemunhas';

interface ErrorState {
  hasError: boolean;
  message?: string;
}

interface NavigationItem {
  label: string;
  path: string;
}

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

  // Column visibility
  columnVisibility: {
    processos: Record<string, boolean>;
    testemunhas: Record<string, boolean>;
  };

  // Saved views
  savedViews: Record<string, {
    processoFilters: FilterProcesso;
    testemunhaFilters: FilterTestemunha;
    columnVisibility: {
      processos: Record<string, boolean>;
      testemunhas: Record<string, boolean>;
    };
  }>;
  activeView: string | null;
  
  // Pagination
  processosPage: number;
  testemunhasPage: number;
  pageSize: number;
  totalProcessos: number;
  totalTestemunhas: number;
  hasMoreProcessos: boolean;
  hasMoreTestemunhas: boolean;

  // Chat State
  chatKind: QueryKind;
  chatInput: string;
  chatMessages: Message[];
  chatStatus: ChatStatus;
  agentOnline: boolean;
  chatResult: ResultBlock[] | null;
  
  // Loading hints
  loadingHints: string[];
  currentHintIndex: number;
  
  // Density & Navigation
  density: Density;
  navigationHistory: NavigationItem[];
  
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
  setColumnVisibility: (table: 'processos' | 'testemunhas', column: string, visible: boolean) => void;
  saveView: (name: string, userId: string) => void;
  loadViews: (userId: string) => void;
  setActiveViewName: (name: string, userId: string) => void;
  setProcessosPage: (page: number) => void;
  setTestemunhasPage: (page: number) => void;
  setTotalProcessos: (total: number) => void;
  setTotalTestemunhas: (total: number) => void;
  setHasMoreProcessos: (hasMore: boolean) => void;
  setHasMoreTestemunhas: (hasMore: boolean) => void;
  loadMoreProcessos: () => void;
  loadMoreTestemunhas: () => void;
  removeProcesso: (cnj: string) => PorProcesso | null;
  restoreProcesso: (processo: PorProcesso) => void;
  removeTestemunha: (nome: string) => PorTestemunha | null;
  restoreTestemunha: (testemunha: PorTestemunha) => void;
  resetFilters: () => void;

  // Chat Actions
  setChatKind: (kind: QueryKind) => void;
  setChatInput: (input: string) => void;
  addChatMessage: (message: Omit<Message, 'id' | 'timestamp'>) => string;
  updateChatMessage: (id: string, updates: Partial<Message>) => void;
  setChatStatus: (status: ChatStatus) => void;
  setAgentOnline: (online: boolean) => void;
  setChatResult: (result: ResultBlock[] | null) => void;
  resetChat: () => void;
  nextHint: () => void;
  
  // Density & Navigation Actions
  setDensity: (density: Density) => void;
  pushNavigation: (item: NavigationItem) => void;
  popNavigation: (toIndex: number) => void;
  clearNavigation: () => void;
}

const LOADING_HINTS = [
  "⏱ Mapeando conexões de testemunhas…",
  "🔎 Checando histórico probatório…",
  "⚖️ Analisando padrões de triangulação…",
  "📋 Identificando riscos processuais…",
  "👥 Cruzando dados do polo ativo…",
  "🎯 Gerando insights estratégicos…",
  "📊 Compilando relatório executivo…"
];

export const useMapaTestemunhasStore = create<MapaTestemunhasStore>((set, get) => ({
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
  columnVisibility: {
    processos: {
      cnj: true,
      uf: true,
      comarca: true,
      fase: true,
      status: true,
      reclamante: true,
      qtdDepos: true,
      testemunhas: true,
      classificacao: true,
      acoes: true,
    },
    testemunhas: {
      nome: true,
      qtdDepo: true,
      ambosPolos: true,
      jaReclamante: true,
      cnjs: true,
      classificacao: true,
      acoes: true,
    },
  },
  savedViews: {},
  activeView: null,
  processosPage: 1,
  testemunhasPage: 1,
  pageSize: 100,
  totalProcessos: 0,
  totalTestemunhas: 0,
  hasMoreProcessos: false,
  hasMoreTestemunhas: false,

  // Chat initial state
  chatKind: 'processo',
  chatInput: '',
  chatMessages: [],
  chatStatus: 'idle',
  agentOnline: true,
  chatResult: null,
  loadingHints: LOADING_HINTS,
  currentHintIndex: 0,

  // Density & Navigation initial state
  density: 'comfortable',
  navigationHistory: [{ label: 'Mapa de Testemunhas', path: '/mapa-testemunhas' }],

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
    set((state) => {
      const merged = { ...state.processoFilters, ...filters };
      Object.keys(filters).forEach((k) => {
        if (filters[k as keyof FilterProcesso] === undefined) {
          delete (merged as any)[k];
        }
      });
      return {
        processoFilters: merged,
        processosPage: 1,
      };
    }),
  setTestemunhaFilters: (filters) =>
    set((state) => {
      const merged = { ...state.testemunhaFilters, ...filters };
      Object.keys(filters).forEach((k) => {
        if (filters[k as keyof FilterTestemunha] === undefined) {
          delete (merged as any)[k];
        }
      });
      return {
        testemunhaFilters: merged,
        testemunhasPage: 1,
      };
    }),
  setColumnVisibility: (table, column, visible) =>
    set((state) => ({
      columnVisibility: {
        ...state.columnVisibility,
        [table]: { ...state.columnVisibility[table], [column]: visible },
      },
    })),
  saveView: (name, userId) =>
    set((state) => {
      const views = {
        ...state.savedViews,
        [name]: {
          processoFilters: state.processoFilters,
          testemunhaFilters: state.testemunhaFilters,
          columnVisibility: state.columnVisibility,
        },
      };
      if (typeof window !== 'undefined') {
        localStorage.setItem(`mapaViews_${userId}`, JSON.stringify(views));
        localStorage.setItem(`mapaActiveView_${userId}`, name);
      }
      return { savedViews: views, activeView: name };
    }),
  loadViews: (userId) => {
    if (typeof window === 'undefined') return;
    const raw = localStorage.getItem(`mapaViews_${userId}`);
    const views = raw ? JSON.parse(raw) : {};
    const active = localStorage.getItem(`mapaActiveView_${userId}`);
    set({ savedViews: views, activeView: active });
    if (active && views[active]) {
      set({
        processoFilters: views[active].processoFilters,
        testemunhaFilters: views[active].testemunhaFilters,
        columnVisibility: views[active].columnVisibility,
      });
    }
  },
  setActiveViewName: (name, userId) =>
    set((state) => {
      const view = state.savedViews[name];
      if (!view) return {} as any;
      if (typeof window !== 'undefined') {
        localStorage.setItem(`mapaActiveView_${userId}`, name);
      }
      return {
        activeView: name,
        processoFilters: view.processoFilters,
        testemunhaFilters: view.testemunhaFilters,
        columnVisibility: view.columnVisibility,
      };
    }),
  setProcessosPage: (page) => set({ processosPage: page }),
  setTestemunhasPage: (page) => set({ testemunhasPage: page }),
  setTotalProcessos: (total) => set({ totalProcessos: total }),
  setTotalTestemunhas: (total) => set({ totalTestemunhas: total }),
  setHasMoreProcessos: (hasMore) => set({ hasMoreProcessos: hasMore }),
  setHasMoreTestemunhas: (hasMore) => set({ hasMoreTestemunhas: hasMore }),
  loadMoreProcessos: () =>
    set((state) => ({
      processosPage: state.processosPage + 1,
    })),
  loadMoreTestemunhas: () =>
    set((state) => ({
      testemunhasPage: state.testemunhasPage + 1,
    })),
  removeProcesso: (cnj) => {
    let removed: PorProcesso | null = null;
    set((state) => {
      const index = state.processos.findIndex(p => p.cnj === cnj);
      if (index === -1) return {} as any;
      removed = state.processos[index];
      const arr = [...state.processos];
      arr.splice(index, 1);
      return { processos: arr, totalProcessos: state.totalProcessos - 1 } as any;
    });
    return removed;
  },
  restoreProcesso: (processo) =>
    set((state) => ({ processos: [processo, ...state.processos], totalProcessos: state.totalProcessos + 1 })),
  removeTestemunha: (nome) => {
    let removed: PorTestemunha | null = null;
    set((state) => {
      const index = state.testemunhas.findIndex(t => t.nome_testemunha === nome);
      if (index === -1) return {} as any;
      removed = state.testemunhas[index];
      const arr = [...state.testemunhas];
      arr.splice(index, 1);
      return { testemunhas: arr, totalTestemunhas: state.totalTestemunhas - 1 } as any;
    });
    return removed;
  },
  restoreTestemunha: (testemunha) =>
    set((state) => ({ testemunhas: [testemunha, ...state.testemunhas], totalTestemunhas: state.totalTestemunhas + 1 })),
  resetFilters: () => set({ 
    processoFilters: {}, 
    testemunhaFilters: {},
    processosPage: 1,
    testemunhasPage: 1
  }),

  // Chat Actions
  setChatKind: (kind) => set({ chatKind: kind }),
  setChatInput: (input) => set({ chatInput: input }),

  addChatMessage: (message) => {
    const newMessage = {
      ...message,
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    };
    set((state) => ({
      chatMessages: [...state.chatMessages, newMessage]
    }));
    return newMessage.id;
  },

  updateChatMessage: (id, updates) => set((state) => ({
    chatMessages: state.chatMessages.map(msg => 
      msg.id === id ? { ...msg, ...updates } : msg
    )
  })),

  setChatStatus: (status) => set({ chatStatus: status }),
  setAgentOnline: (agentOnline) => set({ agentOnline }),
  setChatResult: (result) => set({ chatResult: result }),

  resetChat: () => set({
    chatInput: '',
    chatMessages: [],
    chatStatus: 'idle',
    chatResult: null,
    currentHintIndex: 0
  }),

  nextHint: () => set((state) => ({
    currentHintIndex: (state.currentHintIndex + 1) % state.loadingHints.length
  })),

  // Density & Navigation Actions
  setDensity: (density) => set({ density }),
  
  pushNavigation: (item) => set((state) => {
    // Evitar duplicatas consecutivas
    const last = state.navigationHistory[state.navigationHistory.length - 1];
    if (last?.path === item.path) return {};
    return { navigationHistory: [...state.navigationHistory, item] };
  }),
  
  popNavigation: (toIndex) => set((state) => ({
    navigationHistory: state.navigationHistory.slice(0, toIndex + 1)
  })),
  
  clearNavigation: () => set({
    navigationHistory: [{ label: 'Mapa de Testemunhas', path: '/mapa-testemunhas' }]
  })
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
export const selectColumnVisibility = (state: MapaTestemunhasStore) => state.columnVisibility;
export const selectSavedViews = (state: MapaTestemunhasStore) => state.savedViews;
export const selectActiveViewName = (state: MapaTestemunhasStore) => state.activeView;