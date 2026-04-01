import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { setToken } from '@/lib/api'

export interface AuthUser {
  user_id: string
  username: string
}

interface AuthContextValue {
  user: AuthUser | null
  setUser: (u: AuthUser | null) => void
  signOut: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  setUser: () => {},
  signOut: () => {},
  isLoading: true,
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Restore user identity (not token) from localStorage on mount
  useEffect(() => {
    const username = localStorage.getItem('username')
    const user_id = localStorage.getItem('user_id')
    if (username && user_id) {
      setUser({ username, user_id })
    }
    setIsLoading(false)

    // Listen for dead token API events to instantly log the user out
    const handleForceLogout = () => {
      signOut()
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }

    window.addEventListener('auth:logout', handleForceLogout)
    return () => window.removeEventListener('auth:logout', handleForceLogout)
  }, [])

  function signOut() {
    // Clear in-memory access token (fix #11 + #21)
    setToken(null)
    // Clear user identity from localStorage
    localStorage.removeItem('user_id')
    localStorage.removeItem('username')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, setUser, signOut, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
