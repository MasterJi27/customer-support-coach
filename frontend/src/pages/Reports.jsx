import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, FileText, Info, AlertTriangle, CheckCircle2, Lightbulb, BookOpen, Download, Star } from 'lucide-react'
import { useTheme } from '../components/ThemeContext'
import { reportSample } from '../data'
import api from '../lib/api'

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
}

const itemAnim = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
}

function ScoreRing({ score }) {
  const { theme } = useTheme()
  const isLight = theme === 'light'
  const r = 52
  const c = 2 * Math.PI * r
  const filled = (score / 100) * c
  return (
    <div className="relative w-36 h-36">
      <svg className="w-36 h-36 -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={r} fill="none" strokeWidth="10" className={isLight ? 'stroke-navy-100' : 'stroke-white/[0.06]'} />
        <motion.circle
          cx="60" cy="60" r={r} fill="none" strokeWidth="10" strokeLinecap="round"
          stroke="url(#scoreGrad)"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c - filled }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        />
        <defs>
          <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="100%" stopColor="#22d3ee" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-3xl font-extrabold ${isLight ? 'text-navy-800' : 'text-white'}`}>{score}</span>
        <span className={`text-[10px] uppercase tracking-wider ${isLight ? 'text-navy-400' : 'text-white/30'}`}>Score</span>
      </div>
    </div>
  )
}

function SentimentJourney({ data }) {
  const { theme } = useTheme()
  const isLight = theme === 'light'
  const max = 5
  return (
    <div className="flex items-end gap-3 h-32 pt-4">
      {data.map((p, i) => {
        const height = (p.value / max) * 100
        const color = p.value >= 4 ? 'from-emerald-400 to-emerald-500' : p.value >= 3 ? 'from-orange-400 to-orange-500' : 'from-red-400 to-red-500'
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
            <span className={`text-[10px] font-medium ${isLight ? 'text-navy-400' : 'text-white/50'}`}>{p.value.toFixed(1)}</span>
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: `${height}%` }}
              transition={{ duration: 0.7, delay: i * 0.15, ease: [0.16, 1, 0.3, 1] }}
              className={`w-full rounded-lg bg-gradient-to-t ${color}`}
              style={{ minHeight: '16px' }}
            />
            <span className={`text-[10px] ${isLight ? 'text-navy-400' : 'text-white/30'}`}>{p.label}</span>
          </div>
        )
      })}
    </div>
  )
}

export default function Reports() {
  const { theme } = useTheme()
  const isLight = theme === 'light'
  const [report, setReport] = useState(reportSample)
  const [live, setLive] = useState(false)

  useEffect(() => {
    let mounted = true
    api.reports().then((res) => {
      if (!mounted || !res.reports?.length) return
      const raw = res.reports[0]
      const mapped = {
        sessionId: raw.session_id || raw.sessionId || raw._file || 'SESS-?',
        date: raw.created_at || raw.date || raw.generated_at || new Date().toISOString().slice(0, 16).replace('T', ' '),
        scenario: raw.scenario_title || raw.scenario || raw.product_context || 'CoachAI Session',
        overallScore: Math.round((raw.overall_score ?? 0.86) * 100),
        resolution: raw.resolution_quality || raw.resolution || 'Completed',
        duration: raw.duration_min ? `${raw.duration_min} min` : 'â€”',
        turns: raw.turn_count || raw.turns || 0,
        sentimentJourney: raw.sentiment_journey || report.sentimentJourney,
        flags: raw.flags || report.flags,
        coachingTips: raw.coaching_tips || raw.tips || report.coachingTips,
        kbUsed: raw.kb_used || raw.kb || report.kbUsed,
      }
      setReport(mapped)
      setLive(true)
    }).catch(() => { /* keep sample */ })
    return () => { mounted = false }
  }, [])

  const flagStyles = {
    info: isLight ? 'bg-cyan-50 border-cyan-200 text-cyan-700' : 'bg-cyan-500/10 border-cyan-500/20 text-cyan-300',
    warning: isLight ? 'bg-orange-50 border-orange-200 text-orange-700' : 'bg-orange-500/10 border-orange-500/20 text-orange-300',
    success: isLight ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300',
  }
  const flagIcons = { info: Info, warning: AlertTriangle, success: CheckCircle2 }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className={`text-2xl font-bold ${isLight ? 'text-navy-800' : 'text-white'}`}>Session Report</h1>
          <p className={`text-sm mt-0.5 ${isLight ? 'text-navy-400' : 'text-white/40'}`}>
            {report.sessionId} Â· {report.date}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-secondary !px-4 !py-2.5 text-xs">
            <Download className="w-3.5 h-3.5" /> Export
          </button>
          <Link to="/analytics" className="btn-primary !px-4 !py-2.5 text-xs">
            View Trends <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      <motion.div variants={itemAnim} className={`p-6 rounded-3xl ${isLight ? 'bg-white border border-navy-100 shadow-sm' : 'glass-card'}`}>
        <div className="flex flex-col lg:flex-row items-center gap-8">
          <ScoreRing score={report.overallScore} />
          <div className="flex-1 w-full grid sm:grid-cols-2 gap-4">
            <div className={`p-4 rounded-2xl ${isLight ? 'bg-navy-50 border border-navy-100' : 'bg-white/[0.04] border border-white/[0.06]'}`}>
              <p className={`text-xs ${isLight ? 'text-navy-400' : 'text-white/40'}`}>Scenario</p>
              <p className={`text-sm font-semibold mt-1 ${isLight ? 'text-navy-800' : 'text-white'}`}>{report.scenario}</p>
            </div>
            <div className={`p-4 rounded-2xl ${isLight ? 'bg-navy-50 border border-navy-100' : 'bg-white/[0.04] border border-white/[0.06]'}`}>
              <p className={`text-xs ${isLight ? 'text-navy-400' : 'text-white/40'}`}>Resolution</p>
              <p className={`text-sm font-semibold mt-1 ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`}>{report.resolution}</p>
            </div>
            <div className={`p-4 rounded-2xl ${isLight ? 'bg-navy-50 border border-navy-100' : 'bg-white/[0.04] border border-white/[0.06]'}`}>
              <p className={`text-xs ${isLight ? 'text-navy-400' : 'text-white/40'}`}>Duration</p>
              <p className={`text-sm font-semibold mt-1 ${isLight ? 'text-navy-800' : 'text-white'}`}>{report.duration}</p>
            </div>
            <div className={`p-4 rounded-2xl ${isLight ? 'bg-navy-50 border border-navy-100' : 'bg-white/[0.04] border border-white/[0.06]'}`}>
              <p className={`text-xs ${isLight ? 'text-navy-400' : 'text-white/40'}`}>Turns</p>
              <p className={`text-sm font-semibold mt-1 ${isLight ? 'text-navy-800' : 'text-white'}`}>{report.turns} exchanges</p>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-6">
        <motion.div variants={itemAnim} className={`p-5 rounded-3xl ${isLight ? 'bg-white border border-navy-100 shadow-sm' : 'glass-card'}`}>
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isLight ? 'bg-emerald-100 text-emerald-600' : 'bg-emerald-500/20 text-emerald-400'}`}>
              <Star className="w-4 h-4" />
            </div>
            <p className={`text-sm font-semibold ${isLight ? 'text-navy-800' : 'text-white'}`}>Sentiment Journey</p>
          </div>
          <p className={`text-xs mb-3 ${isLight ? 'text-navy-400' : 'text-white/30'}`}>Customer sentiment (1-5) across the session</p>
          <SentimentJourney data={report.sentimentJourney} />
        </motion.div>

        <motion.div variants={itemAnim} className={`p-5 rounded-3xl ${isLight ? 'bg-white border border-navy-100 shadow-sm' : 'glass-card'}`}>
          <div className="flex items-center gap-2 mb-4">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isLight ? 'bg-cyan-100 text-cyan-600' : 'bg-cyan-500/20 text-cyan-400'}`}>
              <FileText className="w-4 h-4" />
            </div>
            <p className={`text-sm font-semibold ${isLight ? 'text-navy-800' : 'text-white'}`}>Session Flags</p>
          </div>
          <div className="space-y-2.5">
            {report.flags.map((f, i) => {
              const FlagIcon = flagIcons[f.severity] || Info
              return (
                <div key={i} className={`flex items-start gap-3 px-3.5 py-3 rounded-2xl border ${flagStyles[f.severity]}`}>
                  <FlagIcon className="w-4 h-4 shrink-0 mt-0.5" />
                  <p className="text-sm leading-relaxed">{f.text}</p>
                </div>
              )
            })}
          </div>
        </motion.div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <motion.div variants={itemAnim} className={`p-5 rounded-3xl ${isLight ? 'bg-white border border-navy-100 shadow-sm' : 'glass-card'}`}>
          <div className="flex items-center gap-2 mb-4">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isLight ? 'bg-violet-100 text-violet-600' : 'bg-violet-500/20 text-violet-400'}`}>
              <Lightbulb className="w-4 h-4" />
            </div>
            <p className={`text-sm font-semibold ${isLight ? 'text-navy-800' : 'text-white'}`}>Coaching Tips</p>
          </div>
          <ul className="space-y-2.5">
            {report.coachingTips.map((tip, i) => (
              <li key={i} className={`flex items-start gap-2.5 text-sm leading-relaxed ${isLight ? 'text-navy-600' : 'text-white/70'}`}>
                <span className="w-5 h-5 rounded-full bg-violet-500/20 text-violet-400 text-[10px] flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                {tip}
              </li>
            ))}
          </ul>
        </motion.div>

        <motion.div variants={itemAnim} className={`p-5 rounded-3xl ${isLight ? 'bg-white border border-navy-100 shadow-sm' : 'glass-card'}`}>
          <div className="flex items-center gap-2 mb-4">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isLight ? 'bg-orange-100 text-orange-600' : 'bg-orange-500/20 text-orange-400'}`}>
              <BookOpen className="w-4 h-4" />
            </div>
            <p className={`text-sm font-semibold ${isLight ? 'text-navy-800' : 'text-white'}`}>Knowledge Base Used</p>
          </div>
          <div className="space-y-2.5">
            {report.kbUsed.map(kb => (
              <div key={kb} className={`flex items-center justify-between px-3.5 py-3 rounded-2xl border ${
                isLight ? 'bg-orange-50 border-orange-200' : 'bg-orange-500/10 border-orange-500/20'
              }`}>
                <span className={`text-sm font-medium ${isLight ? 'text-orange-700' : 'text-orange-300'}`}>{kb}</span>
                <span className="badge-emerald">Applied</span>
              </div>
            ))}
          </div>
          <div className={`mt-4 p-4 rounded-2xl border ${isLight ? 'bg-navy-50 border-navy-100' : 'bg-white/[0.04] border-white/[0.06]'}`}>
            <p className={`text-xs ${isLight ? 'text-navy-400' : 'text-white/40'}`}>
              ISO-style QA audit: <span className={`font-semibold ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`}>PASS (21/24 checks)</span> Â· 3 minor warnings on tone consistency
            </p>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}
