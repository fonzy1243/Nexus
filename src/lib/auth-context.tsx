import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

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

  // Restore user from localStorage on mount
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
      // Only force redirect if they aren't already on the login page or homepage
      if (window.location.pathname !== '/login') {
         window.location.href = '/login'
      }
    }

    window.addEventListener('auth:logout', handleForceLogout)
    return () => window.removeEventListener('auth:logout', handleForceLogout)
  }, [])

  function signOut() {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
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
