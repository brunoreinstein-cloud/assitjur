import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

const SUBMIT_DELAY_MS = 3000

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error' | 'rate_limit'>('idle')
  const siteUrl = import.meta.env.VITE_PUBLIC_SITE_URL

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    const delay = new Promise((resolve) => setTimeout(resolve, SUBMIT_DELAY_MS))
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${siteUrl}/reset-password`,
    })
    let newStatus: typeof status = 'success'
    if (error) {
      newStatus = (error as any)?.status === 429 ? 'rate_limit' : 'error'
    }
    await delay
    setStatus(newStatus)
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <label className="block">
        <span className="sr-only">E-mail</span>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="border p-2 w-full"
          placeholder="seu@email.com"
        />
      </label>
      <button
        type="submit"
        className="bg-primary text-white px-4 py-2 rounded"
        disabled={status === 'loading'}
      >
        {status === 'loading' ? 'Enviando...' : 'Enviar link'}
      </button>
      {status === 'error' && (
        <p className="text-destructive text-sm">Não foi possível enviar o e-mail.</p>
      )}
      {status === 'success' && (
        <p className="text-sm">Verifique seu e-mail para redefinir a senha.</p>
      )}
      {status === 'rate_limit' && (
        <p className="text-destructive text-sm">Muitas tentativas. Tente novamente mais tarde.</p>
      )}
    </form>
  )
}
