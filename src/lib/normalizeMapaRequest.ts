import {
  MapaTestemunhasRequest,
  MapaTestemunhasRequestApi,
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
  let page = Number(input?.page ?? 1)
  if (!Number.isFinite(page) || page < 1) page = 1

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

  const output: MapaTestemunhasRequest<F> = {
    page,
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

/**
 * Converte filtros camelCase em snake_case.
 */
export function toSnakeCaseFilters(filters?: Record<string, any>) {
  if (!filters) return filters
  const map: Record<string, string> = {
    temTriangulacao: 'tem_triangulacao',
    temTroca: 'tem_troca',
    temProvaEmprestada: 'tem_prova_emprestada',
    qtdDeposMin: 'qtd_depoimentos_min',
    qtdDeposMax: 'qtd_depoimentos_max',
    ambosPolos: 'ambos_polos',
    jaFoiReclamante: 'ja_foi_reclamante'
  }
  return Object.fromEntries(
    Object.entries(filters).map(([key, value]) => [
      map[key] ?? key.replace(/[A-Z]/g, m => `_${m.toLowerCase()}`),
      value
    ])
  )
}

/**
 * Converte uma requisição interna para o formato esperado pelo backend.
 * Deve ser utilizado antes de qualquer chamada HTTP relacionada ao
 * mapa de testemunhas.
 */
export function toMapaEdgeRequest<F = ProcessoFilters | TestemunhaFilters>(
  req: MapaTestemunhasRequest<F>
): MapaTestemunhasRequestApi<any> {
  const { page, limit, filters, sortBy, sortDir } = req
  const payload: MapaTestemunhasRequestApi<any> = {
    paginacao: { page, limit },
    filtros: toSnakeCaseFilters(filters as Record<string, any>)
  }
  if (sortBy) payload.sort_by = sortBy
  if (sortDir) payload.sort_dir = sortDir
  return payload
}

export default normalizeMapaRequest
