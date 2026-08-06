import { useState, useEffect, useRef } from 'react'
import { Bell, Search, User, ChevronDown, LogOut, Settings as SettingsIcon, Sun, Moon, Menu, TrendingUp, ShieldAlert, Trophy, Palette } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from './AuthContext'
import { useTheme } from './ThemeContext'
import { useNavigate } from 'react-router-dom'
import { scenarios, kbDocuments, leaderboard } from '../data'

const ACCENTS = [
  { name: 'emerald', label: 'Indigo', color: '#6366f1' },
  { name: 'cyan', label: 'Sky', color: '#0ea5e9' },
  { name: 'violet', label: 'Violet', color: '#8b5cf6' },
  { name: 'rose', label: 'Rose', color: '#f43f5e' },
  { name: 'amber', label: 'Amber', color: '#f59e0b' },
]

export default function Navbar({ onMenuClick }) {
  const [query, setQuery] = useState('')
  const [showNotifications, setShowNotifications] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [showAccents, setShowAccents] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const { user, logout } = useAuth()
  const { theme, toggleTheme, accent, changeAccent } = useTheme()
  const navigate = useNavigate()
  const searchInputRef = useRef(null)
  const searchResultsRef = useRef(null)

  const notifications = [
    { text: 'Escalation risk 91% on live session', time: '2 min ago', type: 'escalation' },
    { text: 'New KB article awaiting approval', time: '25 min ago', type: 'kb' },
    { text: 'You reached #2 on the floor leaderboard', time: '1 hr ago', type: 'leaderboard' },
  ]
  const notifBadge = 3

  const searchResults = (() => {
    if (!query.trim()) return []
    const q = query.toLowerCase()
    const scenarioHits = scenarios
      .filter(s => s.title.toLowerCase().includes(q) || s.product.toLowerCase().includes(q))
      .map(s => ({ label: s.title, sub: s.product, type: 'Scenario', route: '/setup' }))
    const kbHits = kbDocuments
      .filter(d => d.title.toLowerCase().includes(q) || d.keywords.some(k => k.toLowerCase().includes(q)))
      .map(d => ({ label: d.title, sub: d.category, type: 'Knowledge', route: '/knowledge' }))
    const agentHits = leaderboard
      .filter(a => a.name.toLowerCase().includes(q))
      .map(a => ({ label: a.name, sub: `${a.team} · ${a.avgScore} avg`, type: 'Agent', route: '/analytics' }))
    return [...scenarioHits, ...kbHits, ...agentHits].slice(0, 6)
  })()

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setShowSearch(true)
        setTimeout(() => searchInputRef.current?.focus(), 50)
      }
      if (e.key === 'Escape') {
        setShowSearch(false)
        setShowNotifications(false)
        setShowProfile(false)
        setShowAccents(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  const handleSearchNavigate = (item) => {
    setShowSearch(false)
    setQuery('')
    navigate(item.route)
  }

  const handleSearchKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => Math.min(prev + 1, searchResults.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => Math.max(prev - 1, 0))
    } else if (e.key === 'Enter' && searchResults[selectedIndex]) {
      handleSearchNavigate(searchResults[selectedIndex])
    }
  }

  useEffect(() => {
    if (searchResultsRef.current) {
      const selected = searchResultsRef.current.querySelector('[data-selected="true"]')
      selected?.scrollIntoView({ block: 'nearest' })
    }
  }, [selectedIndex])

  const notifIcons = {
    escalation: 'bg-red-500/20 text-red-400',
    kb: 'bg-cyan-500/20 text-cyan-400',
    leaderboard: 'bg-violet-500/20 text-violet-400',
  }
  const notifGlyphs = { escalation: ShieldAlert, kb: Search, leaderboard: Trophy }

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  return (
    <header className={`h-16 ${
      theme === 'light'
        ? 'bg-white border-b border-navy-200'
        : 'bg-navy-900 border-b border-white/[0.06]'
    } flex items-center justify-between px-4 md:px-6 sticky top-0 z-30`}>
      <div className="flex items-center gap-3 w-full max-w-md">
        {onMenuClick && (
          <button
            type="button"
            aria-label="Open menu"
            onClick={onMenuClick}
            className={`md:hidden p-2 rounded-xl shrink-0 ${
              theme === 'light' ? 'text-navy-600 hover:bg-navy-50' : 'text-white/70 hover:bg-white/[0.06]'
            }`}
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <div className="relative w-full group">
          <Search className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${
            theme === 'light' ? 'text-navy-300 group-focus-within:text-emerald-500' : 'text-white/30 group-focus-within:text-emerald-400'
          } transition-colors`} />
          <input
            type="text"
            placeholder="Search scenarios, articles, agents..."
            value={query}
            onFocus={() => setShowSearch(true)}
            onChange={(e) => {
              setQuery(e.target.value)
              setShowSearch(true)
            }}
            onKeyDown={handleSearchKeyDown}
            ref={searchInputRef}
            className={`w-full pl-10 pr-4 py-2.5 rounded-2xl text-sm transition-all duration-200 ${
              theme === 'light'
                ? 'bg-navy-50 border border-navy-200 text-navy-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 placeholder:text-navy-300'
                : 'bg-white/[0.04] border border-white/[0.08] text-white/70 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/40 focus:bg-white/[0.06] placeholder:text-white/30'
            }`}
          />
          <div className={`absolute right-3 top-1/2 -translate-y-1/2 hidden md:flex items-center gap-1 text-[10px] ${
            theme === 'light' ? 'text-navy-300' : 'text-white/20'
          }`}>
            <kbd className={`px-1.5 py-0.5 rounded-md font-mono ${
              theme === 'light' ? 'bg-navy-100 border border-navy-200' : 'bg-white/[0.06] border border-white/[0.08]'
            }`}>Ctrl</kbd>
            <kbd className={`px-1.5 py-0.5 rounded-md font-mono ${
              theme === 'light' ? 'bg-navy-100 border border-navy-200' : 'bg-white/[0.06] border border-white/[0.08]'
            }`}>K</kbd>
          </div>

          <AnimatePresence>
            {showSearch && query.trim() && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                className={`absolute top-full mt-2 left-0 right-0 rounded-2xl overflow-hidden z-50 ${
                  theme === 'light' ? 'bg-white border border-navy-100 shadow-lg' : 'glass-card'
                }`}
                ref={searchResultsRef}
              >
                <div className="p-2">
                  {searchResults.length === 0 ? (
                    <div className={`p-4 text-center text-sm ${theme === 'light' ? 'text-navy-400' : 'text-white/40'}`}>
                      No results found for "{query}"
                    </div>
                  ) : (
                    searchResults.map((item, i) => {
                      const typeColors = {
                        Scenario: theme === 'light' ? 'bg-emerald-100 text-emerald-600' : 'bg-emerald-500/20 text-emerald-400',
                        Knowledge: theme === 'light' ? 'bg-cyan-100 text-cyan-600' : 'bg-cyan-500/20 text-cyan-400',
                        Agent: theme === 'light' ? 'bg-violet-100 text-violet-600' : 'bg-violet-500/20 text-violet-400',
                      }
                      return (
                        <button
                          key={`${item.label}-${i}`}
                          data-selected={i === selectedIndex}
                          onClick={() => handleSearchNavigate(item)}
                          onMouseEnter={() => setSelectedIndex(i)}
                          className={`flex items-center gap-3 w-full p-3 rounded-xl text-left transition-colors ${
                            i === selectedIndex
                              ? theme === 'light' ? 'bg-navy-50' : 'bg-white/[0.08]'
                              : 'hover:bg-white/[0.04]'
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${typeColors[item.type] || (theme === 'light' ? 'bg-navy-100 text-navy-500' : 'bg-white/[0.06] text-white/50')}`}>
                            <Search className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium ${theme === 'light' ? 'text-navy-700' : 'text-white/80'}`}>{item.label}</p>
                            <p className={`text-xs ${theme === 'light' ? 'text-navy-400' : 'text-white/30'}`}>{item.sub}</p>
                          </div>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                            theme === 'light' ? 'bg-navy-100 text-navy-400' : 'bg-white/[0.06] text-white/30'
                          }`}>{item.type}</span>
                        </button>
                      )
                    })
                  )}
                </div>
                <div className={`px-3 py-2 border-t flex items-center justify-between text-[10px] ${
                  theme === 'light' ? 'border-navy-100 text-navy-400' : 'border-white/[0.06] text-white/30'
                }`}>
                  <span>{searchResults.length} results</span>
                  <span>↑↓ navigate · enter select · esc close</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => { setShowAccents(!showAccents); setShowNotifications(false); setShowProfile(false) }}
            className={`p-2.5 rounded-2xl transition-all ${theme === 'light' ? 'text-navy-400 hover:text-navy-700 hover:bg-navy-100' : 'text-white/40 hover:text-white hover:bg-white/[0.06]'}`}
          >
            <Palette className="w-5 h-5" />
          </motion.button>
          <AnimatePresence>
            {showAccents && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                className={`absolute right-0 mt-2 rounded-3xl p-4 w-56 ${theme === 'light' ? 'bg-white border border-navy-100 shadow-lg' : 'glass-card'}`}
              >
                <p className={`text-sm font-semibold mb-3 ${theme === 'light' ? 'text-navy-700' : 'text-white/90'}`}>Accent color</p>
                <div className="grid grid-cols-5 gap-3">
                  {ACCENTS.map(a => (
                    <button
                      key={a.name}
                      type="button"
                      title={a.label}
                      aria-label={a.label}
                      onClick={() => changeAccent(a.name)}
                      className={`w-9 h-9 rounded-full transition-all ${accent === a.name ? 'scale-110 ring-2 ring-offset-2 ring-offset-transparent' : 'hover:scale-105'}`}
                      style={{ backgroundColor: a.color, boxShadow: accent === a.name ? `0 0 16px ${a.color}80` : 'none' }}
                    />
                  ))}
                </div>
                <p className={`text-xs mt-3 ${theme === 'light' ? 'text-navy-400' : 'text-white/30'}`}>{ACCENTS.find(a => a.name === accent)?.label || 'Emerald'}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleTheme}
          className={`p-2.5 rounded-2xl transition-all ${
            theme === 'light' ? 'text-navy-400 hover:text-navy-700 hover:bg-navy-100' : 'text-white/40 hover:text-white hover:bg-white/[0.06]'
          }`}
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </motion.button>

        <div className="relative">
          <button
            onClick={() => { setShowNotifications(!showNotifications); setShowProfile(false) }}
            className={`p-2.5 rounded-2xl transition-all ${
              theme === 'light' ? 'text-navy-400 hover:text-navy-700 hover:bg-navy-100' : 'text-white/40 hover:text-white hover:bg-white/[0.06]'
            } relative`}
          >
            <Bell className="w-5 h-5" />
            {notifBadge > 0 && (
              <span className={`absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold rounded-full ${
                theme === 'light' ? 'bg-emerald-500 text-white ring-2 ring-white' : 'bg-emerald-400 text-navy-900 ring-2 ring-navy-900'
              }`}>
                {notifBadge > 9 ? '9+' : notifBadge}
              </span>
            )}
          </button>
          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                className={`absolute right-0 mt-2 w-80 rounded-3xl overflow-hidden ${
                  theme === 'light' ? 'bg-white border border-navy-200 shadow-lg' : 'glass-card'
                }`}
              >
                <div className={`flex items-center justify-between px-4 py-3.5 border-b ${theme === 'light' ? 'border-navy-100' : 'border-white/[0.06]'}`}>
                  <p className={`text-sm font-semibold ${theme === 'light' ? 'text-navy-800' : 'text-white/90'}`}>Notifications</p>
                  {notifications.length > 0 && (
                    <span className={`text-[11px] font-medium ${theme === 'light' ? 'text-emerald-600' : 'text-emerald-400'}`}>
                      {notifications.length} new
                    </span>
                  )}
                </div>
                {notifications.length === 0 ? (
                  <div className={`px-4 py-8 text-center text-sm ${theme === 'light' ? 'text-navy-400' : 'text-white/30'}`}>
                    You're all caught up.
                  </div>
                ) : (
                  <div className="p-2 max-h-80 overflow-y-auto scrollbar-hide">
                    {notifications.map((n, i) => {
                      const Glyph = notifGlyphs[n.type] || Bell
                      return (
                        <div key={i} className={`flex items-start gap-3 px-3 py-2.5 rounded-2xl cursor-pointer transition-colors ${
                          theme === 'light' ? 'hover:bg-navy-50' : 'hover:bg-white/[0.04]'
                        }`}>
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${notifIcons[n.type]}`}>
                            <Glyph className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0 pt-0.5">
                            <p className={`text-sm leading-snug ${theme === 'light' ? 'text-navy-700' : 'text-white/80'}`}>{n.text}</p>
                            <p className={`text-xs ${theme === 'light' ? 'text-navy-400' : 'text-white/30'} mt-1`}>{n.time}</p>
                          </div>
                          <span className={`w-2 h-2 rounded-full shrink-0 mt-2 ${theme === 'light' ? 'bg-emerald-500' : 'bg-emerald-400'}`} />
                        </div>
                      )
                    })}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="relative">
          <button
            onClick={() => { setShowProfile(!showProfile); setShowNotifications(false) }}
            className={`flex items-center gap-2 border-l ${theme === 'light' ? 'border-navy-100' : 'border-white/[0.06]'} pl-3 py-1 rounded-2xl pr-2 transition-colors ${
              theme === 'light' ? 'hover:bg-navy-50' : 'hover:bg-white/[0.04]'
            }`}
          >
            <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <div className="text-left hidden sm:block">
              <p className={`text-sm font-medium leading-tight ${theme === 'light' ? 'text-navy-700' : 'text-white/90'}`}>{user?.name || 'User'}</p>
              <p className={`text-[10px] ${theme === 'light' ? 'text-navy-400' : 'text-white/30'}`}>{user?.role || 'Agent'}</p>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 ${theme === 'light' ? 'text-navy-300' : 'text-white/30'} hidden sm:block`} />
          </button>
          <AnimatePresence>
            {showProfile && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                className={`absolute right-0 mt-2 w-56 rounded-3xl overflow-hidden ${
                  theme === 'light' ? 'bg-white border border-navy-100 shadow-lg' : 'glass-card'
                }`}
              >
                <div className={`p-4 border-b ${theme === 'light' ? 'border-navy-100' : 'border-white/[0.06]'}`}>
                  <p className={`text-sm font-semibold ${theme === 'light' ? 'text-navy-700' : 'text-white/90'}`}>{user?.name}</p>
                  <p className={`text-xs ${theme === 'light' ? 'text-navy-400' : 'text-white/40'}`}>{user?.email}</p>
                </div>
                <div className="p-2">
                  <button onClick={() => { navigate('/settings'); setShowProfile(false) }} className={`flex items-center gap-3 w-full p-3 rounded-2xl text-sm transition-colors ${
                    theme === 'light' ? 'text-navy-400 hover:text-navy-700 hover:bg-navy-50' : 'text-white/60 hover:text-white/90 hover:bg-white/[0.04]'
                  }`}>
                    <SettingsIcon className="w-4 h-4" /> Settings
                  </button>
                  <div className={`border-t ${theme === 'light' ? 'border-navy-100' : 'border-white/[0.06]'} mt-1 pt-1`}>
                    <button onClick={() => { handleLogout() }} className="flex items-center gap-3 w-full p-3 rounded-2xl hover:bg-red-500/10 transition-colors text-sm text-red-400">
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  )
}
