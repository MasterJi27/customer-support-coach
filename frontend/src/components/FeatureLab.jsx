import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  GitBranch, ShieldCheck, Bot, Sparkles, Zap, Ticket, ChevronDown, ChevronUp,
  RefreshCw, Send, Play,
} from 'lucide-react'
import { api } from '../lib/api'

const itemAnim = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
}

function SectionCard({ isLight, icon: Icon, color, title, subtitle, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <motion.div variants={itemAnim} className={`rounded-3xl ${isLight ? 'bg-white border border-navy-100 shadow-sm' : 'glass-card'}`}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-3 p-4"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
            <Icon className="w-4 h-4" />
          </div>
          <div className="text-left min-w-0">
            <p className={`text-sm font-semibold ${isLight ? 'text-navy-800' : 'text-white'}`}>{title}</p>
            <p className={`text-[11px] truncate ${isLight ? 'text-navy-400' : 'text-white/30'}`}>{subtitle}</p>
          </div>
        </div>
        {open ? <ChevronUp className={`w-4 h-4 shrink-0 ${isLight ? 'text-navy-400' : 'text-white/40'}`} /> : <ChevronDown className={`w-4 h-4 shrink-0 ${isLight ? 'text-navy-400' : 'text-white/40'}`} />}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function Chip({ isLight, children, tone = 'neutral' }) {
  const tones = {
    neutral: isLight ? 'bg-navy-50 text-navy-600 border-navy-100' : 'bg-white/[0.04] text-white/60 border-white/[0.06]',
    good: isLight ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    bad: isLight ? 'bg-red-50 text-red-600 border-red-200' : 'bg-red-500/10 text-red-400 border-red-500/20',
    warn: isLight ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  }
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full border ${tones[tone]}`}>
      {children}
    </span>
  )
}

export default function FeatureLab({ isLight, lastTurn, onSendReply, onRefresh, sessionId }) {
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const [multiverse, setMultiverse] = useState(null)
  const [tone, setTone] = useState({ draft: '', result: '' })
  const [compliance, setCompliance] = useState(null)
  const [bot, setBot] = useState(null)
  const [jira, setJira] = useState(null)
  const [game, setGame] = useState(null)
  const [gameReply, setGameReply] = useState({})
  const [gameBusy, setGameBusy] = useState('')

  const run = async (key, fn) => {
    setBusy(key)
    setError('')
    try {
      return await fn()
    } catch (e) {
      setError(e.message)
      return null
    } finally {
      setBusy('')
    }
  }

  const custMsg = lastTurn?.customer_message || ''

  const loadMultiverse = async () => {
    if (!custMsg) return
    const r = await run('mv', () => api.multiverse(custMsg, lastTurn?.id || 2))
    if (r) setMultiverse(r)
  }

  const polishTone = async () => {
    const r = await run('tone', () => api.tonePolish(tone.draft, custMsg))
    if (r) setTone((t) => ({ ...t, result: r }))
  }

  const runCompliance = async () => {
    const r = await run('comp', () => api.compliance(sessionId))
    if (r) setCompliance(r)
  }

  const previewBot = async () => {
    const r = await run('bot', () => api.botReply(custMsg, sessionId))
    if (r) setBot(r)
  }

  const createJira = async () => {
    const r = await run('jira', () => api.jiraTicket(undefined, sessionId))
    if (r) setJira(r)
  }

  const startGame = async () => {
    const r = await run('game', () => api.survivalStart())
    if (r) setGame(r)
  }

  const playTicket = async (idx) => {
    const reply = (gameReply[idx] || '').trim()
    if (!reply) return
    setGameBusy(idx)
    try {
      const r = await api.survivalTurn(idx, reply, 10)
      setGame(r)
      setGameReply((g) => ({ ...g, [idx]: '' }))
    } catch (e) {
      setError(e.message)
    } finally {
      setGameBusy('')
    }
  }

  const sendText = (text) => {
    if (!text) return
    onSendReply(text)
    setTone((t) => ({ ...t, result: '' }))
  }

  const resultBox = (children) => (
    <div className={`mt-3 p-3 rounded-2xl text-xs leading-relaxed ${
      isLight ? 'bg-navy-50 text-navy-700 border border-navy-100' : 'bg-white/[0.04] text-white/70 border border-white/[0.06]'
    }`}>{children}</div>
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2.5">
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isLight ? 'bg-fuchsia-100 text-fuchsia-600' : 'bg-fuchsia-500/20 text-fuchsia-400'}`}>
          <Sparkles className="w-4 h-4" />
        </div>
        <div>
          <p className={`text-sm font-semibold ${isLight ? 'text-navy-800' : 'text-white'}`}>Feature Lab</p>
          <p className={`text-[11px] ${isLight ? 'text-navy-400' : 'text-white/30'}`}>Every analysis agent from the engine, one click away</p>
        </div>
        {onRefresh && (
          <button onClick={onRefresh} className={`ml-auto inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full ${isLight ? 'bg-navy-50 text-navy-500 border border-navy-100 hover:bg-navy-100' : 'bg-white/[0.04] text-white/40 border border-white/[0.06] hover:bg-white/[0.08]'}`}>
            <RefreshCw className="w-3 h-3" /> Sync
          </button>
        )}
      </div>

      {error && (
        <div className={`px-3 py-2 rounded-xl text-xs ${isLight ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
          {error}
        </div>
      )}

      <SectionCard
        isLight={isLight} icon={GitBranch} color={isLight ? 'bg-violet-100 text-violet-600' : 'bg-violet-500/20 text-violet-400'}
        title="Multiverse Simulator" subtitle="A/B simulate two reply paths for the current customer turn"
      >
        <button onClick={loadMultiverse} disabled={busy === 'mv' || !custMsg}
          className={`btn-primary !px-4 !py-2 text-xs w-full ${(!custMsg || busy === 'mv') ? 'opacity-40 pointer-events-none' : ''}`}>
          <GitBranch className="w-3.5 h-3.5" /> {busy === 'mv' ? 'Simulating…' : 'Simulate A/B Branches'}
        </button>
        {multiverse && (
          <div className="mt-3 space-y-3">
            <div className={`p-3 rounded-2xl border ${isLight ? 'bg-violet-50 border-violet-200' : 'bg-violet-500/10 border-violet-500/20'}`}>
              <div className="flex items-center justify-between mb-1.5">
                <span className={`text-[11px] font-semibold ${isLight ? 'text-violet-700' : 'text-violet-400'}`}>Branch A — Safe path</span>
                <button onClick={() => sendText(multiverse.option_a_text)}
                  className={`inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full ${isLight ? 'bg-violet-100 text-violet-600' : 'bg-violet-500/20 text-violet-400'}`}>
                  <Send className="w-3 h-3" /> Send A
                </button>
              </div>
              <p className={`text-xs leading-relaxed ${isLight ? 'text-navy-700' : 'text-white/70'}`}>{multiverse.option_a_text}</p>
            </div>
            <div className={`p-3 rounded-2xl border ${isLight ? 'bg-cyan-50 border-cyan-200' : 'bg-cyan-500/10 border-cyan-500/20'}`}>
              <div className="flex items-center justify-between mb-1.5">
                <span className={`text-[11px] font-semibold ${isLight ? 'text-cyan-700' : 'text-cyan-400'}`}>Branch B — Bold path</span>
                <button onClick={() => sendText(multiverse.option_b_text)}
                  className={`inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full ${isLight ? 'bg-cyan-100 text-cyan-600' : 'bg-cyan-500/20 text-cyan-400'}`}>
                  <Send className="w-3 h-3" /> Send B
                </button>
              </div>
              <p className={`text-xs leading-relaxed ${isLight ? 'text-navy-700' : 'text-white/70'}`}>{multiverse.option_b_text}</p>
            </div>
            <p className={`text-[10px] ${isLight ? 'text-navy-400' : 'text-white/30'}`}>Branch {multiverse.branch_id} · simulated on turn {multiverse.parent_turn}</p>
          </div>
        )}
      </SectionCard>

      <SectionCard
        isLight={isLight} icon={Sparkles} color={isLight ? 'bg-amber-100 text-amber-600' : 'bg-amber-500/20 text-amber-400'}
        title="Tone Polisher" subtitle="Rewrite a harsh or flat draft with warmth and empathy"
      >
        <input
          value={tone.draft}
          onChange={(e) => setTone({ ...tone, draft: e.target.value })}
          placeholder="Draft reply: e.g. 'Sir, wait. I will check. Refund possible.'"
          className={`glass-input !py-2.5 text-xs w-full ${isLight ? '!bg-white' : ''}`}
        />
        <button onClick={polishTone} disabled={busy === 'tone' || !tone.draft.trim()}
          className={`btn-primary !px-4 !py-2 text-xs w-full mt-2 ${(!tone.draft.trim() || busy === 'tone') ? 'opacity-40 pointer-events-none' : ''}`}>
          <Sparkles className="w-3.5 h-3.5" /> {busy === 'tone' ? 'Polishing…' : 'Polish Reply'}
        </button>
        {tone.result && (
          <div className="mt-3">
            {resultBox(tone.result)}
            <button onClick={() => sendText(tone.result)}
              className={`inline-flex items-center gap-1 text-[11px] mt-2 px-3 py-1.5 rounded-full ${isLight ? 'bg-emerald-100 text-emerald-600' : 'bg-emerald-500/20 text-emerald-400'}`}>
              <Send className="w-3 h-3" /> Send polished reply
            </button>
          </div>
        )}
      </SectionCard>

      <SectionCard
        isLight={isLight} icon={ShieldCheck} color={isLight ? 'bg-emerald-100 text-emerald-600' : 'bg-emerald-500/20 text-emerald-400'}
        title="Compliance Audit" subtitle="Check the last agent reply against KB policy & refund rules"
      >
        <button onClick={runCompliance} disabled={busy === 'comp'}
          className={`btn-primary !px-4 !py-2 text-xs w-full ${busy === 'comp' ? 'opacity-40 pointer-events-none' : ''}`}>
          <ShieldCheck className="w-3.5 h-3.5" /> {busy === 'comp' ? 'Auditing…' : 'Audit Last Reply'}
        </button>
        {compliance && (
          <div className="mt-3 space-y-2">
            <div className="flex flex-wrap gap-1.5">
              <Chip isLight={isLight} tone={compliance.is_violation ? 'bad' : 'good'}>
                {compliance.is_violation ? `VIOLATION · ${(compliance.severity || '').toUpperCase()}` : 'CLEAN REPLY'}
              </Chip>
              {compliance.category && <Chip isLight={isLight}>{compliance.category}</Chip>}
            </div>
            {compliance.reasoning && resultBox(compliance.reasoning)}
          </div>
        )}
      </SectionCard>

      <SectionCard
        isLight={isLight} icon={Bot} color={isLight ? 'bg-sky-100 text-sky-600' : 'bg-sky-500/20 text-sky-400'}
        title="Zomato Bot Preview" subtitle="What the automated first-line bot would reply, and when it escalates"
      >
        <button onClick={previewBot} disabled={busy === 'bot' || !custMsg}
          className={`btn-primary !px-4 !py-2 text-xs w-full ${(!custMsg || busy === 'bot') ? 'opacity-40 pointer-events-none' : ''}`}>
          <Bot className="w-3.5 h-3.5" /> {busy === 'bot' ? 'Generating…' : 'Preview Bot Reply'}
        </button>
        {bot && (
          <div className="mt-3 space-y-2">
            <div className="flex flex-wrap gap-1.5">
              <Chip isLight={isLight} tone={bot.should_escalate ? 'warn' : 'good'}>
                {bot.should_escalate ? `ESCALATE → ${bot.escalation_reason || ''}` : 'BOT HANDLES'}
              </Chip>
            </div>
            {resultBox(bot.reply)}
          </div>
        )}
      </SectionCard>

      <SectionCard
        isLight={isLight} icon={Ticket} color={isLight ? 'bg-rose-100 text-rose-600' : 'bg-rose-500/20 text-rose-400'}
        title="Jira Bug Ticket" subtitle="Turn this conversation into an engineering ticket (live Jira attach)"
      >
        <button onClick={createJira} disabled={busy === 'jira'}
          className={`btn-primary !px-4 !py-2 text-xs w-full ${busy === 'jira' ? 'opacity-40 pointer-events-none' : ''}`}>
          <Ticket className="w-3.5 h-3.5" /> {busy === 'jira' ? 'Drafting ticket…' : 'Generate Jira Ticket'}
        </button>
        {jira && (
          <div className="mt-3 space-y-2">
            <div className="flex flex-wrap gap-1.5">
              <Chip isLight={isLight} tone="warn">{jira.ticket_id || ''}</Chip>
              {jira.priority && <Chip isLight={isLight} tone={jira.priority === 'High' || jira.priority === 'Critical' ? 'bad' : 'neutral'}>{jira.priority}</Chip>}
              {jira.issue_type && <Chip isLight={isLight}>{jira.issue_type}</Chip>}
            </div>
            {jira.summary && resultBox(<><span className="font-semibold">{jira.summary}</span><br />{jira.description || ''}</>)}
            {jira.jira_url && <p className={`text-[10px] ${isLight ? 'text-navy-400' : 'text-white/30'}`}>Attached: {jira.jira_url}</p>}
          </div>
        )}
      </SectionCard>

      <SectionCard
        isLight={isLight} icon={Zap} color={isLight ? 'bg-orange-100 text-orange-600' : 'bg-orange-500/20 text-orange-400'}
        title="Survival Arcade" subtitle="4 angry customers, 100 HP. Reply fast and well or lose health."
      >
        {!game ? (
          <button onClick={startGame} disabled={busy === 'game'}
            className={`btn-primary !px-4 !py-2 text-xs w-full ${busy === 'game' ? 'opacity-40 pointer-events-none' : ''}`}>
            <Play className="w-3.5 h-3.5" /> {busy === 'game' ? 'Loading…' : 'Start Arcade Mode'}
          </button>
        ) : (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-1.5">
              <Chip isLight={isLight} tone={game.state.health > 50 ? 'good' : game.state.health > 25 ? 'warn' : 'bad'}>
                ❤️ {game.state.health} HP
              </Chip>
              <Chip isLight={isLight}>⭐ {game.state.score}</Chip>
              <Chip isLight={isLight}>🔥 x{game.state.streak}</Chip>
              {game.state.active_powerup && <Chip isLight={isLight} tone="warn">{game.state.active_powerup}</Chip>}
              {game.state.is_game_over && <Chip isLight={isLight} tone="bad">GAME OVER</Chip>}
            </div>
            {game.feedback && resultBox(game.feedback)}
            <div className="space-y-2.5">
              {game.tickets.map((t, i) => (
                <div key={t.ticket_id} className={`p-3 rounded-2xl border ${t.is_resolved
                  ? isLight ? 'bg-emerald-50 border-emerald-200' : 'bg-emerald-500/5 border-emerald-500/20'
                  : isLight ? 'bg-navy-50 border-navy-100' : 'bg-white/[0.04] border-white/[0.06]'}`}>
                  <div className="flex items-center justify-between gap-2">
                    <p className={`text-xs font-semibold ${isLight ? 'text-navy-800' : 'text-white'}`}>
                      {t.customer_name} — {t.issue_title}
                      {t.is_resolved && <span className={`ml-2 text-[10px] ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`}>✓ RESOLVED</span>}
                    </p>
                    <span className={`text-[10px] shrink-0 ${isLight ? 'text-navy-400' : 'text-white/30'}`}>{t.urgency_level} · {t.timer_seconds}s</span>
                  </div>
                  <p className={`text-[11px] mt-1 leading-relaxed ${isLight ? 'text-navy-500' : 'text-white/50'}`}>{t.problem_description}</p>
                  {!t.is_resolved && !game.state.is_game_over && (
                    <div className="flex gap-2 mt-2">
                      <input
                        value={gameReply[i] || ''}
                        onChange={(e) => setGameReply((g) => ({ ...g, [i]: e.target.value }))}
                        placeholder="Your reply…"
                        className={`glass-input !py-2 text-xs flex-1 ${isLight ? '!bg-white' : ''}`}
                      />
                      <button onClick={() => playTicket(i)} disabled={gameBusy === i}
                        className={`btn-primary !px-3 !py-2 shrink-0 ${gameBusy === i ? 'opacity-40' : ''}`}>
                        <Send className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <button onClick={startGame} disabled={busy === 'game'} className="text-[11px] w-full text-center opacity-60 hover:opacity-100">
              ↻ Restart game
            </button>
          </div>
        )}
      </SectionCard>
    </div>
  )
}
