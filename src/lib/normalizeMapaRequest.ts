import {
  MapaTestemunhasRequest,
  ProcessoFilters,
  TestemunhaFilters
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
  let page = Number(input?.paginacao?.page ?? input?.page ?? 1)
  if (!Number.isFinite(page) || page < 1) page = 1

  let limit = Number(input?.paginacao?.limit ?? input?.limit ?? 20)
  if (!Number.isFinite(limit) || limit < 1) limit = 20
  if (limit > 200) limit = 200

  const filters: Record<string, any> = {}
  const rawFilters = (input?.filtros && typeof input.filtros === 'object')
    ? input.filtros
    : (input?.filters && typeof input.filters === 'object')
      ? input.filters
      : undefined
  if (rawFilters) {
    for (const [key, value] of Object.entries(rawFilters)) {
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

  const output: MapaTestemunhasRequest<F> = {
    paginacao: { page, limit },
    filtros: filters as F
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
