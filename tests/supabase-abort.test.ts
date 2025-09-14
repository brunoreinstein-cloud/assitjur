/**
 * @vitest-environment node
 */
import { describe, it, expect, vi } from 'vitest'

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: { access_token: 'token' } } })
    }
  }
}))

import { fetchPorProcesso, fetchPorTestemunha } from '../src/lib/supabase'

describe('fetch functions abort', () => {
  it('aborts fetchPorProcesso when controller aborts', async () => {
    const controller = new AbortController()
    const fetchMock = vi.fn(
      (url: string, options: RequestInit & { signal: AbortSignal }) =>
        new Promise<Response>((resolve, reject) => {
          options.signal.addEventListener('abort', () =>
            reject(new DOMException('Aborted', 'AbortError'))
          )
          setTimeout(
            () =>
              resolve(
                new Response(JSON.stringify({ data: [], total: 0 }), { status: 200 }),
              ),
            1000,
          )
        }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const promise = fetchPorProcesso({ page: 1, limit: 1, filters: {} }, controller.signal)
    controller.abort()
    await expect(promise).rejects.toThrowError(DOMException)
    expect(fetchMock).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ signal: controller.signal }))
  })

  it('aborts fetchPorTestemunha when controller aborts', async () => {
    const controller = new AbortController()
    const fetchMock = vi.fn(
      (url: string, options: RequestInit & { signal: AbortSignal }) =>
        new Promise<Response>((resolve, reject) => {
          options.signal.addEventListener('abort', () =>
            reject(new DOMException('Aborted', 'AbortError'))
          )
          setTimeout(
            () =>
              resolve(
                new Response(JSON.stringify({ data: [], total: 0 }), { status: 200 }),
              ),
            1000,
          )
        }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const promise = fetchPorTestemunha({ page: 1, limit: 1, filters: {} }, controller.signal)
    controller.abort()
    await expect(promise).rejects.toThrowError(DOMException)
    expect(fetchMock).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ signal: controller.signal }))
  })
})
