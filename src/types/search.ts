export type SearchEntityType = 'process' | 'witness' | 'claimant' | 'lawyer' | 'comarca';

export type SearchScope = 'all' | 'process' | 'witness' | 'claimant' | 'lawyer' | 'comarca';

export interface SearchResult {
  id: string;
  type: SearchEntityType;
  title: string;
  subtitle?: string;
  highlights: string[];
  meta: Record<string, any>;
  score: number;
}

export interface SearchResponse {
  query: string;
  parsed: string;
  filters: Record<string, any>;
  scope: SearchScope;
  results: SearchResult[];
  total: number;
}

export interface SearchFilters {
  cnj?: string;
  uf?: string;
  comarca?: string;
  risco?: 'baixo' | 'medio' | 'alto';
  type?: SearchEntityType;
  hasCpf?: boolean;
}

export const SEARCH_PLACEHOLDERS = [
  'Ex.: Fabiano Celestino',
  'Ex.: 0001234-56.2024.5.02.0001',
  'Ex.: r:maria silva uf:RS',
  'Ex.: w:joão santos',
  'Ex.: comarca:POA risco:alto',
];

export const ENTITY_TYPE_LABELS: Record<SearchEntityType, string> = {
  process: 'Processo',
  witness: 'Testemunha',
  claimant: 'Reclamante',
  lawyer: 'Advogado',
  comarca: 'Comarca',
};

export const ENTITY_TYPE_COLORS: Record<SearchEntityType, string> = {
  process: 'bg-blue-500/10 text-blue-700 dark:text-blue-300',
  witness: 'bg-purple-500/10 text-purple-700 dark:text-purple-300',
  claimant: 'bg-green-500/10 text-green-700 dark:text-green-300',
  lawyer: 'bg-orange-500/10 text-orange-700 dark:text-orange-300',
  comarca: 'bg-gray-500/10 text-gray-700 dark:text-gray-300',
};
