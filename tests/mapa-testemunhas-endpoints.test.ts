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
    const res = processosEndpoint({ filters: 'invalido', page: 0 })
    expect(res.status).toBe(400)
  })

  it('normalizes missing page and limit', () => {
    const res = processosEndpoint({ filters: { temTriangulacao: 'false' } })
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ page: 1, limit: 20, filters: { temTriangulacao: false } })
  })

  it('coerces page and limit from strings', () => {
    const res = processosEndpoint({ page: '2', limit: '50' })
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ page: 2, limit: 50 })
  })

  it('trims testemunha filter string', () => {
    const res = processosEndpoint({ filters: { testemunha: '  Maria  ' } })
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ page: 1, limit: 20, filters: { testemunha: 'Maria' } })
  })

  it('clamps limit to 200 when above maximum', () => {
    const res = processosEndpoint({ limit: '999' })
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ page: 1, limit: 200, filters: {} })
  })

  it('handles empty payload using defaults', () => {
    const res = processosEndpoint({})
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ page: 1, limit: 20, filters: {} })
  })

  it('accepts testemunha filter and trims value', () => {
    const res = processosEndpoint({ filters: { testemunha: '  João  ' } })
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ filters: { testemunha: 'João' }, page: 1, limit: 20 })
  })
})
