import {
  MapaTestemunhasRequest,
  ProcessoFilters,
  TestemunhaFilters,
  Cursor
} from '@/types/mapa-testemunhas'

type KnownFilters = ProcessoFilters & TestemunhaFilters

const ALLOWED_FILTER_KEYS: (keyof KnownFilters)[] = [
  'uf',
  'status',
  'fase',
  'search',
  'testemunha',
  'qtdDeposMin',
  'qtdDeposMax',
  'temTriangulacao',
  'temTroca',
  'temProvaEmprestada',
  'ambosPolos',
  'jaFoiReclamante'
]

const BOOLEAN_FILTER_KEYS = new Set<keyof KnownFilters>([
  'temTriangulacao',
  'temTroca',
  'temProvaEmprestada',
  'ambosPolos',
  'jaFoiReclamante'
])

export function normalizeMapaRequest<F = Record<string, unknown>>(input: any): MapaTestemunhasRequest<F> {
  let limit = Number(input?.limit ?? 20)
  if (!Number.isFinite(limit) || limit < 1) limit = 20
  if (limit > 200) limit = 200

  const filters: Record<string, any> = {}
  if (input?.filters && typeof input.filters === 'object') {
    for (const [key, value] of Object.entries(input.filters)) {
      if (!ALLOWED_FILTER_KEYS.includes(key as keyof KnownFilters)) continue
      let v: any = value

      if (BOOLEAN_FILTER_KEYS.has(key as keyof KnownFilters)) {
        if (typeof v === 'string') {
          if (v === 'true') v = true
          else if (v === 'false') v = false
          else continue
        } else if (typeof v === 'boolean') {
          // keep as is
        } else continue
      } else if ((key === 'search' || key === 'testemunha') && typeof v === 'string') {
        v = v.trim()
      } else if (key === 'qtdDeposMin' || key === 'qtdDeposMax') {
        const num = typeof v === 'number' ? v : Number(v)
        if (!Number.isFinite(num)) continue
        v = num
      }

      filters[key] = v
    }
  }

  let cursor: Cursor | undefined
  if (input?.cursor && typeof input.cursor === 'object') {
    const c = input.cursor as any
    if (typeof c.id === 'string' && typeof c.created_at === 'string') {
      cursor = { id: c.id, created_at: c.created_at }
    }
  }

  const output: MapaTestemunhasRequest<F> = {
    cursor,
    limit,
    filters: filters as F
  }

  if (typeof input?.sortBy === 'string') {
    output.sortBy = input.sortBy
  }

  if (input?.sortDir === 'asc' || input?.sortDir === 'desc') {
    output.sortDir = input.sortDir
  }

  return output
}

export default normalizeMapaRequest
