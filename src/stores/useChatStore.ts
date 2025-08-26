import { create } from 'zustand';

export interface Message {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'tool';
  content: string;
  json?: any;
  tokensIn?: number;
  tokensOut?: number;
  citations?: Array<{
    source: 'por_processo' | 'por_testemunha';
    ref: string;
    content?: string;
  }>;
  createdAt: Date;
}

export interface Conversation {
  id: string;
  title: string;
  agentId: string;
  createdAt: Date;
  updatedAt: Date;
  messageCount: number;
  lastMessage?: string;
}

export interface Attachment {
  id: string;
  conversationId: string;
  kind: 'file' | 'url';
  name: string;
  ext?: string;
  size?: number;
  status: 'uploading' | 'indexing' | 'ready' | 'error';
  createdAt: Date;
}

export interface ChatContext {
  cnj?: string;
  testemunha?: string;
  rows?: any[];
}

export interface ChatStore {
  // Current conversation
  conversationId?: string;
  agentId: string;
  model: string;
  temperature: number;
  
  // Messages and streaming
  messages: Message[];
  streaming: boolean;
  
  // Costs and tokens
  costUsd: number;
  tokensIn: number;
  tokensOut: number;
  
  // Context
  ctx: ChatContext;
  attachments: Attachment[];
  maskPII: boolean;
  
  // History
  conversations: Conversation[];
  searchQuery: string;
  
  // Actions
  setAgent: (agentId: string) => void;
  setModel: (model: string) => void;
  setTemperature: (temp: number) => void;
  setContext: (ctx: ChatContext) => void;
  addMessage: (message: Omit<Message, 'id' | 'createdAt'>) => void;
  updateMessage: (id: string, updates: Partial<Message>) => void;
  setStreaming: (streaming: boolean) => void;
  addAttachment: (attachment: Omit<Attachment, 'id' | 'createdAt'>) => void;
  setMaskPII: (mask: boolean) => void;
  updateCosts: (tokensIn: number, tokensOut: number, costUsd: number) => void;
  setConversations: (conversations: Conversation[]) => void;
  setSearchQuery: (query: string) => void;
  setConversationId: (id?: string) => void;
  reset: () => void;
}

// Mock data
const mockConversations: Conversation[] = [
  {
    id: 'conv-1',
    title: 'Análise CNJ 0001234-56.2023.5.02.0001',
    agentId: 'cnj',
    createdAt: new Date('2024-01-15T10:30:00'),
    updatedAt: new Date('2024-01-15T11:45:00'),
    messageCount: 8,
    lastMessage: 'Encontrei irregularidades na triangulação de testemunhas...'
  },
  {
    id: 'conv-2', 
    title: 'Padrões de Risco - João Pereira',
    agentId: 'risco',
    createdAt: new Date('2024-01-14T15:20:00'),
    updatedAt: new Date('2024-01-14T16:30:00'),
    messageCount: 12,
    lastMessage: 'A testemunha aparece em 15 processos como polo ativo...'
  },
  {
    id: 'conv-3',
    title: 'Resumo Processual - Comarca São Paulo',
    agentId: 'resumo',
    createdAt: new Date('2024-01-13T09:15:00'),
    updatedAt: new Date('2024-01-13T10:20:00'),
    messageCount: 6,
    lastMessage: 'Resumo dos principais achados da comarca...'
  },
  {
    id: 'conv-4',
    title: 'Minuta Contestação - Triangulação',
    agentId: 'peca',
    createdAt: new Date('2024-01-12T14:10:00'),
    updatedAt: new Date('2024-01-12T15:30:00'),
    messageCount: 4,
    lastMessage: 'Minuta de contestação baseada nos padrões identificados...'
  },
  {
    id: 'conv-5',
    title: 'Análise Global de Fraudes',
    agentId: 'risco',
    createdAt: new Date('2024-01-11T11:00:00'),
    updatedAt: new Date('2024-01-11T12:15:00'),
    messageCount: 18,
    lastMessage: 'Identificados 23 casos suspeitos de coordenação...'
  },
  {
    id: 'conv-6',
    title: 'Consulta Rápida - Advogado Silva',
    agentId: 'cnj',
    createdAt: new Date('2024-01-10T16:45:00'),
    updatedAt: new Date('2024-01-10T17:00:00'),
    messageCount: 3,
    lastMessage: 'Advogado presente em 8 processos com padrão similar...'
  }
];

export const useChatStore = create<ChatStore>((set, get) => ({
  // Initial state
  agentId: 'cnj',
  model: 'gpt-4o-mini',
  temperature: 0.7,
  messages: [],
  streaming: false,
  costUsd: 0,
  tokensIn: 0,
  tokensOut: 0,
  ctx: {},
  attachments: [],
  maskPII: false,
  conversations: mockConversations,
  searchQuery: '',

  // Actions
  setAgent: (agentId) => set({ agentId }),
  setModel: (model) => set({ model }),
  setTemperature: (temperature) => set({ temperature }),
  setContext: (ctx) => set({ ctx }),
  
  addMessage: (message) => set((state) => ({
    messages: [...state.messages, {
      ...message,
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date()
    }]
  })),
  
  updateMessage: (id, updates) => set((state) => ({
    messages: state.messages.map(msg => 
      msg.id === id ? { ...msg, ...updates } : msg
    )
  })),
  
  setStreaming: (streaming) => set({ streaming }),
  
  addAttachment: (attachment) => set((state) => ({
    attachments: [...state.attachments, {
      ...attachment,
      id: `att-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date()
    }]
  })),
  
  setMaskPII: (maskPII) => set({ maskPII }),
  
  updateCosts: (tokensIn, tokensOut, costUsd) => set((state) => ({
    tokensIn: state.tokensIn + tokensIn,
    tokensOut: state.tokensOut + tokensOut,
    costUsd: state.costUsd + costUsd
  })),
  
  setConversations: (conversations) => set({ conversations }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setConversationId: (conversationId) => set({ conversationId }),
  
  reset: () => set({
    conversationId: undefined,
    messages: [],
    streaming: false,
    costUsd: 0,
    tokensIn: 0,
    tokensOut: 0,
    ctx: {},
    attachments: []
  })
}));