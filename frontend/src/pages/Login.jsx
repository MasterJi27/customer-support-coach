import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Headphones, Mail, Lock, LogIn, Sparkles } from 'lucide-react'
import { useAuth } from '../components/AuthContext'
import { useTheme } from '../components/ThemeContext'

export default function Login() {
  const navigate = useNavigate()
  const { login, guestLogin } = useAuth()
  const { theme } = useTheme()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!email.trim() || !password.trim()) {
      setError('Enter your email and password to continue.')
      return
    }
    setLoading(true)
    try {
      await login(email, password)
      navigate('/dashboard')
    } catch (err) {
      setError(err.message || 'Something went wrong. Try again.')
      setLoading(false)
    }
  }

  const handleGuest = async () => {
    await guestLogin()
    navigate('/dashboard')
  }

  return (
    <div className={`min-h-screen flex items-center justify-center px-4 py-10 relative overflow-hidden ${theme === 'light' ? 'bg-[#F5F9FC]' : 'bg-navy-900'}`}>
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[120px] -top-48 -left-48 animate-blob" />
        <div className="absolute w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-[100px] bottom-0 -right-32 animate-blob2" style={{ animationDelay: '3s' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md relative"
      >
        <Link to="/" className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-10 h-10 rounded-2xl bg-emerald-600 flex items-center justify-center">
            <Headphones className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-gradient">CoachAI</span>
        </Link>

        <div className={`gradient-border rounded-3xl ${
          theme === 'light' ? 'bg-white border border-navy-100 shadow-lg' : 'glass-card'
        }`}>
          <div className="p-6 md:p-8">
            <div className="text-center mb-6">
              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-3 ${
                theme === 'light' ? 'bg-emerald-100 text-emerald-700' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              }`}>
                <Sparkles className="w-3.5 h-3.5" /> Welcome back, agent
              </div>
              <h1 className={`text-2xl font-bold ${theme === 'light' ? 'text-navy-800' : 'text-white'}`}>Log in to CoachAI</h1>
              <p className={`text-sm mt-1 ${theme === 'light' ? 'text-navy-400' : 'text-white/40'}`}>
                Continue your coaching console session
              </p>
            </div>

            {error && (
              <div className={`mb-4 px-4 py-3 rounded-2xl text-sm ${
                theme === 'light' ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-red-500/10 text-red-400 border border-red-500/20'
              }`}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 ${theme === 'light' ? 'text-navy-300' : 'text-white/30'}`} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="glass-input pl-11"
                />
              </div>
              <div className="relative">
                <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 ${theme === 'light' ? 'text-navy-300' : 'text-white/30'}`} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="glass-input pl-11"
                />
              </div>
              <div className="flex items-center justify-between text-sm">
                <label className={`flex items-center gap-2 cursor-pointer ${theme === 'light' ? 'text-navy-400' : 'text-white/40'}`}>
                  <input type="checkbox" className="rounded accent-emerald-500" /> Remember me
                </label>
                <Link to="/" className="text-emerald-500 hover:text-emerald-400 font-medium">Forgot password?</Link>
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full !py-4">
                <LogIn className="w-4 h-4" /> {loading ? 'Logging in…' : 'Log in'}
              </button>
            </form>

            <div className={`flex items-center gap-3 my-5 ${theme === 'light' ? 'text-navy-300' : 'text-white/20'}`}>
              <div className={`flex-1 h-px ${theme === 'light' ? 'bg-navy-100' : 'bg-white/[0.08]'}`} />
              <span className="text-xs">or</span>
              <div className={`flex-1 h-px ${theme === 'light' ? 'bg-navy-100' : 'bg-white/[0.08]'}`} />
            </div>

            <button onClick={handleGuest} className="btn-secondary w-full">
              Continue as Guest Demo
            </button>
          </div>
        </div>

        <p className={`text-center text-sm mt-6 ${theme === 'light' ? 'text-navy-400' : 'text-white/40'}`}>
          New to CoachAI?{' '}
          <Link to="/register" className="text-emerald-500 hover:text-emerald-400 font-medium">Create an account</Link>
        </p>
      </motion.div>
    </div>
  )
}
