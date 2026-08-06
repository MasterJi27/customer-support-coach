import { createContext, useContext, useState, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react'
import { useTheme } from './ThemeContext'

const ToastContext = createContext(null)

const TOAST_TONES = {
  success: { icon: CheckCircle2, light: 'border-emerald-200 bg-white text-navy-700', dark: 'border-emerald-500/30 bg-navy-800 text-white', iconCls: 'text-emerald-500' },
  error: { icon: AlertTriangle, light: 'border-red-200 bg-white text-navy-700', dark: 'border-red-500/30 bg-navy-800 text-white', iconCls: 'text-red-500' },
  info: { icon: Info, light: 'border-cyan-200 bg-white text-navy-700', dark: 'border-cyan-500/30 bg-navy-800 text-white', iconCls: 'text-cyan-500' },
}

export function ToastProvider({ children }) {
  const { theme } = useTheme()
  const isLight = theme === 'light'
  const [toasts, setToasts] = useState([])

  const dismiss = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const push = useCallback((type, message) => {
    const id = Date.now() + Math.random()
    setToasts(prev => [...prev, { id, type, message }])
    setTimeout(() => dismiss(id), 4500)
    return id
  }, [dismiss])

  const toast = {
    success: (msg) => push('success', msg),
    error: (msg) => push('error', msg),
    info: (msg) => push('info', msg),
  }

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed top-20 right-4 z-[100] flex flex-col gap-2 w-[calc(100vw-2rem)] max-w-sm pointer-events-none">
        <AnimatePresence>
          {toasts.map(t => {
            const tone = TOAST_TONES[t.type] || TOAST_TONES.info
            const Icon = tone.icon
            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, x: 24, scale: 0.96 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 24, scale: 0.96 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl border shadow-lg backdrop-blur-xl ${
                  isLight ? tone.light : tone.dark
                }`}
              >
                <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${tone.iconCls}`} />
                <p className={`flex-1 text-sm leading-snug ${isLight ? 'text-navy-700' : 'text-white/90'}`}>{t.message}</p>
                <button
                  type="button"
                  aria-label="Dismiss notification"
                  onClick={() => dismiss(t.id)}
                  className={`shrink-0 rounded-lg p-1 transition-colors ${
                    isLight ? 'text-navy-300 hover:text-navy-600 hover:bg-navy-50' : 'text-white/30 hover:text-white/70 hover:bg-white/[0.06]'
                  }`}
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
