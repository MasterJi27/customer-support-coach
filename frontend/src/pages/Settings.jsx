import { useState } from 'react'
import { motion } from 'framer-motion'
import { User, Mail, Bell, Globe, Volume2, Palette, Save, ChevronDown } from 'lucide-react'
import { useTheme } from '../components/ThemeContext'
import { useAuth } from '../components/AuthContext'
import IconChip from '../components/ui/IconChip'

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
}

const itemAnim = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
}

function Toggle({ on, onClick, label, sub }) {
  const { theme } = useTheme()
  const isLight = theme === 'light'
  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <p className={`text-sm font-medium ${isLight ? 'text-navy-700' : 'text-white/80'}`}>{label}</p>
        <p className={`text-xs mt-0.5 ${isLight ? 'text-navy-400' : 'text-white/40'}`}>{sub}</p>
      </div>
      <button
        onClick={onClick}
        className={`relative w-12 h-7 rounded-full transition-colors shrink-0 ${
          on ? 'bg-emerald-500' : isLight ? 'bg-navy-200' : 'bg-white/[0.10]'
        }`}
      >
        <span
          className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-all ${on ? 'left-6' : 'left-1'}`}
        />
      </button>
    </div>
  )
}

export default function Settings() {
  const { theme, toggleTheme } = useTheme()
  const isLight = theme === 'light'
  const { user } = useAuth()
  const [name, setName] = useState(user?.name || '')
  const [email, setEmail] = useState(user?.email || '')
  const [saved, setSaved] = useState(false)
  const [prefs, setPrefs] = useState({
    sound: true,
    autoSuggest: true,
    escalationAlerts: true,
    weeklyDigest: false,
    showNames: true,
  })
  const [lang, setLang] = useState('English')

  const save = (e) => {
    e.preventDefault()
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const setPref = (key) => () => setPrefs(prev => ({ ...prev, [key]: !prev[key] }))

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 max-w-3xl">
      <div>
        <h1 className={`text-2xl font-bold ${isLight ? 'text-navy-800' : 'text-white'}`}>Settings</h1>
        <p className={`text-sm mt-0.5 ${isLight ? 'text-navy-400' : 'text-white/40'}`}>
          Your profile, coaching preferences, and appearance
        </p>
      </div>

      <motion.form variants={itemAnim} onSubmit={save} className="glass-card p-6">
        <div className="flex items-center gap-2 mb-6">
          <IconChip icon={User} color="emerald" size="sm" />
          <h2 className={`text-sm font-semibold ${isLight ? 'text-navy-800' : 'text-white'}`}>Profile</h2>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className={`text-xs font-medium ${isLight ? 'text-navy-500' : 'text-white/50'}`}>Full name</label>
            <div className="relative mt-1.5">
              <User className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 ${isLight ? 'text-navy-300' : 'text-white/30'}`} />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`glass-input pl-11 ${isLight ? '!bg-white' : ''}`}
              />
            </div>
          </div>
          <div>
            <label className={`text-xs font-medium ${isLight ? 'text-navy-500' : 'text-white/50'}`}>Email</label>
            <div className="relative mt-1.5">
              <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 ${isLight ? 'text-navy-300' : 'text-white/30'}`} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`glass-input pl-11 ${isLight ? '!bg-white' : ''}`}
              />
            </div>
          </div>
        </div>
        <div className="mt-6 flex items-center justify-between">
          <p className={`text-xs ${isLight ? 'text-navy-400' : 'text-white/40'}`}>
            Role: <span className={`font-semibold ${isLight ? 'text-navy-700' : 'text-white/70'}`}>{user?.role || 'Agent'}</span>
          </p>
          <button type="submit" className="btn-primary !px-5 !py-2.5 text-xs">
            <Save className="w-3.5 h-3.5" /> {saved ? 'Saved ✓' : 'Save Changes'}
          </button>
        </div>
      </motion.form>

      <motion.div variants={itemAnim} className="glass-card p-6">
        <div className="flex items-center gap-2 mb-2">
          <IconChip icon={Bell} color="cyan" size="sm" />
          <h2 className={`text-sm font-semibold ${isLight ? 'text-navy-800' : 'text-white'}`}>Coaching & Notifications</h2>
        </div>
        <div className={`mt-4 divide-y ${isLight ? 'divide-navy-100' : 'divide-white/[0.06]'}`}>
          <Toggle on={prefs.sound} onClick={setPref('sound')} label="Sound cues" sub="Play a soft chime when a coaching signal arrives" />
          <Toggle on={prefs.autoSuggest} onClick={setPref('autoSuggest')} label="Auto-suggest replies" sub="Show the suggested reply panel on every customer turn" />
          <Toggle on={prefs.escalationAlerts} onClick={setPref('escalationAlerts')} label="Escalation alerts" sub="Ping the supervisor when risk crosses 80%" />
          <Toggle on={prefs.weeklyDigest} onClick={setPref('weeklyDigest')} label="Weekly digest email" sub="Summary of your scores and improvement areas every Monday" />
        </div>
      </motion.div>

      <motion.div variants={itemAnim} className="glass-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <IconChip icon={Palette} color="violet" size="sm" />
          <h2 className={`text-sm font-semibold ${isLight ? 'text-navy-800' : 'text-white'}`}>Appearance & Language</h2>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${isLight ? 'text-navy-700' : 'text-white/80'}`}>Theme</p>
              <p className={`text-xs mt-0.5 ${isLight ? 'text-navy-400' : 'text-white/40'}`}>Glass dark or clean light</p>
            </div>
            <button onClick={toggleTheme} className={`btn-secondary !px-4 !py-2 text-xs ${isLight ? '!bg-white !border-navy-200 !text-navy-600 hover:!bg-navy-50' : ''}`}>
              {theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}
            </button>
          </div>
          <div className={`flex items-center justify-between pt-4 border-t ${isLight ? 'border-navy-100' : 'border-white/[0.06]'}`}>
            <div>
              <p className={`text-sm font-medium ${isLight ? 'text-navy-700' : 'text-white/80'}`}>Coaching language</p>
              <p className={`text-xs mt-0.5 ${isLight ? 'text-navy-400' : 'text-white/40'}`}>Language for suggestions and reports</p>
            </div>
            <div className="relative">
              <Globe className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${isLight ? 'text-navy-400' : 'text-white/40'}`} />
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value)}
                className={`glass-select pl-9 !py-2 pr-8 text-xs ${isLight ? '!bg-white' : ''}`}
              >
                {['English', 'Hinglish', 'Hindi', 'Spanish'].map(l => <option key={l}>{l}</option>)}
              </select>
              <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none ${isLight ? 'text-navy-400' : 'text-white/40'}`} />
            </div>
          </div>
          <div className={`flex items-center justify-between pt-4 border-t ${isLight ? 'border-navy-100' : 'border-white/[0.06]'}`}>
            <div>
              <p className={`text-sm font-medium ${isLight ? 'text-navy-700' : 'text-white/80'}`}>Voice reads coaching aloud</p>
              <p className={`text-xs mt-0.5 ${isLight ? 'text-navy-400' : 'text-white/40'}`}>Speak suggested replies via TTS</p>
            </div>
            <div className="relative">
              <Volume2 className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${isLight ? 'text-navy-400' : 'text-white/40'}`} />
              <select className={`glass-select pl-9 !py-2 pr-8 text-xs ${isLight ? '!bg-white' : ''}`} defaultValue="Off">
                <option>Off</option>
                <option>On</option>
              </select>
              <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none ${isLight ? 'text-navy-400' : 'text-white/40'}`} />
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
