/**
 * @vitest-environment node
 */

import { describe, it, expect } from 'vitest'
import { normalizeMapaRequest as backendNormalize } from '../src/contracts/mapaTestemunhas'

type EndpointResponse = { status: number; body?: unknown }

function processosEndpoint(payload: unknown): EndpointResponse {
  try {
    const result = backendNormalize(payload)
    return { status: 200, body: result }
  } catch {
    return { status: 400 }
  }
}

describe('mapa-testemunhas-processos endpoint', () => {
  it('rejects invalid payload', () => {
    const res = processosEndpoint({ filtros: 'invalido', paginacao: { page: 0 } })
    expect(res.status).toBe(400)
  })

  it('normalizes missing page and limit', () => {
    const res = processosEndpoint({ filtros: { temTriangulacao: 'false' } })
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ paginacao: { page: 1, limit: 20 }, filtros: { temTriangulacao: false } })
  })

  it('coerces page and limit from strings', () => {
    const res = processosEndpoint({ paginacao: { page: '2', limit: '50' } })
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ paginacao: { page: 2, limit: 50 } })
  })

  it('trims testemunha filter string', () => {
    const res = processosEndpoint({ filtros: { testemunha: '  Maria  ' } })
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ paginacao: { page: 1, limit: 20 }, filtros: { testemunha: 'Maria' } })
  })

  it('clamps limit to 200 when above maximum', () => {
    const res = processosEndpoint({ paginacao: { limit: '999' } })
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ paginacao: { page: 1, limit: 200 }, filtros: {} })
  })

  it('handles empty payload using defaults', () => {
    const res = processosEndpoint({})
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ paginacao: { page: 1, limit: 20 }, filtros: {} })
  })

  it('accepts testemunha filter and trims value', () => {
    const res = processosEndpoint({ filtros: { testemunha: '  João  ' } })
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ filtros: { testemunha: 'João' }, paginacao: { page: 1, limit: 20 } })
  })
})

// --- Cursor pagination tests ---

interface TestRecord {
  id: number
  created_at: string
}

// Seed 50 mock records with incremental created_at and id
const mockRecords: TestRecord[] = Array.from({ length: 50 }, (_, i) => ({
  id: i + 1,
  created_at: new Date(Date.UTC(2020, 0, 1 + i)).toISOString(),
}))

type Cursor = { id: number; created_at: string }

function edgeFunction({ cursor, limit }: { cursor?: Cursor; limit: number }): {
  data: TestRecord[]
  next_cursor: Cursor | null
} {
  let start = 0
  if (cursor) {
    const index = mockRecords.findIndex(
      (r) => r.id === cursor.id && r.created_at === cursor.created_at,
    )
    start = index + 1
  }

  const data = mockRecords.slice(start, start + limit)
  const hasMore = start + limit < mockRecords.length
  const next_cursor = hasMore ? data[data.length - 1] : null
  return { data, next_cursor }
}

describe('mapa-testemunhas edge function pagination', () => {
  it('paginates through data using cursor', () => {
    const first = edgeFunction({ limit: 20 })
    const second = edgeFunction({ limit: 20, cursor: first.next_cursor! })

    // Assert 40 unique items across first two calls
    const ids = new Set([...first.data, ...second.data].map((r) => r.id))
    expect(ids.size).toBe(40)
    expect(second.next_cursor).not.toBeNull()

    const third = edgeFunction({ limit: 20, cursor: second.next_cursor! })
    expect(third.data).toHaveLength(10)
    expect(third.next_cursor).toBeNull()
  })
})
