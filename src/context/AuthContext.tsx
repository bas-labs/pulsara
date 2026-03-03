import { createContext, useContext, useCallback, useEffect, useState, type ReactNode } from 'react'
import { getCurrentUser, fetchAuthSession, signOut, type AuthUser } from 'aws-amplify/auth'
import { Hub } from 'aws-amplify/utils'

interface AuthState {
  user: AuthUser | null
  groups: string[]
  isOrganizador: boolean
  isAtleta: boolean
  loading: boolean
  logout: () => Promise<void>
  refreshAuth: () => Promise<void>
}

const AuthContext = createContext<AuthState>({
  user: null,
  groups: [],
  isOrganizador: false,
  isAtleta: false,
  loading: true,
  logout: async () => {},
  refreshAuth: async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [groups, setGroups] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  const checkAuth = useCallback(async (forceRefresh = false) => {
    try {
      const currentUser = await getCurrentUser()
      setUser(currentUser)
      const session = await fetchAuthSession({ forceRefresh })
      const tokenGroups = (session.tokens?.accessToken?.payload?.['cognito:groups'] as string[]) ?? []
      setGroups(tokenGroups)
    } catch {
      setUser(null)
      setGroups([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  // Listen for Amplify auth events so state updates after sign-in/sign-up
  useEffect(() => {
    const unsubscribe = Hub.listen('auth', ({ payload }) => {
      if (payload.event === 'signedIn') {
        checkAuth()
      } else if (payload.event === 'signedOut') {
        setUser(null)
        setGroups([])
      }
    })
    return unsubscribe
  }, [checkAuth])

  async function logout() {
    await signOut()
    setUser(null)
    setGroups([])
  }

  // Force-refresh tokens and update groups (e.g. after role switch)
  const refreshAuth = useCallback(async () => {
    await checkAuth(true)
  }, [checkAuth])

  const isOrganizador = groups.includes('organizadores')
  const isAtleta = groups.includes('atletas')

  return (
    <AuthContext.Provider value={{ user, groups, isOrganizador, isAtleta, loading, logout, refreshAuth }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
