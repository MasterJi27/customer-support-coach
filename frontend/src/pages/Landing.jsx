import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Headphones, ArrowRight, Menu, X,
  Sparkles, ChevronRight
} from 'lucide-react'
import { landingFeatures, howItWorks } from '../data'
import { icons } from '../lib/icons'
import { useAuth } from '../components/AuthContext'
import { useTheme } from '../components/ThemeContext'

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.7, ease: [0.16, 1, 0.3, 1] } }),
}

export default function Landing() {
  const navigate = useNavigate()
  const { guestLogin } = useAuth()
  const { theme } = useTheme()
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  const handleGuestLogin = () => {
    guestLogin()
    navigate('/dashboard')
  }

  return (
    <div className={`min-h-screen overflow-hidden ${theme === 'light' ? 'bg-[#F5F9FC]' : 'bg-navy-900'}`}>
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-[800px] h-[800px] bg-emerald-500/5 rounded-full blur-[120px] -top-48 -left-48 animate-blob" />
        <div className="absolute w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-[100px] top-1/3 -right-32 animate-blob2" style={{ animationDelay: '3s' }} />
        <div className="absolute w-[500px] h-[500px] bg-violet-500/5 rounded-full blur-[80px] bottom-0 left-1/3 animate-blob" style={{ animationDelay: '6s' }} />
      </div>

      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? theme === 'light'
            ? 'bg-white/80 backdrop-blur-2xl border-b border-navy-100'
            : 'bg-navy-900/80 backdrop-blur-2xl border-b border-white/[0.06]'
          : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-emerald-600 flex items-center justify-center">
                <Headphones className="w-5 h-5 text-white" />
              </div>
              <span className={`text-lg font-bold ${theme === 'light' ? 'text-navy-800' : 'text-white'}`}>CoachAI</span>
            </Link>

            <nav className="hidden md:flex items-center gap-8">
              <a href="#features" className={`text-sm font-medium ${theme === 'light' ? 'text-navy-400 hover:text-navy-700' : 'text-white/50 hover:text-white/90'} transition-colors`}>Features</a>
              <a href="#how-it-works" className={`text-sm font-medium ${theme === 'light' ? 'text-navy-400 hover:text-navy-700' : 'text-white/50 hover:text-white/90'} transition-colors`}>How it Works</a>
            </nav>

            <div className="hidden md:flex items-center gap-3">
              <Link to="/login" className={`btn-ghost text-sm ${theme === 'light' ? '!text-navy-400 hover:!text-navy-700 hover:!bg-navy-50' : ''}`}>Log in</Link>
              <Link to="/register" className="btn-primary text-sm">Get Started</Link>
            </div>

            <button className={`md:hidden p-2 ${theme === 'light' ? 'text-navy-400' : 'text-white/70'}`} onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className={`md:hidden border-t ${theme === 'light' ? 'border-navy-100 bg-white/95' : 'border-white/[0.06] bg-navy-900/95'} backdrop-blur-xl px-4 py-4 space-y-3`}>
            <a href="#features" className={`block text-sm font-medium py-2 ${theme === 'light' ? 'text-navy-500' : 'text-white/60'}`} onClick={() => setMenuOpen(false)}>Features</a>
            <a href="#how-it-works" className={`block text-sm font-medium py-2 ${theme === 'light' ? 'text-navy-500' : 'text-white/60'}`} onClick={() => setMenuOpen(false)}>How it Works</a>
            <div className={`pt-3 border-t ${theme === 'light' ? 'border-navy-100' : 'border-white/[0.06]'} space-y-2`}>
              <Link to="/login" className="block w-full text-center btn-secondary text-sm" onClick={() => setMenuOpen(false)}>Log in</Link>
              <Link to="/register" className="block w-full text-center btn-primary text-sm" onClick={() => setMenuOpen(false)}>Get Started</Link>
            </div>
          </motion.div>
        )}
      </header>

      <section className="relative pt-32 md:pt-44 pb-24 md:pb-40 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto relative">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-20 items-center">
            <motion.div initial="hidden" animate="visible" variants={fadeUp} className="text-center lg:text-left">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-500/10 text-emerald-400 text-sm font-medium rounded-full border border-emerald-500/20 mb-6"
              >
                <Sparkles className="w-4 h-4" /> Real-time coaching while you chat
              </motion.div>
              <h1 className={`text-4xl sm:text-5xl lg:text-7xl font-extrabold leading-[1.05] tracking-tight ${theme === 'light' ? 'text-navy-800' : 'text-white'}`}>
                Your{' '}
                <span className="text-gradient">Support Coaching</span>{' '}
                Copilot
              </h1>
              <p className={`mt-6 text-lg max-w-xl mx-auto lg:mx-0 leading-relaxed ${theme === 'light' ? 'text-navy-400' : 'text-white/50'}`}>
                CoachAI sits next to a support agent during live chats and
                reads every customer message — sentiment, intent, the right KB
                article, the best reply, and escalation risk — before you hit send.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row items-center gap-3 justify-center lg:justify-start">
                <Link to="/register" className="btn-primary px-8 py-4 text-base w-full sm:w-auto">
                  Get Started Free <ArrowRight className="w-4 h-4" />
                </Link>
                <button onClick={handleGuestLogin} className={`btn-secondary px-8 py-4 text-base w-full sm:w-auto ${theme === 'light' ? '!bg-white !border-navy-200 !text-navy-600 hover:!bg-navy-50' : ''}`}>
                  Guest Demo
                </button>
              </div>
              <div className={`mt-10 flex items-center gap-8 justify-center lg:justify-start text-sm`}>
                <div className="text-center">
                  <p className={`text-2xl font-bold ${theme === 'light' ? 'text-navy-700' : 'text-white'}`}>25+</p>
                  <p className={`${theme === 'light' ? 'text-navy-400' : 'text-white/40'} text-xs mt-1`}>AI agents</p>
                </div>
                <div className={`w-px h-8 ${theme === 'light' ? 'bg-navy-200' : 'bg-white/10'}`} />
                <div className="text-center">
                  <p className={`text-2xl font-bold ${theme === 'light' ? 'text-navy-700' : 'text-white'}`}>0.4s</p>
                  <p className={`${theme === 'light' ? 'text-navy-400' : 'text-white/40'} text-xs mt-1`}>Per-turn analysis</p>
                </div>
                <div className={`w-px h-8 ${theme === 'light' ? 'bg-navy-200' : 'bg-white/10'}`} />
                <div className="text-center">
                  <p className={`text-2xl font-bold ${theme === 'light' ? 'text-navy-700' : 'text-white'}`}>3</p>
                  <p className={`${theme === 'light' ? 'text-navy-400' : 'text-white/40'} text-xs mt-1`}>Practice modes</p>
                </div>
                <div className={`w-px h-10 ${theme === 'light' ? 'bg-navy-200' : 'bg-white/[0.08]'}`} />
                <div className="text-center">
                  <p className={`text-2xl font-bold ${theme === 'light' ? 'text-navy-700' : 'text-white'}`}>86%</p>
                  <p className={`${theme === 'light' ? 'text-navy-400' : 'text-white/40'} text-xs mt-1`}>Avg resolution score</p>
                </div>
                <div className={`w-px h-10 ${theme === 'light' ? 'bg-navy-200' : 'bg-white/[0.08]'}`} />
                <div className="text-center">
                  <p className={`text-2xl font-bold ${theme === 'light' ? 'text-navy-700' : 'text-white'}`}>4.3★</p>
                  <p className={`${theme === 'light' ? 'text-navy-400' : 'text-white/40'} text-xs mt-1`}>Predicted CSAT</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="hidden lg:flex justify-center relative"
            >
              <div className="relative w-full max-w-lg">
                <div className="relative glass-card p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-emerald-600 flex items-center justify-center">
                        <Headphones className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">Live Session — Rahul K.</p>
                        <p className="text-xs text-white/40">Zomato · Missing items</p>
                      </div>
                    </div>
                    <span className="badge-emerald">LIVE</span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-end">
                      <div className="max-w-[80%] px-4 py-3 rounded-2xl rounded-tr-md bg-emerald-600 text-white text-sm">
                        I ordered a family meal worth Rs 1200 and the main course is missing!
                      </div>
                    </div>
                    <div className="flex justify-start">
                      <div className="max-w-[80%] px-4 py-3 rounded-2xl rounded-tl-md bg-white/[0.06] border border-white/[0.08] text-white/80 text-sm">
                        I completely understand the frustration Rahul. I can see the missing items are worth Rs 700 — let me refund that to your source instantly.
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: 'Sentiment', value: 'Negative', color: 'text-red-400' },
                      { label: 'Frustration', value: '87%', color: 'text-orange-400' },
                      { label: 'Escalation risk', value: '78%', color: 'text-red-400' },
                      { label: 'Predicted CSAT', value: '1.8 / 5', color: 'text-orange-400' },
                    ].map((s) => (
                      <div key={s.label} className="p-3 rounded-2xl bg-white/[0.04] border border-white/[0.06]">
                        <p className="text-[10px] uppercase tracking-wider text-white/30">{s.label}</p>
                        <p className={`text-sm font-semibold ${s.color}`}>{s.value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="p-3 rounded-2xl bg-violet-500/10 border border-violet-500/20">
                    <p className="text-[10px] uppercase tracking-wider text-violet-400 mb-1">Suggested reply</p>
                    <p className="text-sm text-white/80">
                      Offer an instant refund for the missing Rs 700 + Rs 100 goodwill credit.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section id="features" className={`relative py-20 md:py-28 px-4 sm:px-6 lg:px-8 border-t ${theme === 'light' ? 'border-navy-100' : 'border-white/[0.06]'}`}>
        <div className="max-w-7xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={fadeUp} className="text-center max-w-2xl mx-auto mb-14">
            <h2 className={`text-3xl sm:text-4xl font-extrabold tracking-tight ${theme === 'light' ? 'text-navy-800' : 'text-white'}`}>
              Everything an <span className={theme === 'light' ? 'text-emerald-600' : 'text-emerald-400'}>agent whisperer</span> needs
            </h2>
            <p className={`mt-4 text-base leading-relaxed ${theme === 'light' ? 'text-navy-400' : 'text-white/50'}`}>
              Live coaching signals, practice modes, and post-session reports — designed for contact center teams.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {landingFeatures.map((feature, i) => {
              const Icon = icons[feature.icon] || Sparkles
              const iconColors = {
                emerald: 'bg-emerald-500/20 text-emerald-400',
                cyan: 'bg-cyan-500/20 text-cyan-400',
                violet: 'bg-violet-500/20 text-violet-400',
                orange: 'bg-orange-500/20 text-orange-400',
                pink: 'bg-pink-500/20 text-pink-400',
              }
              return (
                <motion.div
                  key={feature.title}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.2 }}
                  custom={i}
                  variants={fadeUp}
                  className={`group p-6 rounded-3xl transition-all duration-300 hover:-translate-y-1 ${
                    theme === 'light'
                      ? 'bg-white border border-navy-100 shadow-sm hover:shadow-lg'
                      : 'glass-card-hover'
                  }`}
                >
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center mb-4 ${iconColors[feature.color]}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className={`text-base font-semibold ${theme === 'light' ? 'text-navy-800' : 'text-white'}`}>{feature.title}</h3>
                  <p className={`mt-2 text-sm leading-relaxed ${theme === 'light' ? 'text-navy-400' : 'text-white/50'}`}>{feature.description}</p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      <section id="how-it-works" className={`relative py-20 md:py-28 px-4 sm:px-6 lg:px-8 border-t ${theme === 'light' ? 'border-navy-100' : 'border-white/[0.06]'}`}>
        <div className="max-w-7xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={fadeUp} className="text-center max-w-2xl mx-auto mb-14">
            <h2 className={`text-3xl sm:text-4xl font-extrabold tracking-tight ${theme === 'light' ? 'text-navy-800' : 'text-white'}`}>
              How it <span className={theme === 'light' ? 'text-emerald-600' : 'text-emerald-400'}>works</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-4 md:gap-6">
            {howItWorks.map((step, i) => (
              <motion.div
                key={step.step}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
                custom={i}
                variants={fadeUp}
                className="relative"
              >
                <div className={`p-6 rounded-3xl h-full ${
                  theme === 'light'
                    ? 'bg-white border border-navy-100 shadow-sm'
                    : 'glass-card'
                }`}>
                  <span className={`text-4xl font-extrabold ${theme === 'light' ? 'text-emerald-600' : 'text-emerald-400'}`}>{step.step}</span>
                  <h3 className={`mt-3 text-base font-semibold ${theme === 'light' ? 'text-navy-800' : 'text-white'}`}>{step.title}</h3>
                  <p className={`mt-2 text-sm leading-relaxed ${theme === 'light' ? 'text-navy-400' : 'text-white/50'}`}>{step.description}</p>
                </div>
                {i < howItWorks.length - 1 && (
                  <ChevronRight className={`hidden md:block absolute top-1/2 -right-5 -translate-y-1/2 w-5 h-5 z-10 ${theme === 'light' ? 'text-navy-300' : 'text-white/20'}`} />
                )}
              </motion.div>
            ))}
          </div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="mt-14 text-center">
            <Link to="/register" className="btn-primary px-8 py-4 text-base">
              Start coaching for free <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </section>

      <footer className={`border-t ${theme === 'light' ? 'border-navy-100' : 'border-white/[0.06]'} py-8 px-4`}>
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-emerald-600 flex items-center justify-center">
              <Headphones className="w-4 h-4 text-white" />
            </div>
            <span className={`text-sm font-bold ${theme === 'light' ? 'text-navy-700' : 'text-white'}`}>CoachAI</span>
          </div>
          <p className={`text-xs ${theme === 'light' ? 'text-navy-400' : 'text-white/30'}`}>
            Development of AI-Powered Customer Support Assistant with Live Response Guidance
          </p>
        </div>
      </footer>
    </div>
  )
}
