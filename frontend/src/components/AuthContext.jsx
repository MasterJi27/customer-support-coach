import { createContext, useContext, useState, useCallback, useEffect } from 'react'

const AuthContext = createContext(null)

const DEMO_USER = { id: 'demo-agent', name: 'Demo Agent', email: 'demo@coachai.app', role: 'Agent' }

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('coachai_user')
    if (stored) {
      try { return JSON.parse(stored) } catch { return null }
    }
    return null
  })
  const [bootstrapping, setBootstrapping] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setBootstrapping(false), 400)
    return () => clearTimeout(t)
  }, [])

  const login = useCallback(async (email, _password) => {
    const name = email ? email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : DEMO_USER.name
    const next = { ...DEMO_USER, name, email: email || DEMO_USER.email }
    setUser(next)
    localStorage.setItem('coachai_user', JSON.stringify(next))
    return next
  }, [])

  const guestLogin = useCallback(async () => {
    const next = { ...DEMO_USER, name: `${DEMO_USER.name} (Guest)` }
    setUser(next)
    localStorage.setItem('coachai_user', JSON.stringify(next))
    return next
  }, [])

  const logout = useCallback(async () => {
    setUser(null)
    localStorage.removeItem('coachai_user')
  }, [])

  return (
    <AuthContext.Provider value={{ user, bootstrapping, isAuthenticated: !!user, login, guestLogin, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
