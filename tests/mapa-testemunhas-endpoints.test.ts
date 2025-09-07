/**
 * @vitest-environment node
 */

import { describe, it, expect } from 'vitest'
import { normalizeMapaRequest } from '../src/contracts/mapaTestemunhas'

function processosEndpoint(payload: unknown) {
  try {
    normalizeMapaRequest(payload)
    return { status: 200 }
  } catch {
    return { status: 400 }
  }
}

function testemunhasEndpoint(payload: unknown) {
  if (!payload || typeof payload !== 'object') {
    return { status: 400 }
  }
  const { page, limit } = payload as Record<string, unknown>
  if (
    typeof page !== 'number' || page <= 0 ||
    typeof limit !== 'number' || limit <= 0
  ) {
    return { status: 400 }
  }
  return { status: 200 }
}

describe('mapa-testemunhas-processos endpoint', () => {
  it('rejects invalid payload', () => {
    const res = processosEndpoint({ filtros: 'invalido', pagina: 0, limite: 500 })
    expect(res.status).toBe(400)
  })

  it('accepts valid payload', () => {
    const res = processosEndpoint({
      filtros: { uf: 'SP', status: 'Ativo', fase: 'Instrucao', search: 'abc' },
      pagina: 1,
      limite: 10
    })
    expect(res.status).toBe(200)
  })
})

describe('mapa-testemunhas-testemunhas endpoint', () => {
  it('rejects invalid payload', () => {
    const res = testemunhasEndpoint({ page: '1', limit: -5 })
    expect(res.status).toBe(400)
  })

  it('accepts valid payload', () => {
    const res = testemunhasEndpoint({ page: 1, limit: 10, search: 'Maria', temTriangulacao: false })
    expect(res.status).toBe(200)
  })
})
