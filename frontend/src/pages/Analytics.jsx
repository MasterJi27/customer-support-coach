import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, TrendingUp, ShieldAlert, Target, BookOpen, Trophy, Crown, Medal } from 'lucide-react'
import { useTheme } from '../components/ThemeContext'
import { scoreTrend, escalationTriggers, improvementAreas, knowledgeGaps, leaderboard, summaryStats as sampleStats } from '../data'
import { icons } from '../lib/icons'
import api from '../lib/api'

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
}

const itemAnim = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
}

function StatCard({ label, value, sub, icon, color }) {
  const { theme } = useTheme()
  const isLight = theme === 'light'
  const Icon = icons[icon] || TrendingUp
  const iconColors = {
    emerald: isLight ? 'text-emerald-600 bg-emerald-100' : 'text-emerald-400 bg-emerald-500/20',
    cyan: isLight ? 'text-cyan-600 bg-cyan-100' : 'text-cyan-400 bg-cyan-500/20',
    violet: isLight ? 'text-violet-600 bg-violet-100' : 'text-violet-400 bg-violet-500/20',
    orange: isLight ? 'text-orange-600 bg-orange-100' : 'text-orange-400 bg-orange-500/20',
    pink: isLight ? 'text-pink-600 bg-pink-100' : 'text-pink-400 bg-pink-500/20',
  }
  return (
    <motion.div
      variants={itemAnim}
      className={`p-5 transition-all duration-300 ${
        isLight ? 'bg-white rounded-3xl shadow-sm border border-navy-100 hover:shadow-md' : 'glass-card-hover'
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${iconColors[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        <span className={`text-[10px] font-medium uppercase tracking-wider ${isLight ? 'text-navy-400' : 'text-white/30'}`}>{label}</span>
      </div>
      <p className={`text-2xl font-bold ${isLight ? 'text-navy-800' : 'text-white'}`}>{value}</p>
      <p className={`text-xs mt-0.5 ${isLight ? 'text-navy-400' : 'text-white/40'}`}>{sub}</p>
    </motion.div>
  )
}

function ScoreTrendChart({ values, labels }) {
  const { theme } = useTheme()
  const isLight = theme === 'light'
  return (
    <div className="flex items-end gap-2 h-40 pt-4">
      {values.map((val, i) => {
        const height = Math.max(val, 5)
        const isHigh = val >= 90
        const isMid = val >= 75
        const gradient = isHigh ? 'from-emerald-400 to-emerald-500' : isMid ? 'from-orange-400 to-orange-500' : 'from-red-400 to-red-500'
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
            <span className={`text-[10px] font-medium ${isLight ? 'text-navy-400' : 'text-white/50'}`}>{val}%</span>
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: `${height}%` }}
              transition={{ duration: 0.6, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
              className={`w-full rounded-lg bg-gradient-to-t ${gradient} ${isHigh && !isLight ? 'shadow-glow-emerald' : ''}`}
              style={{ maxHeight: '160px', minHeight: '20px' }}
            />
            <span className={`text-[10px] ${isLight ? 'text-navy-400' : 'text-white/30'}`}>{labels?.[i] || ''}</span>
          </div>
        )
      })}
    </div>
  )
}

function SectionCard({ icon: Icon, iconCls, title, children }) {
  const { theme } = useTheme()
  const isLight = theme === 'light'
  return (
    <div className={`p-5 rounded-3xl ${
      isLight ? 'bg-white border border-navy-100 shadow-sm' : 'glass-card'
    }`}>
      <div className="flex items-center gap-2 mb-4">
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${iconCls}`}>
          <Icon className="w-4 h-4" />
        </div>
        <p className={`text-sm font-semibold ${isLight ? 'text-navy-800' : 'text-white'}`}>{title}</p>
      </div>
      {children}
    </div>
  )
}

const rankStyles = {
  1: 'from-amber-400 to-yellow-500',
  2: 'from-slate-300 to-slate-400',
  3: 'from-orange-400 to-amber-500',
}

export default function Analytics() {
  const { theme } = useTheme()
  const isLight = theme === 'light'
  const [summaryStats, setSummaryStats] = useState(sampleStats)
  const [liveSessions, setLiveSessions] = useState(null)

  useEffect(() => {
    let mounted = true
    api.analytics().then((res) => {
      if (!mounted) return
      const s = res.summary || {}
      setSummaryStats([
        { label: 'Sessions (API)', value: String(s.sessions_today ?? sampleStats[0].value), sub: 'from live backend', icon: 'Headphones', color: 'emerald' },
        { label: 'Avg Resolution Score', value: `${s.avg_score_pct ?? 86}%`, sub: 'live estimate', icon: 'TrendingUp', color: 'cyan' },
        { label: 'Escalation Rate', value: `${s.escalation_rate_pct ?? 11}%`, sub: 'live estimate', icon: 'ShieldAlert', color: 'orange' },
        { label: 'Predicted CSAT', value: String(s.predicted_csat ?? 4.3), sub: 'live estimate', icon: 'Star', color: 'violet' },
      ])
      setLiveSessions(res.sessions)
    }).catch(() => { /* keep samples */ })
    return () => { mounted = false }
  }, [])

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className={`text-2xl font-bold ${isLight ? 'text-navy-800' : 'text-white'}`}>Analytics</h1>
          <p className={`text-sm mt-0.5 ${isLight ? 'text-navy-400' : 'text-white/40'}`}>
            Cross-session trends, agent floor leaderboard, and gap analysis
          </p>
        </div>
        <Link to="/hall-of-fame" className="btn-secondary !px-4 !py-2.5 text-xs">
          <Trophy className="w-3.5 h-3.5" /> Hall of Fame <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryStats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <motion.div variants={itemAnim} className="lg:col-span-2">
          <SectionCard icon={TrendingUp} iconCls={isLight ? 'bg-emerald-100 text-emerald-600' : 'bg-emerald-500/20 text-emerald-400'} title="Score Trend — Last 7 Days">
            <ScoreTrendChart values={scoreTrend.values} labels={scoreTrend.labels} />
          </SectionCard>
        </motion.div>

        <motion.div variants={itemAnim} className="space-y-6">
          <SectionCard icon={ShieldAlert} iconCls={isLight ? 'bg-red-100 text-red-600' : 'bg-red-500/20 text-red-400'} title="Escalation Triggers">
            <div className="space-y-3">
              {escalationTriggers.map(t => (
                <div key={t.label}>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className={isLight ? 'text-navy-500' : 'text-white/60'}>{t.label}</span>
                    <span className={`font-semibold ${isLight ? 'text-navy-700' : 'text-white/80'}`}>{t.count}x</span>
                  </div>
                  <div className={`h-2 rounded-full overflow-hidden ${isLight ? 'bg-navy-100' : 'bg-white/[0.06]'}`}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(t.count / 14) * 100}%` }}
                      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                      className="h-full rounded-full bg-gradient-to-r from-orange-400 to-red-500"
                    />
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </motion.div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <SectionCard icon={Target} iconCls={isLight ? 'bg-violet-100 text-violet-600' : 'bg-violet-500/20 text-violet-400'} title="Improvement Areas">
          <ul className="space-y-2.5">
            {improvementAreas.map((a, i) => (
              <li key={i} className={`flex items-start gap-2.5 text-sm leading-relaxed ${isLight ? 'text-navy-600' : 'text-white/70'}`}>
                <span className="w-5 h-5 rounded-full bg-violet-500/20 text-violet-400 text-[10px] flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                {a}
              </li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard icon={BookOpen} iconCls={isLight ? 'bg-cyan-100 text-cyan-600' : 'bg-cyan-500/20 text-cyan-400'} title="Knowledge Gaps">
          <ul className="space-y-2.5">
            {knowledgeGaps.map((g, i) => (
              <li key={i} className={`flex items-start gap-2.5 text-sm leading-relaxed ${isLight ? 'text-navy-600' : 'text-white/70'}`}>
                <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 text-[10px] flex items-center justify-center shrink-0 mt-0.5">!</span>
                {g}
              </li>
            ))}
          </ul>
          <Link to="/knowledge" className={`mt-4 inline-flex items-center gap-1.5 text-xs font-medium ${isLight ? 'text-cyan-600 hover:text-cyan-700' : 'text-cyan-400 hover:text-cyan-300'}`}>
            Open KB console <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </SectionCard>

        <SectionCard icon={Trophy} iconCls={isLight ? 'bg-orange-100 text-orange-600' : 'bg-orange-500/20 text-orange-400'} title="This Week's Snapshot">
          <div className="space-y-3">
            {[
              { label: 'Sessions coached', value: '54' },
              { label: 'Avg resolution score', value: '86%' },
              { label: 'Avg handle time', value: '9m 40s' },
              { label: 'Saves vs escalation', value: '38 : 6' },
            ].map(row => (
              <div key={row.label} className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl border ${
                isLight ? 'bg-navy-50 border-navy-100' : 'bg-white/[0.04] border-white/[0.06]'
              }`}>
                <span className={`text-xs ${isLight ? 'text-navy-400' : 'text-white/40'}`}>{row.label}</span>
                <span className={`text-sm font-semibold ${isLight ? 'text-navy-800' : 'text-white'}`}>{row.value}</span>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <motion.div variants={itemAnim}>
        <div className={`p-5 rounded-3xl ${isLight ? 'bg-white border border-navy-100 shadow-sm' : 'glass-card'}`}>
          <div className="flex items-center gap-2 mb-5">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isLight ? 'bg-emerald-100 text-emerald-600' : 'bg-emerald-500/20 text-emerald-400'}`}>
              <Medal className="w-4 h-4" />
            </div>
            <div>
              <p className={`text-sm font-semibold ${isLight ? 'text-navy-800' : 'text-white'}`}>Live Contact Center Agent Floor</p>
              <p className={`text-xs ${isLight ? 'text-navy-400' : 'text-white/30'}`}>Ranked by average resolution score</p>
            </div>
          </div>
          <div className="space-y-2">
            {leaderboard.map(agent => (
              <div
                key={agent.rank}
                className={`flex items-center gap-4 p-3.5 rounded-2xl transition-colors ${
                  agent.rank === 1
                    ? isLight
                      ? 'bg-gradient-to-r from-amber-50 to-white border border-amber-200'
                      : 'bg-gradient-to-r from-amber-500/10 to-transparent border border-amber-500/20'
                    : isLight
                      ? 'hover:bg-navy-50'
                      : 'hover:bg-white/[0.04]'
                }`}
              >
                <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${rankStyles[agent.rank] || 'from-navy-500 to-navy-600'} flex items-center justify-center text-navy-900 font-bold text-xs shrink-0`}>
                  {agent.rank === 1 ? <Crown className="w-4 h-4" /> : agent.rank}
                </div>
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-400 flex items-center justify-center shrink-0">
                  <span className="text-navy-900 text-xs font-bold">{agent.name.split(' ').map(w => w[0]).join('')}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${isLight ? 'text-navy-800' : 'text-white'}`}>{agent.name}</p>
                  <p className={`text-xs ${isLight ? 'text-navy-400' : 'text-white/30'}`}>{agent.team} · {agent.sessions} sessions</p>
                </div>
                <div className="hidden sm:block">
                  <div className={`h-1.5 w-24 rounded-full overflow-hidden ${isLight ? 'bg-navy-100' : 'bg-white/[0.06]'}`}>
                    <div
                      className={`h-full rounded-full ${agent.avgScore >= 90 ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' : agent.avgScore >= 85 ? 'bg-gradient-to-r from-cyan-400 to-cyan-500' : 'bg-gradient-to-r from-orange-400 to-orange-500'}`}
                      style={{ width: `${agent.avgScore}%` }}
                    />
                  </div>
                </div>
                <span className={`text-sm font-bold w-10 text-right ${isLight ? 'text-navy-800' : 'text-white'}`}>{agent.avgScore}%</span>
                <span className={`hidden md:inline-flex text-[10px] font-medium px-2 py-0.5 rounded-full ${
                  agent.trend.startsWith('+')
                    ? isLight ? 'bg-emerald-100 text-emerald-600' : 'bg-emerald-500/15 text-emerald-400'
                    : agent.trend.startsWith('-')
                      ? isLight ? 'bg-red-100 text-red-600' : 'bg-red-500/15 text-red-400'
                      : isLight ? 'bg-navy-100 text-navy-400' : 'bg-white/[0.06] text-white/40'
                }`}>
                  {agent.trend}
                </span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
