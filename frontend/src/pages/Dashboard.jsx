import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Send, ShieldAlert, BookOpen, Lightbulb, Bot, User, Zap, Play,
  Headphones, Gauge, ChevronRight, Clock, Timer, MessageSquare, Mail, X,
} from 'lucide-react'
import { useTheme } from '../components/ThemeContext'
import FeatureLab from '../components/FeatureLab'
import { scenarios, kbDocuments } from '../data'
import api from '../lib/api'
import IconChip from '../components/ui/IconChip'
import SectionCard from '../components/ui/SectionCard'

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
          className={`h-full rounded-full ${color}`}
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

function RailPanel({ tab, signals, kb, suggestedReply, escalation, riskRows, onUseReply, deep }) {
  const { theme } = useTheme()
  const isLight = theme === 'light'

  if (tab === 'signals') {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          {signals.map((s, i) => <SignalChip key={`${s.key}-${i}`} {...s} />)}
        </div>
        {deep?.true_intent && (
          <div className={`p-3.5 rounded-2xl border ${isLight ? 'bg-violet-50 border-violet-200' : 'bg-violet-500/10 border-violet-500/20'}`}>
            <p className={`text-[10px] uppercase tracking-wider mb-1 ${isLight ? 'text-violet-600' : 'text-violet-400'}`}>Mind-reader · true intent</p>
            <p className={`text-xs leading-relaxed ${isLight ? 'text-navy-600' : 'text-white/60'}`}>{deep.true_intent}</p>
            {deep.internal_monologue && (
              <p className={`text-xs mt-2 italic leading-relaxed ${isLight ? 'text-navy-400' : 'text-white/40'}`}>"{deep.internal_monologue}"</p>
            )}
          </div>
        )}
      </div>
    )
  }

  if (tab === 'kb') {
    return (
      <div>
        <p className={`text-xs mb-2 ${isLight ? 'text-navy-400' : 'text-white/40'}`}>
          {kb.source ? `Best match · ${kb.source}` : 'Best match · 78% overlap'}
        </p>
        <div className={`p-4 rounded-2xl border ${isLight ? 'bg-emerald-50 border-emerald-200' : 'bg-emerald-500/10 border-emerald-500/20'}`}>
          <p className={`text-sm font-medium ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>{kb.title}</p>
          <p className={`text-xs mt-1.5 leading-relaxed ${isLight ? 'text-navy-500' : 'text-white/50'}`}>{kb.content}</p>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-3">
          {(kb.keywords || []).map(kw => (
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
      {deep?.pr_statement && (
        <div className={`p-3.5 rounded-2xl border ${isLight ? 'bg-red-50 border-red-200' : 'bg-red-500/10 border-red-500/20'}`}>
          <p className={`text-[10px] uppercase tracking-wider mb-1 ${isLight ? 'text-red-600' : 'text-red-400'}`}>
            📣 PR Statement · viral {deep.viral_risk_pct ?? 0}%
          </p>
          <p className={`text-xs leading-relaxed ${isLight ? 'text-navy-600' : 'text-white/60'}`}>{deep.pr_statement}</p>
        </div>
      )}
      {deep?.retention_counter_offer && (
        <div className={`p-3.5 rounded-2xl border ${isLight ? 'bg-emerald-50 border-emerald-200' : 'bg-emerald-500/10 border-emerald-500/20'}`}>
          <p className={`text-[10px] uppercase tracking-wider mb-1 ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`}>
            🎁 Retention offer
          </p>
          <p className={`text-xs leading-relaxed ${isLight ? 'text-navy-600' : 'text-white/60'}`}>{deep.retention_counter_offer}</p>
        </div>
      )}
      {deep?.fraud_protocol && (
        <div className={`p-3.5 rounded-2xl border ${isLight ? 'bg-orange-50 border-orange-200' : 'bg-orange-500/10 border-orange-500/20'}`}>
          <p className={`text-[10px] uppercase tracking-wider mb-1 ${isLight ? 'text-orange-600' : 'text-orange-400'}`}>
            🛡️ Fraud protocol · {deep.fraud_category}
          </p>
          <p className={`text-xs leading-relaxed ${isLight ? 'text-navy-600' : 'text-white/60'}`}>{deep.fraud_protocol}</p>
        </div>
      )}
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
  const [lastTurn, setLastTurn] = useState(null)
  const [apiError, setApiError] = useState('')
  const [startAttempt, setStartAttempt] = useState(0)
  const [showEndModal, setShowEndModal] = useState(false)
  const [reportEmail, setReportEmail] = useState('raghavkathuria63@gmail.com')
  const [endingSession, setEndingSession] = useState(false)
  const startTimeRef = useRef(null)
  const autoStartRef = useRef(false)
  const sessionRef = useRef(null)
  useEffect(() => { sessionRef.current = session }, [session])

  const scenario = scenarios[0]
  // Which scenario is actually live in this session — defaults to the demo
  // scenario, then gets overwritten in startDemo() with whatever Setup.jsx
  // actually launched (title/persona), so the header stops always saying "Zomato".
  const [scenarioMeta, setScenarioMeta] = useState({ title: scenario.title, persona: scenario.persona })
  const kb = kbDocuments[0]
  const suggestedReply = lastTurn?.suggested_response || ''
  const liveKb = lastTurn?.kb?.title ? lastTurn.kb : null

  const lastCoachTurn = [...turns].reverse().find(t => t.role === 'coach')
  const signals = lastTurn
    ? [
        { key: 'Intent', value: (lastTurn.intent || 'general').replace(/_/g, ' '), tone: 'cyan' },
        { key: 'Sentiment', value: lastTurn.sentiment, tone: 'violet' },
        { key: 'Frustration', value: `${lastTurn.frustration_pct}%`, tone: lastTurn.frustration_pct >= 60 ? 'red' : lastTurn.frustration_pct >= 35 ? 'orange' : 'emerald' },
        { key: 'Escalation risk', value: `${lastTurn.escalation_risk_pct ?? lastTurn.frustration_pct}%`, tone: (lastTurn.escalation_risk_pct ?? 0) >= 60 ? 'red' : (lastTurn.escalation_risk_pct ?? 0) >= 35 ? 'orange' : 'emerald' },
        { key: 'Predicted CSAT', value: lastTurn.predicted_csat ? `${lastTurn.predicted_csat}/5` : '—', tone: (lastTurn.predicted_csat ?? 4) >= 3.5 ? 'emerald' : 'orange' },
        { key: 'Churn risk', value: lastTurn.churn_risk_pct ? `${lastTurn.churn_risk_pct}%` : '—', tone: (lastTurn.churn_risk_pct ?? 0) >= 50 ? 'red' : (lastTurn.churn_risk_pct ?? 0) >= 25 ? 'orange' : 'emerald' },
        { key: 'Viral threat', value: lastTurn.viral_risk_pct ? `${lastTurn.viral_risk_pct}%` : '—', tone: (lastTurn.viral_risk_pct ?? 0) >= 40 ? 'red' : 'cyan' },
        { key: 'Fraud signal', value: lastTurn.fraud_risk_pct ? `${lastTurn.fraud_risk_pct}%` : '—', tone: (lastTurn.fraud_risk_pct ?? 0) >= 60 ? 'red' : 'emerald' },
        { key: 'Clarity', value: `${lastTurn.clarity_pct}%`, tone: lastTurn.clarity_pct >= 75 ? 'emerald' : 'orange' },
        { key: 'Response quality', value: `${Math.round((lastTurn.quality_score || 0.8) * 100)}%`, tone: lastTurn.quality_score >= 0.75 ? 'emerald' : 'orange' },
      ]
    : lastCoachTurn
      ? lastCoachTurn.entries.filter(e => !['Suggested reply'].includes(e.key)).slice(0, 6)
      : []
  const riskRows = lastTurn
    ? [
        { label: 'Frustration', value: `${lastTurn.frustration_pct}%`, cls: lastTurn.frustration_pct >= 60 ? 'text-red-600' : lastTurn.frustration_pct >= 35 ? 'text-orange-600' : 'text-emerald-600' },
        { label: 'Sentiment', value: lastTurn.sentiment, cls: lastTurn.sentiment === 'angry' ? 'text-red-600' : lastTurn.sentiment === 'frustrated' ? 'text-orange-600' : 'text-emerald-600' },
        { label: 'Escalation risk', value: `${lastTurn.escalation_risk_pct ?? '—'}%`, cls: (lastTurn.escalation_risk_pct ?? 0) >= 60 ? 'text-red-600' : (lastTurn.escalation_risk_pct ?? 0) >= 35 ? 'text-orange-600' : 'text-emerald-600' },
        { label: 'Predicted CSAT', value: lastTurn.predicted_csat ? `${lastTurn.predicted_csat}/5` : '—', cls: (lastTurn.predicted_csat ?? 4) >= 3.5 ? 'text-emerald-600' : 'text-orange-600' },
        { label: 'Churn risk', value: lastTurn.churn_risk_pct ? `${lastTurn.churn_risk_pct}%` : '—', cls: (lastTurn.churn_risk_pct ?? 0) >= 50 ? 'text-red-600' : 'text-emerald-600' },
        { label: 'Viral / PR risk', value: lastTurn.viral_risk_pct ? `${lastTurn.viral_risk_pct}%` : '—', cls: (lastTurn.viral_risk_pct ?? 0) >= 40 ? 'text-red-600' : 'text-emerald-600' },
        { label: 'Fraud risk', value: lastTurn.fraud_risk_pct ? `${lastTurn.fraud_risk_pct}%` : '—', cls: (lastTurn.fraud_risk_pct ?? 0) >= 60 ? 'text-red-600' : 'text-emerald-600' },
        { label: 'Coaching tips', value: `${lastTurn.coaching_tips?.length || 0} ready`, cls: 'text-cyan-600' },
      ]
    : [
        { label: 'Sentiment', value: '—', cls: 'text-white/40' },
        { label: 'Frustration', value: '—', cls: 'text-white/40' },
        { label: 'Clarity', value: '—', cls: 'text-white/40' },
      ]

  useEffect(() => {
    if (session) return
    const cfg = localStorage.getItem('coachai_session_config')
    if (cfg && !autoStartRef.current) {
      autoStartRef.current = true
      startDemo().finally(() => {
        if (!sessionRef.current) autoStartRef.current = false
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startAttempt, session])

  useEffect(() => {
    if (!session) return
    const interval = setInterval(() => setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000)), 1000)
    return () => clearInterval(interval)
  }, [session])

  const startDemo = async () => {
    setThinking(true)
    setApiError('')
    try {
      let cfg = {}
      try { cfg = JSON.parse(localStorage.getItem('coachai_session_config') || '{}') } catch { /* ignore */ }
      const resolvedMeta = {
        title: cfg.scenario_title || scenario.title,
        persona: cfg.scenario_persona || scenario.persona,
      }
      const res = await api.startSession({
        mode: cfg.mode || 'simulator',
        agent_name: cfg.agent_name || 'Support Agent',
        product_context: cfg.product_context || 'Zomato Food Delivery',
        scenario_choice: cfg.scenario_choice || 'delivery_delay',
      })
      localStorage.removeItem('coachai_session_config')
      startTimeRef.current = Date.now()
      setElapsed(0)
      setSession({ id: res.session_id, product_context: res.product_context })
      setScenarioMeta(resolvedMeta)
      setTurns(
        (res.messages || []).map((m, i) => ({
          role: m.role === 'customer' ? 'customer' : 'agent',
          name: m.role === 'customer' ? resolvedMeta.persona : 'You',
          text: m.content,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          fromApi: true,
        }))
      )
      setLastTurn(res.last_turn || null)
      setRailTab('signals')
    } catch (e) {
      setApiError(e.message)
    } finally {
      setThinking(false)
    }
  }

  const useSuggestedReply = async () => {
    if (!suggestedReply) return
    setThinking(true)
    try {
      const res = await api.sendMessage(suggestedReply.replace(/^"|"$/g, ''), 'agent', session?.id)
      setTurns(
        (res.messages || []).map((m, i) => ({
          role: m.role === 'customer' ? 'customer' : 'agent',
          name: m.role === 'customer' ? scenarioMeta.persona : 'You',
          text: m.content,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          fromApi: true,
        }))
      )
      setLastTurn(res.last_turn || null)
      setRailTab('signals')
    } catch (e) {
      setApiError(e.message)
    } finally {
      setThinking(false)
    }
  }

  const sendText = async (text) => {
    const trimmed = (text || '').trim()
    if (!trimmed) return
    setDraft('')
    setThinking(true)
    try {
      const res = await api.sendMessage(trimmed, 'agent', session?.id)
      setTurns(
        (res.messages || []).map((m, i) => ({
          role: m.role === 'customer' ? 'customer' : 'agent',
          name: m.role === 'customer' ? scenarioMeta.persona : 'You',
          text: m.content,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          fromApi: true,
        }))
      )
      setLastTurn(res.last_turn || null)
      setRailTab('signals')
    } catch (err) {
      setApiError(err.message)
    } finally {
      setThinking(false)
    }
  }

  const sendReply = async (e) => {
    e.preventDefault()
    const text = draft.trim()
    if (!text) return
    setDraft('')
    await sendText(text)
  }

  const mmss = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  const runAutopilot = async () => {
    if (!session || thinking) return
    setThinking(true)
    setApiError('')
    try {
      const res = await api.autopilot(session?.id)
      setTurns(
        (res.messages || []).map((m, i) => ({
          role: m.role === 'customer' ? 'customer' : 'agent',
          name: m.role === 'customer' ? scenarioMeta.persona : 'You',
          text: m.content,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          fromApi: true,
        }))
      )
      setLastTurn(res.last_turn || null)
      setRailTab('signals')
    } catch (err) {
      setApiError(err.message)
    } finally {
      setThinking(false)
    }
  }

  const runManagerTakeover = async () => {
    if (!session || thinking) return
    setThinking(true)
    setApiError('')
    try {
      const res = await api.managerTakeover('', session?.id)
      setTurns(
        (res.messages || []).map((m, i) => ({
          role: m.role === 'customer' ? 'customer' : 'agent',
          name: m.role === 'customer' ? scenarioMeta.persona : 'You',
          text: m.content,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          fromApi: true,
        }))
      )
      setLastTurn(res.last_turn || null)
      setRailTab('signals')
    } catch (err) {
      setApiError(err.message)
    } finally {
      setThinking(false)
    }
  }

  const openEndModal = () => {
    if (!session) {
      navigate('/reports')
      return
    }
    setShowEndModal(true)
  }

  const confirmEndSession = async (emailToUse) => {
    setEndingSession(true)
    try {
      await api.endSession(session.id, emailToUse || undefined)
    } catch (err) {
      setApiError(err.message)
    } finally {
      setEndingSession(false)
      setShowEndModal(false)
      navigate('/reports')
    }
  }

  if (!session) {
    return (
      <motion.div variants={container} initial="hidden" animate="show" className="flex items-center justify-center min-h-[70vh]">
        <motion.div variants={itemAnim} className={`w-full max-w-lg p-8 md:p-10 text-center rounded-3xl ${
          isLight ? 'bg-white border border-navy-100 shadow-sm' : 'glass-card'
        }`}>
          <div className={`w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-5 ${isLight ? 'bg-emerald-100 text-emerald-600' : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'}`}>
            <Headphones className="w-7 h-7" />
          </div>
          <h2 className={`text-xl font-bold ${isLight ? 'text-navy-800' : 'text-white'}`}>
            {thinking ? 'Starting session…' : 'No active session'}
          </h2>
          {thinking ? (
            <p className={`text-sm mt-2 leading-relaxed ${isLight ? 'text-navy-400' : 'text-white/50'}`}>
              The AI is preparing the customer, analyzing intent, and generating coaching signals.
              This can take up to a minute on the free tier — please wait.
            </p>
          ) : (
            <p className={`text-sm mt-2 leading-relaxed ${isLight ? 'text-navy-400' : 'text-white/50'}`}>
              The coaching console opens when a session starts. Pick a scenario in
              Session Setup, or load a demo session to see live coaching in action.
            </p>
          )}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-7">
            <Link to="/setup" className="btn-primary w-full sm:w-auto !px-6">
              <Play className="w-4 h-4" /> Launch a Session
            </Link>
            {apiError && (
              <button onClick={() => { setApiError(''); setStartAttempt(n => n + 1) }} className="text-xs font-medium text-amber-500 hover:text-amber-400">
                ↻ Retry with saved setup
              </button>
            )}
          </div>
          {apiError && (
            <div className={`mt-4 px-4 py-3 rounded-2xl text-xs ${isLight ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
              {apiError}
            </div>
          )}
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
              <p className={`text-sm font-semibold truncate ${isLight ? 'text-navy-800' : 'text-white'}`}>{scenarioMeta.title}</p>
              <p className={`text-xs truncate ${isLight ? 'text-navy-400' : 'text-white/30'}`}>{scenarioMeta.persona}</p>
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
              onClick={runAutopilot}
              disabled={thinking}
              className={`inline-flex items-center gap-1.5 text-xs font-medium px-3.5 py-1.5 rounded-full transition-colors ${
                isLight ? 'bg-violet-50 text-violet-600 border border-violet-200 hover:bg-violet-100' : 'bg-violet-500/10 text-violet-400 border border-violet-500/20 hover:bg-violet-500/20'
              }`}
            >
              <Zap className="w-3 h-3" /> Autopilot
            </button>
            <button
              onClick={runManagerTakeover}
              disabled={thinking}
              className={`inline-flex items-center gap-1.5 text-xs font-medium px-3.5 py-1.5 rounded-full transition-colors ${
                isLight ? 'bg-amber-50 text-amber-600 border border-amber-200 hover:bg-amber-100' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20'
              }`}
            >
              <Bot className="w-3 h-3" /> Manager
            </button>
            <button
              onClick={openEndModal}
              disabled={thinking}
              className={`inline-flex items-center gap-1.5 text-xs font-medium px-3.5 py-1.5 rounded-full transition-colors ${
                isLight ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100' : 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20'
              }`}
            >
              End Session <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </motion.div>

      {apiError && (
        <motion.div variants={itemAnim} className={`px-4 py-3 rounded-2xl text-xs ${isLight ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
          {apiError}
        </motion.div>
      )}

      <div className="grid lg:grid-cols-3 gap-5 items-start">
        <motion.div variants={itemAnim} className="lg:col-span-2">
        <SectionCard
          icon={MessageSquare}
          color="cyan"
          title="Live Conversation"
          action={
            <span className={`text-[10px] px-2 py-1 rounded-full ${isLight ? 'bg-navy-50 text-navy-400 border border-navy-100' : 'bg-white/[0.04] text-white/30 border border-white/[0.06]'}`}>
              {session?.product_context || 'Live session'}
            </span>
          }
        >
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
                          ? 'bg-violet-50 border border-violet-200'
                          : 'bg-violet-500/[0.08] border border-violet-500/20'
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
                          : 'bg-emerald-600 text-white rounded-tr-md'
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
        </SectionCard>
        </motion.div>

        <motion.div variants={itemAnim}>
        <SectionCard icon={Gauge} color="emerald" title="Coach Copilot">
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

          <motion.div
            key={railTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18 }}
          >
            <RailPanel
              tab={railTab}
              signals={signals}
              kb={liveKb || kb}
              suggestedReply={suggestedReply}
              escalation={lastTurn?.escalation_risk_pct ?? (lastCoachTurn ? 78 : 61)}
              riskRows={riskRows}
              deep={lastTurn}
              onUseReply={useSuggestedReply}
            />
          </motion.div>
        </SectionCard>
        </motion.div>
      </div>

      <FeatureLab isLight={isLight} lastTurn={lastTurn} onSendReply={sendText} onRefresh={startDemo} sessionId={session?.id} />

      <AnimatePresence>
        {showEndModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => !endingSession && setShowEndModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              onClick={(e) => e.stopPropagation()}
              className={`w-full max-w-md p-6 rounded-3xl ${isLight ? 'bg-white border border-navy-100 shadow-xl' : 'glass-card'}`}
            >
              <div className="flex items-center justify-between mb-1">
                <IconChip icon={Mail} color="emerald" />
                <button onClick={() => setShowEndModal(false)} className={isLight ? 'text-navy-400 hover:text-navy-600' : 'text-white/40 hover:text-white'}>
                  <X className="w-4 h-4" />
                </button>
              </div>
              <h3 className={`text-lg font-bold mt-3 ${isLight ? 'text-navy-800' : 'text-white'}`}>End session & email the report</h3>
              <p className={`text-xs mt-1.5 leading-relaxed ${isLight ? 'text-navy-400' : 'text-white/40'}`}>
                We'll generate the coaching report and email a full summary — what was discussed, issues found, and coaching tips — to the address below.
              </p>
              <input
                type="email"
                value={reportEmail}
                onChange={(e) => setReportEmail(e.target.value)}
                placeholder="you@example.com"
                className={`glass-input mt-4 !py-2.5 w-full ${isLight ? '!bg-white' : ''}`}
              />
              <div className="flex flex-col sm:flex-row gap-2.5 mt-5">
                <button
                  onClick={() => confirmEndSession(reportEmail.trim())}
                  disabled={endingSession || !reportEmail.trim()}
                  className={`btn-primary flex-1 !py-3 text-sm ${(endingSession || !reportEmail.trim()) ? 'opacity-50 pointer-events-none' : ''}`}
                >
                  <Mail className="w-4 h-4" /> {endingSession ? 'Sending…' : 'Send Report & End'}
                </button>
                <button
                  onClick={() => confirmEndSession('')}
                  disabled={endingSession}
                  className={`btn-secondary flex-1 !py-3 text-sm ${isLight ? '!bg-white !border-navy-200 !text-navy-600 hover:!bg-navy-50' : ''} ${endingSession ? 'opacity-50 pointer-events-none' : ''}`}
                >
                  Skip email, just end
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
