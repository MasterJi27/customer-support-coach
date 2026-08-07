import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Mail, Send, Loader2, CheckCircle2, Trash2 } from 'lucide-react'
import { useTheme } from '../components/ThemeContext'
import { useToast } from '../components/ToastContext'
import { EmptyState } from '../components/Skeleton'
import SectionCard from '../components/ui/SectionCard'
import api from '../lib/api'

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
}

const itemAnim = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
}

const STORAGE_KEY = 'coachai_sent_emails'

function loadSent() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export default function Email() {
  const { theme } = useTheme()
  const isLight = theme === 'light'
  const toast = useToast()
  const [recipient, setRecipient] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(loadSent)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sent))
  }, [sent])

  const send = async (e) => {
    e.preventDefault()
    if (!recipient.trim() || !subject.trim() || !body.trim() || sending) return
    setSending(true)
    const entry = {
      id: `MAIL-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
      recipient: recipient.trim(),
      subject: subject.trim(),
      body: body.trim(),
      sent_at: new Date().toISOString(),
    }
    try {
      const res = await api.sendEmail(entry.recipient, entry.subject, entry.body)
      entry.success = !!res.sent
      entry.detail = res.detail || ''
      setSent(prev => [entry, ...prev])
      if (entry.success) {
        toast.success(`Email sent to ${entry.recipient}`)
        setSubject('')
        setBody('')
      } else {
        toast.error(`Send failed: ${entry.detail || 'unknown error'}`)
      }
    } catch (err) {
      entry.success = false
      entry.detail = err.message
      setSent(prev => [entry, ...prev])
      toast.error(`Failed to send: ${err.message}`)
    } finally {
      setSending(false)
    }
  }

  const deleteEntry = (id) => setSent(prev => prev.filter(m => m.id !== id))

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <div>
        <h1 className={`text-2xl font-bold ${isLight ? 'text-navy-800' : 'text-white'}`}>Email</h1>
        <p className={`text-sm mt-0.5 ${isLight ? 'text-navy-400' : 'text-white/40'}`}>
          Send a real email through the connected Gmail account — follow-ups, summaries, anything
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 items-start">
        <motion.div variants={itemAnim}>
          <SectionCard icon={Mail} color="rose" title="Compose">
            <form onSubmit={send} className="space-y-4">
              <div>
                <label className={`text-xs font-medium ${isLight ? 'text-navy-500' : 'text-white/50'}`}>To</label>
                <input
                  type="email"
                  required
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder="customer@example.com"
                  className={`glass-input mt-1.5 !py-2.5 ${isLight ? '!bg-white' : ''}`}
                />
              </div>
              <div>
                <label className={`text-xs font-medium ${isLight ? 'text-navy-500' : 'text-white/50'}`}>Subject</label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Following up on your order"
                  className={`glass-input mt-1.5 !py-2.5 ${isLight ? '!bg-white' : ''}`}
                />
              </div>
              <div>
                <label className={`text-xs font-medium ${isLight ? 'text-navy-500' : 'text-white/50'}`}>Message</label>
                <textarea
                  required
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={7}
                  placeholder="Hi, just wanted to follow up on..."
                  className={`glass-input mt-1.5 resize-none ${isLight ? '!bg-white' : ''}`}
                />
              </div>
              <button type="submit" disabled={sending} className={`btn-primary w-full !py-3 ${sending ? 'opacity-60 pointer-events-none' : ''}`}>
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {sending ? 'Sending…' : 'Send Email'}
              </button>
            </form>
          </SectionCard>
        </motion.div>

        <motion.div variants={itemAnim}>
          <SectionCard icon={CheckCircle2} color="emerald" title="Sent history">
            {sent.length === 0 ? (
              <EmptyState
                icon={Mail}
                title="Nothing sent yet"
                description="Emails you send from here show up as a history below."
              />
            ) : (
              <div className="space-y-2.5 max-h-[420px] overflow-y-auto scrollbar-hide pr-1">
                {sent.map((m) => (
                  <div key={m.id} className={`p-3.5 rounded-2xl border ${isLight ? 'bg-navy-50 border-navy-100' : 'bg-white/[0.04] border-white/[0.06]'}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className={`text-sm font-medium truncate ${isLight ? 'text-navy-800' : 'text-white/90'}`}>{m.subject}</p>
                        <p className={`text-xs mt-0.5 truncate ${isLight ? 'text-navy-400' : 'text-white/40'}`}>To {m.recipient}</p>
                      </div>
                      <button onClick={() => deleteEntry(m.id)} aria-label="Remove" className={`p-1.5 rounded-lg shrink-0 transition-colors ${isLight ? 'hover:bg-red-50 text-navy-300 hover:text-red-500' : 'hover:bg-red-500/10 text-white/30 hover:text-red-400'}`}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="flex items-center gap-1.5 mt-2">
                      <span className={m.success ? 'badge-emerald' : 'badge-orange'}>{m.success ? 'Sent' : 'Failed'}</span>
                      <span className={`text-[10px] ${isLight ? 'text-navy-300' : 'text-white/30'}`}>
                        {new Date(m.sent_at).toLocaleString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </motion.div>
      </div>
    </motion.div>
  )
}
