import { useEffect, useRef, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './components/AuthContext'
import { useTheme } from './components/ThemeContext'
import Sidebar from './components/Sidebar'
import Navbar from './components/Navbar'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Setup from './pages/Setup'
import Analytics from './pages/Analytics'
import Reports from './pages/Reports'
import Knowledge from './pages/Knowledge'
import HallOfFame from './pages/HallOfFame'
import Leaderboard from './pages/Leaderboard'
import JiraBoard from './pages/JiraBoard'
import SettingsPage from './pages/Settings'

function BackgroundBlobs() {
  const { theme } = useTheme()
  if (theme === 'light') return null
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
      <div className="blob w-[600px] h-[600px] bg-emerald-500/10 -top-48 -left-48" />
      <div className="blob w-[500px] h-[500px] bg-cyan-500/10 top-1/3 -right-32" style={{ animationDelay: '2s' }} />
      <div className="blob w-[400px] h-[400px] bg-violet-500/10 bottom-0 left-1/3" style={{ animationDelay: '4s' }} />
    </div>
  )
}

function BootSplash() {
  const { theme } = useTheme()
  return (
    <div className={`min-h-screen flex items-center justify-center ${theme === 'light' ? 'bg-[#F5F9FC]' : 'bg-navy-900'}`}>
      <div className={`text-sm ${theme === 'light' ? 'text-navy-400' : 'text-white/40'}`}>Loading CoachAI…</div>
    </div>
  )
}

function AppLayout() {
  const { isAuthenticated, bootstrapping } = useAuth()
  const { theme } = useTheme()
  const setupRan = useRef(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    if (setupRan.current) return
    setupRan.current = true
  }, [])

  if (bootstrapping) return <BootSplash />
  if (!isAuthenticated) return <Navigate to="/login" replace />

  return (
    <div className={`flex min-h-screen ${theme === 'light' ? 'bg-[#F5F9FC]' : 'bg-navy-900'} relative`}>
      <BackgroundBlobs />
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0 md:ml-20 lg:ml-64 transition-all duration-300">
        <Navbar onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto pb-24 md:pb-8">
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/setup" element={<Setup />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/knowledge" element={<Knowledge />} />
            <Route path="/hall-of-fame" element={<HallOfFame />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/jira" element={<JiraBoard />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

function PublicRoute({ children }) {
  const { isAuthenticated, bootstrapping } = useAuth()
  if (bootstrapping) return <BootSplash />
  if (isAuthenticated) return <Navigate to="/dashboard" replace />
  return children
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
        <Route path="/*" element={<AppLayout />} />
      </Routes>
    </AuthProvider>
  )
}
