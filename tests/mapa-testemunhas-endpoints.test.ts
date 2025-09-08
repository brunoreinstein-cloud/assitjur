/**
 * @vitest-environment node
 */

import { describe, it, expect } from 'vitest'
import { normalizeMapaRequest as backendNormalize } from '../src/contracts/mapaTestemunhas'
import frontendNormalize from '../src/lib/normalizeMapaRequest'

type EndpointResponse = { status: number; body?: unknown }

function processosEndpoint(payload: unknown, useClient = true): EndpointResponse {
  try {
    const normalized = useClient ? frontendNormalize(payload) : payload
    const result = backendNormalize(normalized)
    return { status: 200, body: result }
  } catch {
    return { status: 400 }
  }
}

describe('mapa-testemunhas-processos endpoint', () => {
  it('rejects invalid payload without client normalization', () => {
    const res = processosEndpoint({ filters: 'invalido', page: 0, limit: 500 }, false)
    expect(res.status).toBe(400)
  })

  it('normalizes missing page and limit', () => {
    const res = processosEndpoint({ filters: { temTriangulacao: 'false' } })
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ page: 1, limit: 20, filters: { temTriangulacao: false } })
  })

  it('coerces page and limit from strings', () => {
    const res = processosEndpoint({ page: '2', limit: '40' })
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ page: 2, limit: 40 })
  })

  it('handles empty payload using defaults', () => {
    const res = processosEndpoint({})
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ page: 1, limit: 20, filters: {} })
  })
})
