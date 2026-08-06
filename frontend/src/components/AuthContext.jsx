import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { api } from '../lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('coachai_user')
    if (stored) {
      try { return JSON.parse(stored) } catch { return null }
    }
    return null
  })
  const [bootstrapping, setBootstrapping] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('coachai_token')
    if (!token || !user) {
      setBootstrapping(false)
      return
    }
    api.me()
      .then(({ user: fresh }) => {
        setUser(fresh)
        localStorage.setItem('coachai_user', JSON.stringify(fresh))
      })
      .catch(() => {
        localStorage.removeItem('coachai_token')
        localStorage.removeItem('coachai_user')
        setUser(null)
      })
      .finally(() => setBootstrapping(false))
  }, [])

  const applyAuth = useCallback(({ user: u, token }) => {
    localStorage.setItem('coachai_token', token)
    localStorage.setItem('coachai_user', JSON.stringify(u))
    setUser(u)
    return u
  }, [])

  const login = useCallback(async (email, password) => {
    const data = await api.login(email, password)
    return applyAuth(data)
  }, [applyAuth])

  const register = useCallback(async (name, email, password) => {
    const data = await api.register(name, email, password)
    return applyAuth(data)
  }, [applyAuth])

  const guestLogin = useCallback(async () => {
    const data = await api.guestLogin()
    return applyAuth(data)
  }, [applyAuth])

  const logout = useCallback(async () => {
    try { await api.logout() } catch { /* offline ok */ }
    localStorage.removeItem('coachai_token')
    localStorage.removeItem('coachai_user')
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, bootstrapping, isAuthenticated: !!user, login, register, guestLogin, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
