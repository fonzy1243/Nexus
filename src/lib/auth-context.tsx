import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { API_BASE, getRefreshTokenId, setRefreshTokenId, setToken } from '@/lib/api'

export interface AuthUser {
	user_id: string
	username: string
	role: string
}

interface AuthContextValue {
	user: AuthUser | null
	setUser: (u: AuthUser | null) => void
	signOut: () => void
	isLoading: boolean
}

const AuthContext = createContext<AuthContextValue>({
	user: null,
	setUser: () => { },
	signOut: () => { },
	isLoading: true,
})

export function AuthProvider({ children }: { children: ReactNode }) {
	const [user, setUser] = useState<AuthUser | null>(null)
	const [isLoading, setIsLoading] = useState(true)

	useEffect(() => {
		const restore = async () => {
			try {
				const res = await fetch(`${API_BASE}/users/auth/refresh`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					credentials: 'include',
					body: JSON.stringify({ refresh_token_id: getRefreshTokenId() }),
				})

				if (res.ok) {
					const data = await res.json()
					setToken(data.access_token)
					setRefreshTokenId(data.refresh_token_id)
					setUser({
						user_id: data.user_id,
						username: data.username,
						role: data.role,
					})
				}
			} catch {
				// no session
			} finally {
				setIsLoading(false)
			}
		}

		// Listen for dead token API events to instantly log the user out
		const handleForceLogout = () => {
			signOut()
			if (window.location.pathname !== '/login') {
				window.location.href = '/login'
			}
		}

		restore()
		window.addEventListener('auth:logout', handleForceLogout)
		return () => window.removeEventListener('auth:logout', handleForceLogout)
	}, [])

	function signOut() {
		setToken(null)
		setRefreshTokenId(null)
		setUser(null)
		localStorage.removeItem('user_id')
		localStorage.removeItem('username')
		localStorage.removeItem('role')
		localStorage.removeItem('rtid')
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
