import { MapaTestemunhasRequest } from '@/types/mapa-testemunhas'

export function normalizeMapaRequest<F = Record<string, unknown>>(input: any): MapaTestemunhasRequest<F> {
  const toNumber = (value: any, defaultValue: number): number => {
    const num = Number(value)
    if (!Number.isFinite(num) || num <= 0) return defaultValue
    return num
  }

  const page = toNumber(input?.page, 1)
  let limit = toNumber(input?.limit ?? input?.pageSize, 20)
  if (limit > 200) limit = 200

  const output: MapaTestemunhasRequest<F> = {
    page,
    limit,
    filters: {} as F,
  }

  if (typeof input?.sortBy === 'string') {
    output.sortBy = input.sortBy
  }

  if (input?.sortDir === 'asc' || input?.sortDir === 'desc') {
    output.sortDir = input.sortDir
  }

  if (input?.filters && typeof input.filters === 'object') {
    const cleanFilters: Record<string, any> = {}
    for (const [key, value] of Object.entries(input.filters)) {
      if (typeof value === 'string') {
        const num = Number(value)
        cleanFilters[key] = Number.isFinite(num) && value.trim() !== '' ? num : value
      } else {
        cleanFilters[key] = value
      }
    }
    output.filters = cleanFilters as F
  }

  return output
}

export default normalizeMapaRequest
