import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { getCurrentUser, fetchAuthSession, signOut, type AuthUser } from 'aws-amplify/auth'

interface AuthState {
  user: AuthUser | null
  groups: string[]
  isOrganizador: boolean
  isAtleta: boolean
  loading: boolean
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthState>({
  user: null,
  groups: [],
  isOrganizador: false,
  isAtleta: false,
  loading: true,
  logout: async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [groups, setGroups] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  async function checkAuth() {
    try {
      const currentUser = await getCurrentUser()
      setUser(currentUser)
      const session = await fetchAuthSession()
      const tokenGroups = (session.tokens?.accessToken?.payload?.['cognito:groups'] as string[]) ?? []
      setGroups(tokenGroups)
    } catch {
      setUser(null)
      setGroups([])
    } finally {
      setLoading(false)
    }
  }

  async function logout() {
    await signOut()
    setUser(null)
    setGroups([])
  }

  const isOrganizador = groups.includes('organizadores')
  const isAtleta = groups.includes('atletas')

  return (
    <AuthContext.Provider value={{ user, groups, isOrganizador, isAtleta, loading, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
