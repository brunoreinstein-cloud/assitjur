import { create } from 'zustand';

interface HomeState {
  searchQuery: string;
  previewTab: 'processo' | 'testemunha';
  previewLoading: boolean;
  previewProcesso: Array<any>;
  previewTestemunha: Array<any>;
  isUploadOpen: boolean;
  
  setSearchQuery: (query: string) => void;
  setPreviewTab: (tab: 'processo' | 'testemunha') => void;
  setPreviewData: (data: { processo?: Array<any>; testemunha?: Array<any> }) => void;
  setUploadOpen: (open: boolean) => void;
  setPreviewLoading: (loading: boolean) => void;
}

// Mock data
const mockProcessoData = [
  {
    CNJ: "0001234-56.2024.5.01.0001",
    UF: "RJ",
    Comarca: "Rio de Janeiro",
    Fase: "Instrução",
    Status: "Ativo",
    Reclamante: "Ana Lima",
    Qtd_Depos_Únicos: 2,
    Classificação_Final: "Risco Médio"
  },
  {
    CNJ: "0009876-12.2023.5.04.0002",
    UF: "RS",
    Comarca: "Porto Alegre",
    Fase: "Recurso",
    Status: "Ativo",
    Reclamante: "Carlos Souza",
    Qtd_Depos_Únicos: 1,
    Classificação_Final: "Risco Alto"
  },
  {
    CNJ: "0012345-00.2022.5.02.0003",
    UF: "SP",
    Comarca: "São Paulo",
    Fase: "Sentença",
    Status: "Encerrado",
    Reclamante: "Marina Rocha",
    Qtd_Depos_Únicos: 0,
    Classificação_Final: "Baixo"
  }
];

const mockTestemunhaData = [
  {
    Nome_Testemunha: "João Pereira",
    Qtd_Depoimentos: 4,
    Em_Ambos_Polos: "Sim",
    Já_Foi_Reclamante: "Não",
    Classificação_Estratégica: "Atenção"
  },
  {
    Nome_Testemunha: "Beatriz Nunes",
    Qtd_Depoimentos: 2,
    Em_Ambos_Polos: "Não",
    Já_Foi_Reclamante: "Sim",
    Classificação_Estratégica: "Observação"
  },
  {
    Nome_Testemunha: "Rafael Gomes",
    Qtd_Depoimentos: 6,
    Em_Ambos_Polos: "Sim",
    Já_Foi_Reclamante: "Não",
    Classificação_Estratégica: "Crítico"
  }
];

export const useHomeStore = create<HomeState>((set) => ({
  searchQuery: '',
  previewTab: 'processo',
  previewLoading: false,
  previewProcesso: mockProcessoData,
  previewTestemunha: mockTestemunhaData,
  isUploadOpen: false,
  
  setSearchQuery: (query) => set({ searchQuery: query }),
  setPreviewTab: (tab) => set({ previewTab: tab }),
  setPreviewData: (data) => set((state) => ({
    previewProcesso: data.processo ?? state.previewProcesso,
    previewTestemunha: data.testemunha ?? state.previewTestemunha,
  })),
  setUploadOpen: (open) => set({ isUploadOpen: open }),
  setPreviewLoading: (loading) => set({ previewLoading: loading }),
}));