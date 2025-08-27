import { create } from 'zustand';

export type QueryKind = 'processo' | 'testemunha' | 'reclamante';
export type MessageRole = 'user' | 'assistant';
export type BlockType = 'executive' | 'details' | 'alerts' | 'strategies';
export type ExportType = 'pdf' | 'csv' | 'json';
export type Language = 'pt' | 'en';
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
}

export interface Message {
  id: string;
  role: MessageRole;
  content?: string;
  blocks?: ResultBlock[];
  exporting?: boolean;
  timestamp: Date;
}

export interface ChatDefaults {
  language: Language;
  export: ExportType;
}

export interface ChatStore {
  // Core state
  kind: QueryKind;
  input: string;
  messages: Message[];
  status: ChatStatus;
  agentOnline: boolean;
  defaults: ChatDefaults;

  // Loading states
  loadingHints: string[];
  currentHintIndex: number;

  // Actions
  setKind: (kind: QueryKind) => void;
  setInput: (input: string) => void;
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => string;
  updateMessage: (id: string, updates: Partial<Message>) => void;
  setStatus: (status: ChatStatus) => void;
  setAgentOnline: (online: boolean) => void;
  setDefaults: (defaults: Partial<ChatDefaults>) => void;
  reset: () => void;
  nextHint: () => void;
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

export const useChatStore = create<ChatStore>((set, get) => ({
  // Initial state
  kind: 'processo',
  input: '',
  messages: [],
  status: 'idle',
  agentOnline: true,
  defaults: {
    language: 'pt',
    export: 'pdf'
  },
  loadingHints: LOADING_HINTS,
  currentHintIndex: 0,

  // Actions
  setKind: (kind) => set({ kind }),
  setInput: (input) => set({ input }),

  addMessage: (message) => {
    const newMessage = {
      ...message,
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    };
    set((state) => ({
      messages: [...state.messages, newMessage]
    }));
    return newMessage.id;
  },

  updateMessage: (id, updates) => set((state) => ({
    messages: state.messages.map(msg => 
      msg.id === id ? { ...msg, ...updates } : msg
    )
  })),

  setStatus: (status) => set({ status }),
  setAgentOnline: (agentOnline) => set({ agentOnline }),
  setDefaults: (defaults) => set((state) => ({
    defaults: { ...state.defaults, ...defaults }
  })),

  reset: () => set({
    input: '',
    messages: [],
    status: 'idle',
    currentHintIndex: 0
  }),

  nextHint: () => set((state) => ({
    currentHintIndex: (state.currentHintIndex + 1) % state.loadingHints.length
  }))
}));