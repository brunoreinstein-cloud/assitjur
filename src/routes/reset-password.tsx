import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useNavigate } from 'react-router-dom'

export default function ResetPasswordPage() {
  const [ready, setReady] = useState(false)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [okMsg, setOkMsg] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (window.location.hash) {
      history.replaceState(null, '', window.location.pathname)
    }
    setReady(true)
  }, [])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    if (!password || password !== confirm) {
      setErrorMsg('As senhas não conferem.')
      return
    }
    const { data: userRes, error: userErr } = await supabase.auth.getUser()
    if (userErr || !userRes?.user) {
      setErrorMsg('Link inválido ou expirado. Solicite novamente.')
      return
    }
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setErrorMsg('Não foi possível redefinir a senha.')
      return
    }
    setOkMsg('Senha atualizada com sucesso. Redirecionando para login...')
    setTimeout(() => navigate('/login'), 1500)
  }

  if (!ready) return null

  return (
    <form onSubmit={onSubmit} className="space-y-4 max-w-md mx-auto p-4">
      <label className="block">
        <span className="sr-only">Nova senha</span>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="border p-2 w-full"
          placeholder="Nova senha"
        />
      </label>
      <label className="block">
        <span className="sr-only">Confirmar senha</span>
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
          className="border p-2 w-full"
          placeholder="Confirme a senha"
        />
      </label>
      <button
        type="submit"
        className="bg-primary text-white px-4 py-2 rounded"
      >
        Atualizar senha
      </button>
      {errorMsg && <p className="text-destructive text-sm">{errorMsg}</p>}
      {okMsg && <p className="text-sm">{okMsg}</p>}
    </form>
  )
}
