import { renderHook, act } from '@testing-library/react'
import { AuthProvider, useAuth } from '@/hooks/useAuth'
import React from 'react'

vi.mock('@/integrations/supabase/client', () => {
  const signInWithPassword = vi.fn()
  const from = vi.fn(() => ({ insert: vi.fn().mockResolvedValue({ error: null }) }))
  return {
    supabase: {
      auth: { signInWithPassword },
      from,
    },
  }
})

const mockedSupabase = require('@/integrations/supabase/client').supabase as any

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
)

describe('useAuth signIn error handling', () => {
  it('maps status 400 to invalid credentials message', async () => {
    mockedSupabase.auth.signInWithPassword.mockResolvedValueOnce({
      data: { user: null },
      error: { status: 400, message: 'Invalid login credentials' },
    })

    const { result } = renderHook(() => useAuth(), { wrapper })
    const { error } = await act(async () => await result.current.signIn('a', 'b', 'OFFICE'))

    expect(error?.message).toBe('E-mail ou senha incorretos.')
  })

  it('maps status 401 to email not confirmed message', async () => {
    mockedSupabase.auth.signInWithPassword.mockResolvedValueOnce({
      data: { user: null },
      error: { status: 401, message: 'Email not confirmed' },
    })

    const { result } = renderHook(() => useAuth(), { wrapper })
    const { error } = await act(async () => await result.current.signIn('a', 'b', 'OFFICE'))

    expect(error?.message).toBe('E-mail não confirmado. Verifique sua caixa de entrada.')
  })
})
