import { createContext, useContext, useEffect, useState, ReactNode, createElement } from 'react'

export interface ConsentPreferences {
  analytics: boolean
  ads: boolean
  sharing?: boolean
  version: string
  ts: string
}

export type ConsentFlags = Pick<ConsentPreferences, 'analytics' | 'ads' | 'sharing'>

interface ConsentContextValue {
  preferences: ConsentPreferences | null
  open: boolean
  setOpen: (open: boolean) => void
  save: (prefs: ConsentFlags) => void
}

const ConsentContext = createContext<ConsentContextValue | undefined>(undefined)

interface ConsentProviderProps {
  children: ReactNode
}

export function ConsentProvider({ children }: ConsentProviderProps) {
  const [preferences, setPreferences] = useState<ConsentPreferences | null>(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    // Initialize consent
    const stored = localStorage.getItem('assistjur_consent_v1.0.0')
    if (stored) {
      try {
        const data = JSON.parse(stored) as ConsentPreferences
        setPreferences(data)
      } catch {
        setOpen(true)
      }
    } else {
      setOpen(true)
    }
  }, [])

  const save = (prefs: ConsentFlags) => {
    const stored: ConsentPreferences = {
      analytics: prefs.analytics,
      ads: prefs.ads,
      sharing: prefs.sharing ?? false,
      version: '1.0.0',
      ts: new Date().toISOString(),
    }
    localStorage.setItem('assistjur_consent_v1.0.0', JSON.stringify(stored))
    setPreferences(stored)
    setOpen(false)
  }

  const contextValue: ConsentContextValue = {
    preferences,
    open,
    setOpen,
    save
  }

  return createElement(ConsentContext.Provider, { value: contextValue }, children)
}

export function useConsent(): ConsentContextValue {
  const context = useContext(ConsentContext)
  if (!context) {
    throw new Error('useConsent must be used within ConsentProvider')
  }
  return context
}