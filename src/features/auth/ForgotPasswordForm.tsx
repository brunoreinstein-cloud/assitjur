import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const siteUrl = import.meta.env.VITE_PUBLIC_SITE_URL

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${siteUrl}/reset-password`,
    })
    if (error) return setStatus('error')
    setStatus('success')
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
    </form>
  )
}
