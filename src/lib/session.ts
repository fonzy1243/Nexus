import { useEffect, useState } from 'react'

export type SessionData = {
  email: string
  name?: string
  token?: string
}

const STORAGE_KEY = 'nexus-session'

export function getSession(): SessionData | null {
  if (typeof window === 'undefined') return null

  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) return null

  try {
    return JSON.parse(raw) as SessionData
  } catch {
    return null
  }
}

export function setSession(session: SessionData) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
  window.dispatchEvent(new Event('nexus-session-changed'))
}

export function clearSession() {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(STORAGE_KEY)
  window.dispatchEvent(new Event('nexus-session-changed'))
}

export function useSession() {
  const [session, setSessionState] = useState<SessionData | null>(getSession())

  useEffect(() => {
    const listener = () => setSessionState(getSession())
    window.addEventListener('nexus-session-changed', listener)
    return () => window.removeEventListener('nexus-session-changed', listener)
  }, [])

  return {
    session,
    setSession: (value: SessionData | null) => {
      if (value) setSession(value)
      else clearSession()
      setSessionState(value)
    },
    clearSession: () => {
      clearSession()
      setSessionState(null)
    },
  }
}
