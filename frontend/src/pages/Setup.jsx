import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ChevronRight, Play, Bot, Keyboard, History, Check, Sparkles, SlidersHorizontal } from 'lucide-react'
import { useTheme } from '../components/ThemeContext'
import { modes, scenarios, transcripts } from '../data'

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
}

const itemAnim = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
}

const modeIcons = { simulator: Bot, manual: Keyboard, replay: History }

const emotionBadge = {
  angry: { label: 'Angry', light: 'bg-red-100 text-red-600', dark: 'bg-red-500/15 text-red-400 border border-red-500/20' },
  frustrated: { label: 'Frustrated', light: 'bg-orange-100 text-orange-600', dark: 'bg-orange-500/15 text-orange-400 border border-orange-500/20' },
  neutral: { label: 'Neutral', light: 'bg-navy-100 text-navy-500', dark: 'bg-white/[0.06] text-white/40 border border-white/[0.08]' },
}

function ModeCard({ mode, selected, onSelect }) {
  const { theme } = useTheme()
  const isLight = theme === 'light'
  const Icon = modeIcons[mode.id] || Bot
  const active = selected === mode.id
  return (
    <button
      onClick={() => onSelect(mode.id)}
      className={`relative text-left p-5 rounded-3xl transition-all duration-300 group ${
        active
          ? isLight
            ? 'bg-white border-2 border-emerald-400 shadow-md'
            : 'glass-card border-emerald-500/50'
          : isLight
            ? 'bg-white border border-navy-100 shadow-sm hover:shadow-md'
            : 'glass-card-hover'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center mb-3 ${
          isLight ? 'bg-emerald-100 text-emerald-600' : 'bg-emerald-500/20 text-emerald-400'
        }`}>
          <Icon className="w-5 h-5" />
        </div>
        {active && (
          <span className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center">
            <Check className="w-3.5 h-3.5" />
          </span>
        )}
      </div>
      <p className={`text-sm font-semibold ${isLight ? 'text-navy-800' : 'text-white'}`}>{mode.title}</p>
      <p className={`text-xs mt-1.5 leading-relaxed ${isLight ? 'text-navy-400' : 'text-white/40'}`}>{mode.description}</p>
    </button>
  )
}

export default function Setup() {
  const { theme } = useTheme()
  const isLight = theme === 'light'
  const navigate = useNavigate()
  const [mode, setMode] = useState('simulator')
  const [selectedScenario, setSelectedScenario] = useState(scenarios[0].id)
  const [selectedTranscript, setSelectedTranscript] = useState(transcripts[0].id)
  const [humorMode, setHumorMode] = useState(false)
  const [hinglishMode, setHinglishMode] = useState(false)
  const [agentName, setAgentName] = useState('You')

  const selected = scenarios.find(s => s.id === selectedScenario)

  const launchSession = () => {
    const isReplay = mode === 'replay'
    const transcript = transcripts.find(t => t.id === selectedTranscript)
    localStorage.setItem('coachai_session_config', JSON.stringify({
      mode: isReplay ? 'replay' : 'simulator',
      scenario_choice: isReplay ? (transcript?.title || 'delivery_delay') : selectedScenario,
      agent_name: agentName || 'Support Agent',
      // NB: scenario objects use `product`, not `product_context` — this used to
      // silently fall back to the Zomato default for every scenario.
      product_context: (isReplay ? transcript?.label : selected?.product) || 'Zomato Food Delivery',
      scenario_title: isReplay ? transcript?.label : selected?.title,
      scenario_persona: isReplay ? '' : selected?.persona,
    }))
    navigate('/dashboard')
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <div>
        <h1 className={`text-2xl font-bold ${isLight ? 'text-navy-800' : 'text-white'}`}>Session Setup</h1>
        <p className={`text-sm mt-0.5 ${isLight ? 'text-navy-400' : 'text-white/40'}`}>
          Configure a practice session — mode, scenario, and voice options
        </p>
      </div>

      <motion.div variants={itemAnim}>
        <div className="flex items-center gap-2 mb-3">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isLight ? 'bg-emerald-100 text-emerald-600' : 'bg-emerald-500/20 text-emerald-400'}`}>
            <SlidersHorizontal className="w-4 h-4" />
          </div>
          <h2 className={`text-sm font-semibold ${isLight ? 'text-navy-800' : 'text-white'}`}>1 · Choose mode</h2>
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          {modes.map(m => (
            <ModeCard key={m.id} mode={m} selected={mode} onSelect={setMode} />
          ))}
        </div>
      </motion.div>

      <motion.div variants={itemAnim}>
        <div className="flex items-center gap-2 mb-3">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isLight ? 'bg-cyan-100 text-cyan-600' : 'bg-cyan-500/20 text-cyan-400'}`}>
            <Sparkles className="w-4 h-4" />
          </div>
          <h2 className={`text-sm font-semibold ${isLight ? 'text-navy-800' : 'text-white'}`}>
            2 · Pick {mode === 'replay' ? 'a transcript' : 'a scenario'}
          </h2>
        </div>

        {mode === 'replay' ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {transcripts.map(t => (
              <button
                key={t.id}
                onClick={() => setSelectedTranscript(t.id)}
                className={`text-left p-4 rounded-3xl transition-all duration-300 ${
                  selectedTranscript === t.id
                    ? isLight
                      ? 'bg-white border-2 border-emerald-400 shadow-md'
                      : 'glass-card border-emerald-500/50'
                    : isLight
                      ? 'bg-white border border-navy-100 shadow-sm hover:shadow-md'
                      : 'glass-card-hover'
                }`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2.5 ${isLight ? 'bg-violet-100 text-violet-600' : 'bg-violet-500/20 text-violet-400'}`}>
                  <History className="w-4 h-4" />
                </div>
                <p className={`text-sm font-medium ${isLight ? 'text-navy-800' : 'text-white'}`}>{t.label}</p>
                <p className={`text-xs mt-1 ${isLight ? 'text-navy-400' : 'text-white/40'}`}>{t.turns} turns</p>
              </button>
            ))}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {scenarios.map(s => {
              const active = selectedScenario === s.id
              const emo = emotionBadge[s.emotion] || emotionBadge.neutral
              return (
                <button
                  key={s.id}
                  onClick={() => setSelectedScenario(s.id)}
                  className={`text-left p-4 rounded-3xl transition-all duration-300 group ${
                    active
                      ? isLight
                        ? 'bg-white border-2 border-emerald-400 shadow-md'
                        : 'glass-card border-emerald-500/50'
                      : isLight
                        ? 'bg-white border border-navy-100 shadow-sm hover:shadow-md'
                        : 'glass-card-hover'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                      isLight ? 'bg-navy-100 text-navy-500' : 'bg-white/[0.06] text-white/40'
                    }`}>{s.product.split('—')[0].trim()}</span>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                      s.difficulty === 'Hard'
                        ? isLight ? 'bg-red-100 text-red-600' : 'bg-red-500/15 text-red-400'
                        : isLight ? 'bg-emerald-100 text-emerald-600' : 'bg-emerald-500/15 text-emerald-400'
                    }`}>{s.difficulty}</span>
                  </div>
                  <p className={`text-sm font-medium leading-snug ${isLight ? 'text-navy-800' : 'text-white'}`}>{s.title}</p>
                  <p className={`text-xs mt-1.5 line-clamp-2 ${isLight ? 'text-navy-400' : 'text-white/40'}`}>{s.persona}</p>
                  <div className="flex items-center gap-2 mt-3">
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                      isLight ? emo.light : emo.dark
                    }`}>{emo.label}</span>
                    {active && (
                      <span className="ml-auto w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                        <Check className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        )}

        {selected && mode !== 'replay' && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mt-4 p-5 rounded-3xl border ${
              isLight ? 'bg-emerald-50 border-emerald-200' : 'bg-emerald-500/[0.07] border-emerald-500/20'
            }`}
          >
            <p className={`text-sm font-semibold ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>{selected.title}</p>
            <p className={`text-xs mt-1 leading-relaxed ${isLight ? 'text-navy-600' : 'text-white/60'}`}>
              <span className="font-medium">Persona:</span> {selected.persona}
            </p>
            <p className={`text-xs mt-2 leading-relaxed ${isLight ? 'text-navy-600' : 'text-white/60'}`}>
              <span className="font-medium">Context:</span> {selected.context}
            </p>
            <p className={`text-xs mt-2 leading-relaxed ${isLight ? 'text-navy-600' : 'text-white/60'}`}>
              <span className="font-medium text-emerald-500">Resolution path:</span> {selected.resolution}
            </p>
          </motion.div>
        )}
      </motion.div>

      <motion.div variants={itemAnim}>
        <div className="flex items-center gap-2 mb-3">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isLight ? 'bg-violet-100 text-violet-600' : 'bg-violet-500/20 text-violet-400'}`}>
            <Sparkles className="w-4 h-4" />
          </div>
          <h2 className={`text-sm font-semibold ${isLight ? 'text-navy-800' : 'text-white'}`}>3 · Voice & extras</h2>
        </div>
        <div className={`grid sm:grid-cols-3 gap-4 p-5 rounded-3xl ${
          isLight ? 'bg-white border border-navy-100 shadow-sm' : 'glass-card'
        }`}>
          <div>
            <label className={`text-xs font-medium ${isLight ? 'text-navy-500' : 'text-white/50'}`}>Agent name</label>
            <input
              type="text"
              value={agentName}
              onChange={(e) => setAgentName(e.target.value)}
              className={`glass-input mt-1.5 !py-2.5 ${isLight ? '!bg-white' : ''}`}
            />
          </div>
          <div>
            <label className={`text-xs font-medium ${isLight ? 'text-navy-500' : 'text-white/50'}`}>Humor Mode</label>
            <button
              onClick={() => setHumorMode(!humorMode)}
              className={`mt-1.5 w-full flex items-center justify-between px-4 py-2.5 rounded-2xl text-sm transition-all border ${
                humorMode
                  ? isLight ? 'bg-orange-50 text-orange-600 border-orange-300' : 'bg-orange-500/15 text-orange-400 border-orange-500/30'
                  : isLight ? 'bg-white text-navy-400 border-navy-200' : 'bg-white/[0.05] text-white/40 border-white/[0.10]'
              }`}
            >
              <span>{humorMode ? 'Roasts enabled 🔥' : 'Professional mode'}</span>
              <span className={`text-xs ${isLight ? 'text-navy-300' : 'text-white/30'}`}>{humorMode ? 'ON' : 'OFF'}</span>
            </button>
          </div>
          <div>
            <label className={`text-xs font-medium ${isLight ? 'text-navy-500' : 'text-white/50'}`}>Hinglish Mode</label>
            <button
              onClick={() => setHinglishMode(!hinglishMode)}
              className={`mt-1.5 w-full flex items-center justify-between px-4 py-2.5 rounded-2xl text-sm transition-all border ${
                hinglishMode
                  ? isLight ? 'bg-emerald-50 text-emerald-600 border-emerald-300' : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                  : isLight ? 'bg-white text-navy-400 border-navy-200' : 'bg-white/[0.05] text-white/40 border-white/[0.10]'
              }`}
            >
              <span>{hinglishMode ? 'हिंग्लिश on' : 'English only'}</span>
              <span className={`text-xs ${isLight ? 'text-navy-300' : 'text-white/30'}`}>{hinglishMode ? 'ON' : 'OFF'}</span>
            </button>
          </div>
        </div>
      </motion.div>

      <motion.div variants={itemAnim} className="flex flex-wrap items-center gap-3">
        <button onClick={launchSession} className="btn-primary !px-8 !py-4">
          <Play className="w-4 h-4" /> Launch Session
        </button>
        <Link to="/dashboard" className={`btn-secondary ${isLight ? '!bg-white !border-navy-200 !text-navy-600 hover:!bg-navy-50' : ''}`}>
          Open Live Console <ChevronRight className="w-4 h-4" />
        </Link>
      </motion.div>
    </motion.div>
  )
}
