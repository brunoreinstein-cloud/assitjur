export type Consent = {
  essential: true
  measure?: boolean
  marketing?: boolean
}

const STORAGE_KEY = 'aj_consent_v1'

type Listener = (consent: Consent) => void
let listeners: Listener[] = []

export function getConsent(): Consent {
  if (typeof window === 'undefined') return { essential: true }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return { essential: true }
    const data = JSON.parse(raw) as Omit<Consent, 'essential'>
    return { essential: true, ...data }
  } catch {
    return { essential: true }
  }
}

export function setConsent(prefs: Omit<Consent, 'essential'>) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))
  } catch {
    // ignore
  }
  const consent: Consent = { essential: true, ...prefs }
  listeners.forEach((cb) => cb(consent))
}

export function onConsentChange(cb: Listener) {
  listeners.push(cb)
  return () => {
    listeners = listeners.filter((l) => l !== cb)
  }
}
