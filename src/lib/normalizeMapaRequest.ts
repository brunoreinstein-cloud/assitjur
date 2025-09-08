import { MapaTestemunhasRequest, ProcessoFilters, TestemunhaFilters } from '@/types/mapa-testemunhas'

type AnyFilters = ProcessoFilters | TestemunhaFilters
const allowedFilterKeys: (keyof AnyFilters)[] = [
  'uf',
  'status',
  'fase',
  'search',
  'qtdDeposMin',
  'qtdDeposMax',
  'temTriangulacao',
  'temTroca',
  'temProvaEmprestada',
  'ambosPolos',
  'jaFoiReclamante'
]

export function normalizeMapaRequest<F extends AnyFilters = AnyFilters>(input: any): MapaTestemunhasRequest<F> {
  let page = Number(input?.page ?? 1)
  if (!Number.isFinite(page) || page < 1) page = 1
  page = Math.floor(page)

  let limit = Number(input?.limit ?? 20)
  if (!Number.isFinite(limit)) limit = 20
  limit = Math.floor(limit)
  if (limit < 1) limit = 1
  if (limit > 200) limit = 200

  const output: MapaTestemunhasRequest<any> = {
    page,
    limit,
    filters: {}
  }

  if (typeof input?.sortBy === 'string') {
    output.sortBy = input.sortBy
  }
  if (input?.sortDir === 'asc' || input?.sortDir === 'desc') {
    output.sortDir = input.sortDir
  }

  const rawFilters = input?.filters
  if (rawFilters && typeof rawFilters === 'object') {
    for (const [key, value] of Object.entries(rawFilters as Record<string, any>)) {
      if (!(allowedFilterKeys as string[]).includes(key)) continue
      if (value === '' || value === null || value === undefined) continue

      let v: any = value
      if (typeof v === 'string') {
        if (key === 'temTriangulacao' || key === 'temTroca') {
          if (v.toLowerCase() === 'true') v = true
          else if (v.toLowerCase() === 'false') v = false
        } else if (key === 'qtdDeposMin' || key === 'qtdDeposMax') {
          const num = Number(v)
          if (!Number.isNaN(num)) v = num
        }
      }

      output.filters[key] = v
    }
  }

  return output as MapaTestemunhasRequest<F>
}

export default normalizeMapaRequest
