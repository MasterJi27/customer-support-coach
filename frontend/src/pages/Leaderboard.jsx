import { motion } from 'framer-motion'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Crown, Medal, Flame, Download, TrendingUp, TrendingDown, Minus, Users } from 'lucide-react'
import { useTheme } from '../components/ThemeContext'
import { useToast } from '../components/ToastContext'
import { leaderboard } from '../data'

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
}

const itemAnim = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
}

const PODIUM_STYLES = [
  { ring: 'ring-amber-400/50', fill: 'bg-gradient-to-br from-amber-400 to-yellow-500', bar: 'bg-amber-400', height: 'h-32', label: 'text-amber-500' },
  { ring: 'ring-slate-300', fill: 'bg-slate-400', bar: 'bg-slate-400', height: 'h-24', label: 'text-slate-400' },
  { ring: 'ring-orange-400/50', fill: 'bg-orange-500', bar: 'bg-orange-500', height: 'h-20', label: 'text-orange-500' },
]

function TrendBadge({ trend }) {
  const { theme } = useTheme()
  const isLight = theme === 'light'
  const up = trend.startsWith('+')
  const down = trend.startsWith('-')
  const Icon = up ? TrendingUp : down ? TrendingDown : Minus
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${
      up
        ? isLight ? 'bg-emerald-100 text-emerald-600' : 'bg-emerald-500/15 text-emerald-400'
        : down
          ? isLight ? 'bg-red-100 text-red-600' : 'bg-red-500/15 text-red-400'
          : isLight ? 'bg-navy-100 text-navy-400' : 'bg-white/[0.06] text-white/40'
    }`}>
      <Icon className="w-3 h-3" /> {trend}
    </span>
  )
}

export default function Leaderboard() {
  const { theme } = useTheme()
  const isLight = theme === 'light'
  const toast = useToast()
  const [agents] = useState(leaderboard)

  const sorted = [...agents].sort((a, b) => a.rank - b.rank)
  const podium = sorted.slice(0, 3)
  const rest = sorted.slice(3)

  const exportCsv = () => {
    const rows = [
      ['Rank', 'Agent', 'Team', 'Sessions', 'Avg Score', 'Trend'],
      ...sorted.map(a => [a.rank, a.name, a.team, a.sessions, `${a.avgScore}%`, a.trend]),
    ]
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `leaderboard-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
    toast.success(`Exported ${sorted.length} agents to CSV`)
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className={`text-2xl font-bold ${isLight ? 'text-navy-800' : 'text-white'}`}>Agent Floor Leaderboard</h1>
          <p className={`text-sm mt-0.5 ${isLight ? 'text-navy-400' : 'text-white/40'}`}>
            Ranked by average resolution score across all coached sessions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportCsv} className="btn-secondary !px-4 !py-2.5 text-xs">
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
          <Link to="/setup" className="btn-primary !px-4 !py-2.5 text-xs">
            <Flame className="w-3.5 h-3.5" /> Start Arcade
          </Link>
        </div>
      </div>

      <motion.div variants={itemAnim} className={`p-5 rounded-3xl ${isLight ? 'bg-white border border-navy-100 shadow-sm' : 'glass-card'}`}>
        <p className={`text-xs mb-5 ${isLight ? 'text-navy-400' : 'text-white/40'}`}>Top 3 this week</p>
        <div className="flex items-end justify-center gap-3 sm:gap-6">
          {podium.map((agent, i) => {
            const style = PODIUM_STYLES[i] || PODIUM_STYLES[2]
            return (
              <div key={agent.rank} className="flex flex-col items-center w-1/3 sm:w-auto">
                {i === 0 && <Crown className={`w-5 h-5 mb-2 ${isLight ? 'text-amber-500' : 'text-amber-400'}`} />}
                <div className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl ${style.fill} flex items-center justify-center ring-2 ${style.ring}`}>
                  <span className="text-navy-900 font-bold text-sm sm:text-base">
                    {agent.name.split(' ').map(w => w[0]).join('')}
                  </span>
                  <span className={`absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full ${isLight ? 'bg-white border border-navy-100' : 'bg-navy-800 border border-white/10'} flex items-center justify-center text-[10px] font-bold ${style.label}`}>
                    {agent.rank}
                  </span>
                </div>
                <p className={`mt-3 text-sm font-semibold text-center ${isLight ? 'text-navy-800' : 'text-white'}`}>{agent.name}</p>
                <p className={`text-[10px] ${isLight ? 'text-navy-400' : 'text-white/30'}`}>{agent.team}</p>
                <div className={`mt-2 w-full ${style.height} rounded-t-2xl ${style.bar} opacity-20 flex items-start justify-center pt-2`}>
                  <span className="text-navy-900 font-bold text-lg">{agent.avgScore}%</span>
                </div>
              </div>
            )
          })}
        </div>
      </motion.div>

      <motion.div variants={itemAnim} className={`p-5 rounded-3xl ${isLight ? 'bg-white border border-navy-100 shadow-sm' : 'glass-card'}`}>
        <div className="flex items-center gap-2 mb-4">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isLight ? 'bg-emerald-100 text-emerald-600' : 'bg-emerald-500/20 text-emerald-400'}`}>
            <Users className="w-4 h-4" />
          </div>
          <p className={`text-sm font-semibold ${isLight ? 'text-navy-800' : 'text-white'}`}>Full Ranking</p>
        </div>
        <div className="space-y-2">
          {sorted.map(agent => (
            <div
              key={agent.rank}
              className={`flex items-center gap-3 sm:gap-4 p-3.5 rounded-2xl transition-colors ${
                isLight ? 'hover:bg-navy-50' : 'hover:bg-white/[0.04]'
              }`}
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                PODIUM_STYLES[agent.rank - 1]
                  ? `${PODIUM_STYLES[agent.rank - 1].fill} text-navy-900`
                  : isLight ? 'bg-navy-100 text-navy-500' : 'bg-white/[0.06] text-white/50'
              }`}>
                {agent.rank}
              </div>
              <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center shrink-0">
                <span className="text-white text-xs font-bold">{agent.name.split(' ').map(w => w[0]).join('')}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${isLight ? 'text-navy-800' : 'text-white'}`}>{agent.name}</p>
                <p className={`text-xs ${isLight ? 'text-navy-400' : 'text-white/30'}`}>{agent.team} · {agent.sessions} sessions</p>
              </div>
              <div className="hidden md:block w-24">
                <div className={`h-1.5 rounded-full overflow-hidden ${isLight ? 'bg-navy-100' : 'bg-white/[0.06]'}`}>
                  <div
                    className={`h-full rounded-full ${agent.avgScore >= 90 ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' : agent.avgScore >= 85 ? 'bg-gradient-to-r from-cyan-400 to-cyan-500' : 'bg-gradient-to-r from-orange-400 to-orange-500'}`}
                    style={{ width: `${agent.avgScore}%` }}
                  />
                </div>
              </div>
              <span className={`text-sm font-bold w-10 text-right ${isLight ? 'text-navy-800' : 'text-white'}`}>{agent.avgScore}%</span>
              <TrendBadge trend={agent.trend} />
            </div>
          ))}
        </div>
        {rest.length === 0 && (
          <p className={`text-center text-xs pt-2 ${isLight ? 'text-navy-300' : 'text-white/20'}`}>
            <Medal className="w-3.5 h-3.5 inline mr-1" />Climb the floor by coaching more sessions
          </p>
        )}
      </motion.div>
    </motion.div>
  )
}
