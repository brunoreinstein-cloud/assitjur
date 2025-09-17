import { ReactNode, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useNavigate } from 'react-router-dom'

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        navigate('/reset-password')
      }
    })
    return () => { sub.subscription.unsubscribe() }
  }, [navigate])
  return <>{children}</>
}
