export interface MapaRequest {
  page: number
  limit: number
  sortBy?: string
  sortDir?: 'asc' | 'desc'
  filters?: Record<string, unknown>
}

export interface MapaResponse<T = unknown> {
  data?: T[]
  count?: number
  total?: number
}

