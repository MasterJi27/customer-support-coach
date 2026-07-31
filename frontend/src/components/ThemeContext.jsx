import { createContext, useContext, useState, useCallback, useEffect } from 'react'

const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    const stored = localStorage.getItem('coachai_theme')
    return stored || 'dark'
  })

  const [accent, setAccent] = useState(() => {
    const stored = localStorage.getItem('coachai_accent')
    return stored || 'emerald'
  })

  const toggleTheme = useCallback(() => {
    setTheme(prev => {
      const next = prev === 'dark' ? 'light' : 'dark'
      localStorage.setItem('coachai_theme', next)
      return next
    })
  }, [])

  const changeAccent = useCallback(next => {
    setAccent(next)
    localStorage.setItem('coachai_accent', next)
  }, [])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    document.documentElement.setAttribute('data-accent', accent)
  }, [theme, accent])

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, accent, changeAccent }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
