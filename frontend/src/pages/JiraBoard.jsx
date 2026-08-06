import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Ticket, Plus, Loader2, Trash2, ChevronRight, ChevronLeft, ChevronDown, Clock, AlertTriangle } from 'lucide-react'
import { useTheme } from '../components/ThemeContext'
import { useToast } from '../components/ToastContext'
import api from '../lib/api'
import { EmptyState } from '../components/Skeleton'

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
}

const itemAnim = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
}

const STORAGE_KEY = 'coachai_jira_tickets'

const COLUMNS = [
  { id: 'todo', label: 'To Do', accent: 'border-slate-400/20', dot: 'bg-slate-400' },
  { id: 'in_progress', label: 'In Progress', accent: 'border-cyan-400/30', dot: 'bg-cyan-400' },
  { id: 'done', label: 'Done', accent: 'border-emerald-400/30', dot: 'bg-emerald-400' },
]

const PRIORITY_STYLES = {
  Low: { light: 'bg-emerald-100 text-emerald-700', dark: 'bg-emerald-500/15 text-emerald-400' },
  Medium: { light: 'bg-orange-100 text-orange-700', dark: 'bg-orange-500/15 text-orange-400' },
  High: { light: 'bg-red-100 text-red-700', dark: 'bg-red-500/15 text-red-400' },
  Critical: { light: 'bg-red-100 text-red-700', dark: 'bg-red-500/15 text-red-400' },
}

function loadTickets() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export default function JiraBoard() {
  const { theme } = useTheme()
  const isLight = theme === 'light'
  const toast = useToast()
  const [tickets, setTickets] = useState(loadTickets)
  const [busy, setBusy] = useState(false)
  const [product, setProduct] = useState('Zomato - Food Delivery App')

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets))
  }, [tickets])

  const createTicket = async () => {
    setBusy(true)
    try {
      const res = await api.jiraTicket(product)
      const t = {
        id: res.ticket_id || `JIRA-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
        summary: res.summary || 'Auto-generated from coaching session',
        description: res.description || '',
        priority: res.priority || 'Medium',
        issue_type: res.issue_type || 'Bug',
        url: res.jira_url || '',
        status: 'todo',
        created_at: new Date().toISOString(),
      }
      setTickets(prev => [t, ...prev])
      toast.success(`Ticket ${t.id} created`)
    } catch (e) {
      toast.error(`Failed to create ticket: ${e.message}`)
    } finally {
      setBusy(false)
    }
  }

  const moveTicket = (id, dir) => {
    setTickets(prev => prev.map(t => {
      if (t.id !== id) return t
      const idx = COLUMNS.findIndex(c => c.id === t.status)
      const next = COLUMNS[Math.max(0, Math.min(idx + dir, COLUMNS.length - 1))]
      return { ...t, status: next.id }
    }))
  }

  const deleteTicket = (id) => {
    setTickets(prev => prev.filter(t => t.id !== id))
    toast.info(`Ticket ${id} deleted`)
  }

  const grouped = useMemo(() => {
    const map = {}
    COLUMNS.forEach(c => { map[c.id] = [] })
    tickets.forEach(t => {
      const key = COLUMNS.some(c => c.id === t.status) ? t.status : 'todo'
      map[key].push(t)
    })
    return map
  }, [tickets])

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className={`text-2xl font-bold ${isLight ? 'text-navy-800' : 'text-white'}`}>Jira Ticket Board</h1>
          <p className={`text-sm mt-0.5 ${isLight ? 'text-navy-400' : 'text-white/40'}`}>
            Tickets generated from coaching sessions — track them to done
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <select
              value={product}
              onChange={e => setProduct(e.target.value)}
              className={`glass-select !py-2.5 pr-8 text-xs ${isLight ? '!bg-white' : ''}`}
            >
              <option>Zomato - Food Delivery App</option>
              <option>Amazon Web Services (AWS) - Cloud Infrastructure</option>
              <option>Stripe - Payment Gateway</option>
              <option>Vercel - Frontend Cloud Platform</option>
              <option>Spotify - Music Streaming</option>
            </select>
            <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none ${isLight ? 'text-navy-400' : 'text-white/40'}`} />
          </div>
          <button onClick={createTicket} disabled={busy} className={`btn-primary !px-4 !py-2.5 text-xs ${busy ? 'opacity-40 pointer-events-none' : ''}`}>
            {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
            {busy ? 'Drafting…' : 'Generate Ticket'}
          </button>
        </div>
      </div>

      {tickets.length === 0 ? (
        <motion.div variants={itemAnim} className="glass-card">
          <EmptyState
            icon={Ticket}
            title="No tickets yet"
            description="Generate a ticket from a coached session to start your board."
            action={
              <button onClick={createTicket} disabled={busy} className={`btn-primary !px-4 !py-2.5 text-xs ${busy ? 'opacity-40 pointer-events-none' : ''}`}>
                <Plus className="w-3.5 h-3.5" /> Create first ticket
              </button>
            }
          />
        </motion.div>
      ) : (
        <div className="grid md:grid-cols-3 gap-4">
          {COLUMNS.map(col => (
            <motion.div key={col.id} variants={itemAnim} className="glass-card p-4">
              <div className="flex items-center gap-2 mb-4">
                <span className={`w-2 h-2 rounded-full ${col.dot}`} />
                <p className={`text-sm font-semibold ${isLight ? 'text-navy-800' : 'text-white'}`}>{col.label}</p>
                <span className={`ml-auto text-[10px] px-2 py-0.5 rounded-full ${isLight ? 'bg-navy-100 text-navy-400' : 'bg-white/[0.06] text-white/40'}`}>
                  {grouped[col.id].length}
                </span>
              </div>
              <div className="space-y-3 min-h-[120px]">
                <AnimatePresence>
                  {grouped[col.id].map(t => {
                    const pStyle = PRIORITY_STYLES[t.priority] || PRIORITY_STYLES.Medium
                    return (
                      <motion.div
                        key={t.id}
                        layout
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.96 }}
                        className={`p-4 rounded-2xl border ${isLight ? 'bg-navy-50 border-navy-100' : 'bg-white/[0.04] border-white/[0.06]'}`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`text-[10px] font-mono font-semibold ${isLight ? 'text-navy-400' : 'text-white/30'}`}>{t.id}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${isLight ? pStyle.light : pStyle.dark}`}>{t.priority}</span>
                          {t.issue_type && (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${isLight ? 'bg-cyan-100 text-cyan-700' : 'bg-cyan-500/15 text-cyan-400'}`}>{t.issue_type}</span>
                          )}
                        </div>
                        <p className={`text-sm font-medium leading-snug ${isLight ? 'text-navy-800' : 'text-white/90'}`}>{t.summary}</p>
                        {t.description && (
                          <p className={`text-xs mt-1.5 line-clamp-2 leading-relaxed ${isLight ? 'text-navy-400' : 'text-white/40'}`}>{t.description}</p>
                        )}
                        <div className="flex items-center gap-1 mt-3">
                          {col.id !== 'todo' && (
                            <button onClick={() => moveTicket(t.id, -1)} aria-label="Move left" className={`p-1.5 rounded-lg transition-colors ${isLight ? 'hover:bg-navy-100 text-navy-400' : 'hover:bg-white/[0.06] text-white/40'}`}>
                              <ChevronLeft className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {col.id !== 'done' && (
                            <button onClick={() => moveTicket(t.id, 1)} aria-label="Move right" className={`p-1.5 rounded-lg transition-colors ${isLight ? 'hover:bg-navy-100 text-navy-400' : 'hover:bg-white/[0.06] text-white/40'}`}>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {t.url && (
                            <a href={t.url} target="_blank" rel="noreferrer" className={`ml-auto text-[10px] inline-flex items-center gap-1 ${isLight ? 'text-cyan-600 hover:text-cyan-700' : 'text-cyan-400 hover:text-cyan-300'}`}>
                              <Clock className="w-3 h-3" /> Jira
                            </a>
                          )}
                          <button onClick={() => deleteTicket(t.id)} aria-label="Delete ticket" className={`ml-1 p-1.5 rounded-lg transition-colors ${isLight ? 'hover:bg-red-50 text-navy-300 hover:text-red-500' : 'hover:bg-red-500/10 text-white/30 hover:text-red-400'}`}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <motion.div variants={itemAnim} className={`flex items-center gap-2 px-4 py-3 rounded-2xl border ${isLight ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-amber-500/10 border-amber-500/20 text-amber-400'}`}>
        <AlertTriangle className="w-4 h-4 shrink-0" />
        <p className="text-xs">Tickets are stored locally in your browser. Generate new tickets from the Dashboard's Feature Lab to add more.</p>
      </motion.div>
    </motion.div>
  )
}
