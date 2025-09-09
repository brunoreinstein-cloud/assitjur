import { describe, it, expect, vi } from 'vitest'

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: {}, loading: false })
}))

vi.mock('@/lib/supabase', () => ({
  fetchPorProcesso: vi.fn().mockResolvedValue({
    data: [],
    total: 0,
    error: 'Falha',
    status: 500,
    cid: 'cid-123',
    route: '/mapa-testemunhas-processos',
  }),
  fetchPorTestemunha: vi.fn().mockResolvedValue({ data: [], total: 0 })
}))

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import MapaPage from '@/pages/MapaPage'

/**
 * @vitest-environment jsdom
 */

describe('Mapa error copy', () => {
  it('copies error details to clipboard', async () => {
    const writeText = vi.fn()
    ;(navigator as any).clipboard = { writeText }

    render(
      <MemoryRouter initialEntries={['/mapa']}>
        <MapaPage />
        <Toaster />
      </MemoryRouter>
    )

    const copyBtn = await screen.findByRole('button', { name: /copiar detalhes/i })

    await userEvent.click(copyBtn)

    expect(writeText).toHaveBeenCalledTimes(1)
    const payload = JSON.parse(writeText.mock.calls[0][0])
    expect(payload).toMatchObject({
      route: '/mapa-testemunhas-processos',
      status: 500,
      cid: 'cid-123',
    })
    expect(payload.timestamp).toBeDefined()
    expect(payload.payload).toBeUndefined()
  })
})
