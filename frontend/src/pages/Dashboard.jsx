import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Send, ShieldAlert, BookOpen, Lightbulb, Bot, User, Zap, Play,
  Sparkles, Headphones, Gauge, ChevronRight, Clock, Timer, MessageSquare,
} from 'lucide-react'
import { useTheme } from '../components/ThemeContext'
import { liveTurns, scenarios, kbDocuments } from '../data'

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
}

const itemAnim = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
}

function SignalChip({ label, value, tone }) {
  const { theme } = useTheme()
  const isLight = theme === 'light'
  const tones = {
    emerald: isLight ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    cyan: isLight ? 'bg-cyan-50 text-cyan-700 border-cyan-200' : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    violet: isLight ? 'bg-violet-50 text-violet-700 border-violet-200' : 'bg-violet-500/10 text-violet-400 border-violet-500/20',
    orange: isLight ? 'bg-orange-50 text-orange-700 border-orange-200' : 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    red: isLight ? 'bg-red-50 text-red-700 border-red-200' : 'bg-red-500/10 text-red-400 border-red-500/20',
  }
  return (
    <div className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl border ${tones[tone] || tones.cyan}`}>
      <span className={`text-xs ${isLight ? 'text-navy-500' : 'text-white/50'}`}>{label}</span>
      <span className="text-xs font-semibold">{value}</span>
    </div>
  )
}

function RiskMeter({ value = 78 }) {
  const { theme } = useTheme()
  const isLight = theme === 'light'
  const clamped = Math.min(Math.max(value, 0), 100)
  const color = clamped >= 75 ? 'bg-red-500' : clamped >= 45 ? 'bg-orange-500' : 'bg-emerald-500'
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className={`text-xs font-medium ${isLight ? 'text-navy-500' : 'text-white/50'}`}>Escalation risk</span>
        <span className={`text-sm font-bold ${isLight ? 'text-navy-800' : 'text-white'}`}>{clamped}%</span>
      </div>
      <div className={`h-2.5 rounded-full overflow-hidden ${isLight ? 'bg-navy-100' : 'bg-white/[0.06]'}`}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${clamped}%` }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className={`h-full rounded-full ${color} ${clamped >= 75 && !isLight ? 'shadow-glow-orange' : ''}`}
        />
      </div>
    </div>
  )
}

const railTabs = [
  { id: 'signals', label: 'Signals', icon: Lightbulb },
  { id: 'kb', label: 'KB Article', icon: BookOpen },
  { id: 'reply', label: 'Reply', icon: Zap },
  { id: 'risk', label: 'Risk', icon: ShieldAlert },
]

function RailPanel({ tab, signals, kb, suggestedReply, escalation, riskRows, onUseReply }) {
  const { theme } = useTheme()
  const isLight = theme === 'light'

  if (tab === 'signals') {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          {signals.map((s, i) => <SignalChip key={`${s.key}-${i}`} {...s} />)}
        </div>
      </div>
    )
  }

  if (tab === 'kb') {
    return (
      <div>
        <p className={`text-xs mb-2 ${isLight ? 'text-navy-400' : 'text-white/40'}`}>Best match · 78% overlap</p>
        <div className={`p-4 rounded-2xl border ${isLight ? 'bg-emerald-50 border-emerald-200' : 'bg-emerald-500/10 border-emerald-500/20'}`}>
          <p className={`text-sm font-medium ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>{kb.title}</p>
          <p className={`text-xs mt-1.5 leading-relaxed ${isLight ? 'text-navy-500' : 'text-white/50'}`}>{kb.content}</p>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-3">
          {kb.keywords.map(kw => (
            <span key={kw} className={`text-[10px] px-2 py-0.5 rounded-full ${isLight ? 'bg-navy-100 text-navy-500' : 'bg-white/[0.06] text-white/40'}`}>
              {kw}
            </span>
          ))}
        </div>
      </div>
    )
  }

  if (tab === 'reply') {
    return (
      <div>
        <div className={`p-4 rounded-2xl border ${isLight ? 'bg-violet-50 border-violet-200' : 'bg-violet-500/10 border-violet-500/20'}`}>
          <p className={`text-sm leading-relaxed ${isLight ? 'text-navy-700' : 'text-white/80'}`}>{suggestedReply}</p>
        </div>
        <button onClick={onUseReply} className={`btn-primary w-full mt-3 !py-3 text-xs`}>
          <Bot className="w-3.5 h-3.5" /> Use this reply
        </button>
        <div className={`mt-4 p-3.5 rounded-2xl border ${isLight ? 'bg-navy-50 border-navy-100' : 'bg-white/[0.04] border-white/[0.06]'}`}>
          <p className={`text-[10px] uppercase tracking-wider mb-1.5 ${isLight ? 'text-navy-400' : 'text-white/30'}`}>Tone feedback</p>
          <div className="flex flex-wrap gap-1.5">
            <span className="badge-emerald">Empathetic</span>
            <span className="badge-cyan">Clear</span>
            <span className="badge-violet">Compliant</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <RiskMeter value={escalation} />
      <div className="space-y-2">
        {riskRows.map((row, i) => (
          <div key={i} className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl border ${
            isLight ? 'bg-white/[0.5] border-navy-100' : 'bg-white/[0.03] border-white/[0.06]'
          }`}>
            <span className={`text-xs ${isLight ? 'text-navy-400' : 'text-white/40'}`}>{row.label}</span>
            <span className={`text-xs font-semibold ${row.cls || ''}`}>{row.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { theme } = useTheme()
  const isLight = theme === 'light'
  const navigate = useNavigate()
  const [session, setSession] = useState(null)
  const [turns, setTurns] = useState([])
  const [draft, setDraft] = useState('')
  const [thinking, setThinking] = useState(false)
  const [railTab, setRailTab] = useState('signals')
  const [elapsed, setElapsed] = useState(0)
  const startTimeRef = useRef(null)

  const scenario = scenarios[0]
  const kb = kbDocuments[0]
  const suggestedReply =
    '"I completely understand, Rahul. I have authorised a full Rs 700 refund to your source right now, plus a Rs 100 goodwill credit for the wait. You should see it within 5-7 days."'

  const lastCoachTurn = [...turns].reverse().find(t => t.role === 'coach')
  const signals = lastCoachTurn ? lastCoachTurn.entries.filter(e => !['Suggested reply'].includes(e.key)).slice(0, 6) : []
  const riskRows = [
    { label: 'Churn threat', value: '64% · "switching"', cls: isLight ? 'text-orange-600' : 'text-orange-400' },
    { label: 'Viral threat', value: 'High', cls: isLight ? 'text-red-600' : 'text-red-400' },
    { label: 'Supervisor', value: 'Whisper ready', cls: isLight ? 'text-emerald-600' : 'text-emerald-400' },
  ]

  useEffect(() => {
    if (!session) return
    const interval = setInterval(() => setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000)), 1000)
    return () => clearInterval(interval)
  }, [session])

  const startDemo = () => {
    startTimeRef.current = Date.now()
    setElapsed(0)
    setSession({ id: 'SESS-88d3f2' })
    setTurns(liveTurns)
    setRailTab('signals')
  }

  const useSuggestedReply = () => {
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    setTurns(prev => [...prev, { role: 'agent', name: 'You', text: suggestedReply.replace(/^"|"$/g, ''), time: now }])
    setThinking(true)
    setTimeout(() => {
      setTurns(prev => [
        ...prev,
        {
          role: 'coach',
          title: 'Coaching Signal',
          entries: [
            { key: 'Frustration', value: '38% (falling)', tone: 'emerald' },
            { key: 'Escalation risk', value: '22%', tone: 'emerald' },
            { key: 'Predicted CSAT', value: '4.4 / 5', tone: 'emerald' },
            { key: 'Next move', value: 'Confirm refund ETA + close warmly', tone: 'violet' },
          ],
        },
        {
          role: 'customer',
          name: 'Rahul K.',
          text: 'That works. Thank you for actually solving this — I was about to go to the bank to dispute it.',
          time: now,
        },
      ])
      setThinking(false)
      setRailTab('signals')
    }, 900)
  }

  const sendReply = (e) => {
    e.preventDefault()
    const text = draft.trim()
    if (!text) return
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    setTurns(prev => [...prev, { role: 'agent', name: 'You', text, time: now }])
    setDraft('')
    setThinking(true)
    setTimeout(() => {
      setTurns(prev => [
        ...prev,
        {
          role: 'coach',
          title: 'Coaching Signal',
          entries: [
            { key: 'Tone', value: 'Detected ✓', tone: 'emerald' },
            { key: 'Clarity', value: 'Good', tone: 'emerald' },
            { key: 'Compliance', value: 'Pass', tone: 'emerald' },
            { key: 'Escalation risk', value: 'Dropping — 61%', tone: 'orange' },
            { key: 'Predicted CSAT', value: '3.2 / 5 (rising)', tone: 'emerald' },
            { key: 'Next move', value: 'Confirm refund amount + ETA', tone: 'violet' },
          ],
        },
        {
          role: 'customer',
          name: 'Rahul K.',
          text: 'Okay, if you can refund Rs 700 right now, that works. How long will it take to show up?',
          time: now,
        },
      ])
      setThinking(false)
      setRailTab('signals')
    }, 900)
  }

  const mmss = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  if (!session) {
    return (
      <motion.div variants={container} initial="hidden" animate="show" className="flex items-center justify-center min-h-[70vh]">
        <motion.div variants={itemAnim} className={`w-full max-w-lg p-8 md:p-10 text-center rounded-3xl ${
          isLight ? 'bg-white border border-navy-100 shadow-sm' : 'glass-card'
        }`}>
          <div className={`w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-5 ${isLight ? 'bg-emerald-100 text-emerald-600' : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'}`}>
            <Headphones className="w-7 h-7" />
          </div>
          <h2 className={`text-xl font-bold ${isLight ? 'text-navy-800' : 'text-white'}`}>No active session</h2>
          <p className={`text-sm mt-2 leading-relaxed ${isLight ? 'text-navy-400' : 'text-white/50'}`}>
            The coaching console opens when a session starts. Pick a scenario in
            Session Setup, or load a demo session to see live coaching in action.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-7">
            <Link to="/setup" className="btn-primary w-full sm:w-auto !px-6">
              <Play className="w-4 h-4" /> Launch a Session
            </Link>
            <button onClick={startDemo} className={`btn-secondary w-full sm:w-auto ${isLight ? '!bg-white !border-navy-200 !text-navy-600 hover:!bg-navy-50' : ''}`}>
              <Sparkles className="w-4 h-4" /> Load Demo Session
            </button>
          </div>
          <div className={`mt-6 pt-5 border-t ${isLight ? 'border-navy-100' : 'border-white/[0.06]'}`}>
            <p className={`text-xs ${isLight ? 'text-navy-400' : 'text-white/30'}`}>
              Quick links: <Link to="/setup" className="text-emerald-500 hover:text-emerald-400 font-medium">Setup</Link>
              <span className="mx-1.5">·</span>
              <Link to="/analytics" className="text-emerald-500 hover:text-emerald-400 font-medium">Analytics</Link>
              <span className="mx-1.5">·</span>
              <Link to="/knowledge" className="text-emerald-500 hover:text-emerald-400 font-medium">Knowledge Base</Link>
            </p>
          </div>
        </motion.div>
      </motion.div>
    )
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-5">
      <motion.div variants={itemAnim} className={`p-5 rounded-3xl ${
        isLight ? 'bg-white border border-navy-100 shadow-sm' : 'glass-card'
      }`}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${isLight ? 'bg-emerald-100 text-emerald-600' : 'bg-emerald-500/20 text-emerald-400'}`}>
              <User className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className={`text-sm font-semibold truncate ${isLight ? 'text-navy-800' : 'text-white'}`}>Rahul K. — {scenario.title}</p>
              <p className={`text-xs truncate ${isLight ? 'text-navy-400' : 'text-white/30'}`}>{scenario.persona}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="badge-emerald animate-pulse">● LIVE</span>
            <span className={`hidden sm:inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full ${
              isLight ? 'bg-navy-50 text-navy-500 border border-navy-100' : 'bg-white/[0.04] text-white/40 border border-white/[0.06]'
            }`}>
              <Timer className="w-3.5 h-3.5" /> {mmss(elapsed)}
            </span>
            <span className={`hidden md:inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full ${
              isLight ? 'bg-navy-50 text-navy-500 border border-navy-100' : 'bg-white/[0.04] text-white/40 border border-white/[0.06]'
            }`}>
              <Clock className="w-3.5 h-3.5" /> {turns.length} turns
            </span>
            <button
              onClick={() => navigate('/reports')}
              className={`inline-flex items-center gap-1.5 text-xs font-medium px-3.5 py-1.5 rounded-full transition-colors ${
                isLight ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100' : 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20'
              }`}
            >
              End Session <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-5 items-start">
        <motion.div variants={itemAnim} className={`lg:col-span-2 p-5 rounded-3xl ${
          isLight ? 'bg-white border border-navy-100 shadow-sm' : 'glass-card'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isLight ? 'bg-cyan-100 text-cyan-600' : 'bg-cyan-500/20 text-cyan-400'}`}>
                <MessageSquare className="w-4 h-4" />
              </div>
              <p className={`text-sm font-semibold ${isLight ? 'text-navy-800' : 'text-white'}`}>Live Conversation</p>
            </div>
            <span className={`text-[10px] px-2 py-1 rounded-full ${isLight ? 'bg-navy-50 text-navy-400 border border-navy-100' : 'bg-white/[0.04] text-white/30 border border-white/[0.06]'}`}>
              Zomato · Missing items
            </span>
          </div>

          <div className="space-y-4 max-h-[480px] overflow-y-auto scrollbar-hide pr-1 pb-2">
            <AnimatePresence initial={false}>
              {turns.map((turn, i) => {
                if (turn.role === 'coach') {
                  return (
                    <motion.div
                      key={`coach-${i}`}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                      className={`p-4 rounded-2xl ${
                        isLight
                          ? 'bg-gradient-to-br from-violet-50 to-cyan-50 border border-violet-200/60'
                          : 'bg-gradient-to-br from-violet-500/10 to-cyan-500/5 border border-violet-500/20'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${isLight ? 'bg-violet-100 text-violet-600' : 'bg-violet-500/20 text-violet-400'}`}>
                          <Lightbulb className="w-3.5 h-3.5" />
                        </div>
                        <p className={`text-xs font-semibold uppercase tracking-wider ${isLight ? 'text-violet-700' : 'text-violet-400'}`}>{turn.title}</p>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-2">
                        {turn.entries.map((entry, j) => (
                          <SignalChip key={`${entry.key}-${j}`} {...entry} />
                        ))}
                      </div>
                    </motion.div>
                  )
                }
                const isCustomer = turn.role === 'customer'
                return (
                  <motion.div
                    key={`${turn.role}-${i}`}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    className={`flex ${isCustomer ? 'justify-start' : 'justify-end'}`}
                  >
                    <div className={`max-w-[82%] ${isCustomer ? '' : 'text-right'}`}>
                      <p className={`text-[10px] font-medium mb-1 ${isLight ? 'text-navy-400' : 'text-white/30'}`}>
                        {turn.name} · {turn.time}
                      </p>
                      <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                        isCustomer
                          ? isLight
                            ? 'bg-navy-50 border border-navy-100 text-navy-700 rounded-tl-md'
                            : 'bg-white/[0.06] border border-white/[0.08] text-white/80 rounded-tl-md'
                          : 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-tr-md shadow-glow-emerald'
                      }`}>
                        {turn.text}
                      </div>
                    </div>
                  </motion.div>
                )
              })}
              {thinking && (
                <motion.div
                  key="thinking"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-end"
                >
                  <div className="flex items-center gap-1.5 px-4 py-3 rounded-2xl bg-white/[0.06] border border-white/[0.08]">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-typing" />
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-typing" style={{ animationDelay: '0.2s' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-typing" style={{ animationDelay: '0.4s' }} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <form onSubmit={sendReply} className="mt-4 flex items-center gap-2">
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Type the agent's reply…"
              className={`glass-input !py-3 flex-1 ${isLight ? '!bg-white' : ''}`}
            />
            <button type="submit" className={`btn-primary !px-4 !py-3 shrink-0 ${!draft.trim() ? 'opacity-40 pointer-events-none' : ''}`}>
              <Send className="w-4 h-4" />
            </button>
          </form>
        </motion.div>

        <motion.div variants={itemAnim} className={`p-5 rounded-3xl ${
          isLight ? 'bg-white border border-navy-100 shadow-sm' : 'glass-card'
        }`}>
          <div className="flex items-center gap-2 mb-4">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isLight ? 'bg-emerald-100 text-emerald-600' : 'bg-emerald-500/20 text-emerald-400'}`}>
              <Gauge className="w-4 h-4" />
            </div>
            <p className={`text-sm font-semibold ${isLight ? 'text-navy-800' : 'text-white'}`}>Coach Copilot</p>
          </div>

          <div className="flex items-center gap-1.5 p-1 rounded-2xl mb-4 bg-white/[0.04] border border-white/[0.06]">
            {railTabs.map(tab => {
              const Icon = tab.icon
              const active = railTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setRailTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl text-xs font-medium transition-all ${
                    active
                      ? isLight
                        ? 'bg-white text-navy-800 shadow-sm border border-navy-100'
                        : 'bg-white/[0.08] text-white border border-white/[0.08]'
                      : isLight
                        ? 'text-navy-400 hover:text-navy-700'
                        : 'text-white/40 hover:text-white/70'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" /> {tab.label}
                </button>
              )
            })}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={railTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
            >
              <RailPanel
                tab={railTab}
                signals={signals}
                kb={kb}
                suggestedReply={suggestedReply}
                escalation={lastCoachTurn ? 78 : 61}
                riskRows={riskRows}
                onUseReply={useSuggestedReply}
              />
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>
    </motion.div>
  )
}
