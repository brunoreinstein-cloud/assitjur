import React, { createContext, useContext, useEffect, useState } from 'react'
import {
  applyConsentToGtag,
  applyDefaultConsent,
  getStoredConsent,
  storeConsent,
  type ConsentFlags,
  type ConsentPreferences,
} from '@/lib/privacy/consent'

interface ConsentContextValue {
  preferences: ConsentPreferences | null
  open: boolean
  setOpen: (open: boolean) => void
  save: (prefs: ConsentFlags) => void
}

const ConsentContext = createContext<ConsentContextValue | undefined>(undefined)

export function ConsentProvider({ children }: { children: React.ReactNode }) {
  const [preferences, setPreferences] = useState<ConsentPreferences | null>(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    applyDefaultConsent()
    const stored = getStoredConsent()
    if (stored) {
      setPreferences(stored)
      applyConsentToGtag(stored)
    } else {
      setOpen(true)
    }
  }, [])

  const save = (prefs: ConsentFlags) => {
    const stored = storeConsent(prefs)
    setPreferences(stored)
    applyConsentToGtag(prefs)
  }

  return React.createElement(
    ConsentContext.Provider,
    { value: { preferences, open, setOpen, save } },
    children
  )
}

export function useConsent(): ConsentContextValue {
  const ctx = useContext(ConsentContext)
  if (!ctx) throw new Error('useConsent must be used within ConsentProvider')
  return ctx
}