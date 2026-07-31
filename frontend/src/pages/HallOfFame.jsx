import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, Skull, Sparkles, ChevronRight, Flame } from 'lucide-react'
import { useTheme } from '../components/ThemeContext'
import { hallOfFame, hallOfShame } from '../data'
import api from '../lib/api'

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
}

const itemAnim = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
}

function EntryCard({ entry, shame = false }) {
  const { theme } = useTheme()
  const isLight = theme === 'light'
  const [expanded, setExpanded] = useState(false)
  const pct = Math.round(entry.score * 100)
  return (
    <motion.div
      variants={itemAnim}
      className={`overflow-hidden rounded-3xl transition-all duration-300 ${
        shame
          ? isLight
            ? 'bg-white border border-red-200 shadow-sm'
            : 'glass-card border-red-500/15'
          : isLight
            ? 'bg-white border border-amber-200 shadow-sm'
            : 'glass-card border-amber-500/20'
      }`}
    >
      <div className={`p-5 ${shame
        ? isLight ? 'bg-gradient-to-br from-red-50 to-transparent' : 'bg-gradient-to-br from-red-500/[0.08] to-transparent'
        : isLight ? 'bg-gradient-to-br from-amber-50 to-transparent' : 'bg-gradient-to-br from-amber-500/[0.08] to-transparent'
      }`}>
        <div className="flex items-center justify-between mb-3">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
            shame
              ? isLight ? 'bg-red-100 text-red-600' : 'bg-red-500/20 text-red-400'
              : isLight ? 'bg-amber-100 text-amber-600' : 'bg-amber-500/20 text-amber-400'
          }`}>
            {shame ? <Skull className="w-5 h-5" /> : <Trophy className="w-5 h-5" />}
          </div>
          <span className={`text-[10px] font-medium px-2.5 py-1 rounded-full ${
            shame
              ? isLight ? 'bg-red-100 text-red-600' : 'bg-red-500/15 text-red-400 border border-red-500/20'
              : isLight ? 'bg-amber-100 text-amber-700' : 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
          }`}>
            {entry.id}
          </span>
        </div>
        <h3 className={`text-sm font-semibold ${isLight ? 'text-navy-800' : 'text-white'}`}>{entry.title}</h3>
        <p className={`text-xs mt-1 ${isLight ? 'text-navy-400' : 'text-white/40'}`}>{entry.date}</p>
        <p className={`text-xs mt-3 leading-relaxed line-clamp-2 ${isLight ? 'text-navy-500' : 'text-white/50'}`}>{entry.summary}</p>
        <button
          onClick={() => setExpanded(!expanded)}
          className={`mt-3 inline-flex items-center gap-1 text-xs font-medium ${
            shame
              ? isLight ? 'text-red-500 hover:text-red-600' : 'text-red-400 hover:text-red-300'
              : isLight ? 'text-amber-600 hover:text-amber-700' : 'text-amber-400 hover:text-amber-300'
          }`}
        >
          {expanded ? 'Show less' : 'Read transcript'} <ChevronRight className={`w-3 h-3 transition-transform ${expanded ? 'rotate-90' : ''}`} />
        </button>
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className={`mt-3 p-3 rounded-2xl text-xs leading-relaxed ${
                isLight ? 'bg-white border border-navy-100 text-navy-500' : 'bg-white/[0.04] border border-white/[0.06] text-white/50'
              }`}>
                Turn-by-turn transcript with the coach signals on every customer message. Full report available in Reports.
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="flex items-center gap-3 mt-4">
          <div className={`flex-1 h-2 rounded-full overflow-hidden ${isLight ? 'bg-navy-100' : 'bg-white/[0.06]'}`}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className={`h-full rounded-full ${shame ? 'bg-gradient-to-r from-red-500 to-orange-500' : 'bg-gradient-to-r from-amber-400 to-emerald-400'}`}
            />
          </div>
          <span className={`text-sm font-bold ${isLight ? 'text-navy-800' : 'text-white'}`}>{pct}%</span>
        </div>
      </div>
    </motion.div>
  )
}

export default function HallOfFame() {
  const { theme } = useTheme()
  const isLight = theme === 'light'
  const [fame, setFame] = useState(hallOfFame)
  const [shame, setShame] = useState(hallOfShame)

  useEffect(() => {
    let mounted = true
    api.hallOfFame().then((res) => {
      if (!mounted || !res.entries?.length) return
      const mapEntry = (e) => ({
        id: e.entry_id || `HOF-${Math.random().toString(36).slice(2, 6)}`,
        title: e.title || 'Archived session',
        date: e.archived_at || e.created_at || '',
        summary: e.summary || '',
        score: e.overall_score ?? 0.5,
        transcript: e.transcript || [],
      })
      setFame(res.entries.filter(e => (e.category || '').toLowerCase().includes('fame')).map(mapEntry))
      setShame(res.entries.filter(e => (e.category || '').toLowerCase().includes('shame')).map(mapEntry))
    }).catch(() => { /* keep sample */ })
    return () => { mounted = false }
  }, [])

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <div>
        <h1 className={`text-2xl font-bold ${isLight ? 'text-navy-800' : 'text-white'}`}>Golden Vault</h1>
        <p className={`text-sm mt-0.5 ${isLight ? 'text-navy-400' : 'text-white/40'}`}>
          Masterclass sessions worth replaying â€” and cautionary tales worth avoiding
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <motion.div variants={itemAnim}>
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
              isLight ? 'bg-amber-100 text-amber-600' : 'bg-amber-500/20 text-amber-400'
            }`}>
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h2 className={`text-base font-bold ${isLight ? 'text-navy-800' : 'text-white'}`}>Hall of Fame</h2>
              <p className={`text-xs ${isLight ? 'text-navy-400' : 'text-white/40'}`}>Best resolution scores archived</p>
            </div>
          </div>
          <div className="space-y-4">
            {fame.map(e => <EntryCard key={e.id} entry={e} />)}
          </div>
        </motion.div>

        <motion.div variants={itemAnim}>
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
              isLight ? 'bg-red-100 text-red-600' : 'bg-red-500/20 text-red-400'
            }`}>
              <Skull className="w-5 h-5" />
            </div>
            <div>
              <h2 className={`text-base font-bold ${isLight ? 'text-navy-800' : 'text-white'}`}>Hall of Shame</h2>
              <p className={`text-xs ${isLight ? 'text-navy-400' : 'text-white/40'}`}>The roast archive â€” learn from the misses</p>
            </div>
          </div>
          <div className="space-y-4">
            {shame.map(e => <EntryCard key={e.id} entry={e} shame />)}
          </div>
        </motion.div>
      </div>

      <motion.div variants={itemAnim} className={`p-5 rounded-3xl ${
        isLight
          ? 'bg-gradient-to-r from-amber-50 via-white to-red-50 border border-navy-100 shadow-sm'
          : 'bg-gradient-to-r from-amber-500/[0.06] via-transparent to-red-500/[0.06] border border-white/[0.08] glass-card'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${isLight ? 'bg-emerald-100 text-emerald-600' : 'bg-emerald-500/20 text-emerald-400'}`}>
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <p className={`text-sm font-semibold ${isLight ? 'text-navy-800' : 'text-white'}`}>Survival Arcade mode</p>
            <p className={`text-xs ${isLight ? 'text-navy-400' : 'text-white/40'}`}>
              Multi-ticket sprint practice â€” survive 10 escalating customers in a row and beat the floor record.
            </p>
          </div>
          <button className={`ml-auto shrink-0 btn-primary !px-4 !py-2.5 text-xs ${isLight ? '' : ''}`}>
            <Flame className="w-3.5 h-3.5" /> Start Arcade
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
