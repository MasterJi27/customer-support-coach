import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import * as agents from './agents.js'
import { ingestAll, resetCache } from './rag.js'
import { ensureSchema, isDbReady, query } from './db.js'
import { dataPath } from './paths.js'
import { hashPassword, verifyPassword, generateToken, createAuthSession, authUser } from './auth.js'
import { SURVIVAL_TICKETS, seedSession } from './scenarios.js'
import {
  getSession, registerSession, listLiveSessions, persistSession,
  pushAgentMessage, pushAgentTurn, pushCustomerMessage,
} from './sessionStore.js'
import { buildReport, saveReport, getReports, getHallOfFame, loadHallOfFame } from './reports.js'
import { sendEmailViaComposio } from './integrations.js'
import { coachTurn, advanceCustomer } from './coaching.js'

const KB_DIR = process.env.KB_DIR || dataPath('knowledge_base')

const app = express()
app.use(cors())
app.use(express.json({ limit: '2mb' }))

let survivalState = { active: false, index: 0, score: 0, replies: [], startedAt: 0 }

function logActivity(userId, sessionId, action, details = {}) {
  if (!isDbReady()) return
  query(
    `INSERT INTO coach_activity_log (user_id, session_id, action, details) VALUES ($1, $2, $3, $4)`,
    [userId || null, sessionId || null, action, JSON.stringify(details)]
  ).catch(() => {})
}

// Reusable: nearly every /api/chat/* route starts with "load the session,
// or reply 404 if it doesn't exist." One helper replaces four copies of
// that same guard clause.
async function loadSessionOr404(sessionId, res) {
  const session = await getSession(sessionId)
  if (!session) {
    res.status(404).json({ error: 'Session not found' })
    return null
  }
  return session
}

// Reusable: several /api/analysis/* routes are "log the call, run one pure
// function from agents.js on the request body, return its JSON" with
// nothing else different between them. This factory replaces what would be
// seven near-identical route bodies with seven one-line route registrations.
function analysisRoute(actionName, handler) {
  return async (req, res) => {
    logActivity(null, req.body?.session_id, actionName, {})
    res.json(await handler(req.body || {}))
  }
}

app.get('/health', async (req, res) => {
  await ensureSchema()
  res.json({
    status: 'online',
    engine: 'Azure AI Foundry + OpenRouter + Groq',
    rag: 'BM25 + OpenRouter embeddings',
    db: isDbReady(),
    vector_store: 'embedding cache',
  })
})

app.get('/api/analytics', async (req, res) => {
  let live = listLiveSessions().map(s => ({
    id: s.id,
    agent_name: s.agent_name,
    mode: s.mode,
    product_context: s.product_context,
    created_at: s.created_at,
    is_active: s.is_active,
  }))
  if (isDbReady()) {
    const row = await query(
      `SELECT id, config, messages, created_at, is_active FROM coach_sessions ORDER BY created_at DESC LIMIT 50`
    )
    if (row?.rows?.length) {
      const dbLive = row.rows
        .filter(r => r.is_active)
        .map(r => ({
          id: r.id,
          agent_name: r.config?.agent_name || 'Support Agent',
          mode: r.config?.mode || 'simulator',
          product_context: r.config?.product_context || 'Zomato Food Delivery',
          created_at: r.created_at,
          is_active: true,
        }))
      live = dbLive
    }
  }
  const reports = getReports()
  const completed = reports.filter(r => r.session_id && !live.some(s => s.id === r.session_id))
  const avg = reports.length ? Math.round(reports.reduce((sum, r) => sum + r.overall_score, 0) / reports.length * 100) : 86
  res.json({
    sessions: live,
    sessions_today: live.length,
    avg_score_pct: avg,
    leaders: [
      { rank: 1, name: 'Support Agent', team: 'Live', sessions: live.length, avgScore: avg, trend: 'up' },
      { rank: 2, name: 'Manager', team: 'Escalations', sessions: completed.length, avgScore: Math.min(avg + 5, 100), trend: 'up' },
      { rank: 3, name: 'Autopilot', team: 'Bots', sessions: Math.max(0, completed.length - 2), avgScore: Math.max(avg - 4, 0), trend: 'down' },
    ],
  })
})

app.get('/api/reports', async (req, res) => {
  let out = getReports()
  if (isDbReady()) {
    const rows = await query('SELECT report FROM coach_reports ORDER BY created_at DESC')
    if (rows?.rows?.length) {
      out = rows.rows.map(r => r.report)
    }
  }
  res.json(out)
})

app.get('/api/knowledge', (req, res) => {
  const documents = []
  if (fs.existsSync(KB_DIR)) {
    for (const f of fs.readdirSync(KB_DIR)) {
      if (!f.endsWith('.json')) continue
      try {
        const doc = JSON.parse(fs.readFileSync(path.join(KB_DIR, f), 'utf8'))
        documents.push({
          _file: f,
          title: doc.title || f.replace('.json', '').replace(/_/g, ' '),
          category: doc.category || 'Support',
          status: doc.status || 'Active',
          content: doc.content || doc.answer || JSON.stringify(doc).slice(0, 300),
          keywords: doc.keywords || [],
          updated_at: doc.updated_at || null,
        })
      } catch { /* skip */ }
    }
  }
  res.json({ documents })
})

app.get('/api/hall-of-fame', async (req, res) => {
  const dbEntries = await loadHallOfFame()
  res.json({ entries: (dbEntries || getHallOfFame()).slice(0, 40) })
})

app.get('/api/activity', async (req, res) => {
  if (!isDbReady()) return res.json({ events: [] })
  const row = await query(
    `SELECT id, user_id, session_id, action, details, created_at
     FROM coach_activity_log ORDER BY id DESC LIMIT 100`
  )
  res.json({ events: row?.rows || [] })
})

// ---- Auth ----

app.post('/api/auth/register', async (req, res) => {
  const { name, email, password } = req.body || {}
  if (!name?.trim() || !email?.trim() || !password || password.length < 6) {
    return res.status(400).json({ error: 'Name, valid email and password (min 6 chars) are required.' })
  }
  if (!(await ensureSchema())) return res.status(503).json({ error: 'Database unavailable.' })
  const exists = await query('SELECT id FROM coach_users WHERE email = $1', [email.trim().toLowerCase()])
  if (exists?.rows?.length) return res.status(409).json({ error: 'An account with this email already exists.' })
  const id = `usr_${crypto.randomBytes(6).toString('hex')}`
  const token = generateToken()
  const created = await query(
    'INSERT INTO coach_users (id, name, email, password_hash, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, role',
    [id, name.trim(), email.trim().toLowerCase(), hashPassword(password), 'Agent']
  )
  if (!created?.rows?.[0]) return res.status(500).json({ error: 'Could not create account.' })
  await createAuthSession(id, token, req)
  logActivity(id, null, 'register', { email: email.trim().toLowerCase() })
  res.json({ user: created.rows[0], token })
})

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body || {}
  if (!email?.trim() || !password) return res.status(400).json({ error: 'Email and password are required.' })
  if (!(await ensureSchema())) return res.status(503).json({ error: 'Database unavailable.' })
  const row = await query('SELECT id, name, email, role, password_hash FROM coach_users WHERE email = $1', [email.trim().toLowerCase()])
  const user = row?.rows?.[0]
  if (!user || !verifyPassword(password, user.password_hash)) {
    logActivity(null, null, 'login_failed', { email: email.trim().toLowerCase() })
    return res.status(401).json({ error: 'Invalid email or password.' })
  }
  const token = generateToken()
  await createAuthSession(user.id, token, req)
  logActivity(user.id, null, 'login', { email: user.email })
  res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role }, token })
})

app.post('/api/auth/guest', async (req, res) => {
  if (!(await ensureSchema())) return res.status(503).json({ error: 'Database unavailable.' })
  let row = await query('SELECT id, name, email, role FROM coach_users WHERE email = $1', ['guest@coachai.app'])
  let user = row?.rows?.[0]
  if (!user) {
    const id = `usr_${crypto.randomBytes(6).toString('hex')}`
    const created = await query(
      'INSERT INTO coach_users (id, name, email, password_hash, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, role',
      [id, 'Guest Demo', 'guest@coachai.app', hashPassword(crypto.randomBytes(16).toString('hex')), 'Agent']
    )
    user = created?.rows?.[0]
    if (!user) return res.status(500).json({ error: 'Could not create guest session.' })
  }
  const token = generateToken()
  await createAuthSession(user.id, token, req)
  logActivity(user.id, null, 'guest_login', {})
  res.json({ user, token })
})

app.post('/api/auth/logout', async (req, res) => {
  const h = req.headers.authorization || ''
  const token = h.startsWith('Bearer ') ? h.slice(7) : null
  if (token && isDbReady()) {
    const row = await query('SELECT user_id FROM coach_auth_sessions WHERE token = $1 AND is_active = true', [token])
    const userId = row?.rows?.[0]?.user_id
    await query(
      'UPDATE coach_auth_sessions SET is_active = false, logout_at = now() WHERE token = $1',
      [token]
    )
    logActivity(userId || null, null, 'logout', {})
  }
  res.json({ ok: true })
})

app.get('/api/auth/me', async (req, res) => {
  const user = await authUser(req)
  if (!user) return res.status(401).json({ error: 'Not authenticated.' })
  res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } })
})

// ---- Session + chat ----

app.post('/api/session/start', async (req, res) => {
  const user = await authUser(req)
  const session = seedSession({ ...(req.body || {}), user_id: user?.id || null })
  pushCustomerMessage(session, session.scenario.opening)
  const turn = await coachTurn(session, session.scenario.opening)
  pushAgentTurn(session, turn)
  registerSession(session)
  await persistSession(session)
  logActivity(user?.id || null, session.id, 'session_start', {
    mode: session.mode,
    scenario: session.scenario_choice,
    product_context: session.product_context,
  })
  res.json({
    session_id: session.id,
    product_context: session.product_context,
    scenario: { title: session.scenario.title, persona: session.scenario.persona },
    messages: session.messages.map(m => ({ role: m.role, content: m.message })),
    last_turn: turn,
  })
})

app.post('/api/chat/message', async (req, res) => {
  const { message, role, session_id } = req.body || {}
  const session = await loadSessionOr404(session_id, res)
  if (!session) return
  const agentMsg = (message || '').trim()
  if (!agentMsg) return res.status(400).json({ error: 'Message required' })
  pushAgentMessage(session, agentMsg)
  const custReply = await advanceCustomer(session, agentMsg)
  const turn = await coachTurn(session, custReply)
  await persistSession(session)
  logActivity(session.user_id, session.id, 'chat_message', { role: role || 'agent' })
  res.json({
    messages: session.messages.map(m => ({ role: m.role, content: m.message })),
    last_turn: turn,
  })
})

app.post('/api/chat/autopilot', async (req, res) => {
  const { session_id } = req.body || {}
  const session = await loadSessionOr404(session_id, res)
  if (!session) return
  const lastCustomer = [...session.messages].reverse().find(m => m.role === 'customer')
  const turn = await coachTurn(session, lastCustomer?.message || '')
  pushAgentTurn(session, turn)
  const custReply = await advanceCustomer(session, turn.suggested_response)
  const turn2 = await coachTurn(session, custReply)
  pushAgentTurn(session, turn2)
  await persistSession(session)
  logActivity(session.user_id, session.id, 'autopilot', {})
  res.json({
    messages: session.messages.map(m => ({ role: m.role, content: m.message })),
    last_turn: turn2,
  })
})

app.post('/api/chat/manager-takeover', async (req, res) => {
  const { message, session_id } = req.body || {}
  const session = await loadSessionOr404(session_id, res)
  if (!session) return
  const managerMsg = message?.trim() || `Hi, this is ${session.agent_name === 'Support Agent' ? 'the manager' : 'a manager'} speaking. I've reviewed your case and I'll personally handle it now.`
  pushAgentMessage(session, managerMsg, { is_manager: true })
  const custReply = await advanceCustomer(session, managerMsg)
  const turn = await coachTurn(session, custReply)
  pushAgentTurn(session, turn)
  await persistSession(session)
  logActivity(session.user_id, session.id, 'manager_takeover', {})
  res.json({
    messages: session.messages.map(m => ({ role: m.role, content: m.message })),
    last_turn: turn,
  })
})

app.post('/api/chat/end', async (req, res) => {
  const { session_id, recipient_email } = req.body || {}
  const session = await loadSessionOr404(session_id, res)
  if (!session) return
  session.is_active = false
  const report = buildReport(session)
  saveReport(report)
  if (isDbReady()) {
    await query('INSERT INTO coach_reports (session_id, report) VALUES ($1, $2) ON CONFLICT (session_id) DO UPDATE SET report = $2', [session.id, report])
  }
  await persistSession(session)
  logActivity(session.user_id, session.id, 'session_end', { overall_score: report.overall_score })

  let email_sent = false
  let email_error = null
  if (recipient_email) {
    const subject = `CoachAI Session Report — ${report.overall_score ?? 'N/A'}/100`
    const body = `CoachAI session report\nOverall score: ${report.overall_score ?? 'N/A'}/100\n\n${(report.summary || '')}`
    const r = await sendEmailViaComposio(recipient_email, subject, body)
    email_sent = r.success
    if (!r.success) email_error = r.message
  }

  res.json({ session_id: session.id, report, email_sent, email_error })
})

// ---- Analysis agents ----
// Every route below shares the same shape (log the call, run one pure
// function, return JSON) and is built by analysisRoute() above instead of
// repeating that shape by hand.

app.post('/api/analysis/viral', analysisRoute('analysis_viral', (b) => agents.viralThreat(b.message || '')))
app.post('/api/analysis/fraud', analysisRoute('analysis_fraud', (b) => agents.fraudAnalysis(b.message || '')))
app.post('/api/analysis/defection', analysisRoute('analysis_defection', (b) => agents.defectionAnalysis(b.message || '')))
app.post('/api/analysis/mind-reader', analysisRoute('analysis_mind_reader', (b) => agents.mindReader(b.message || '', b.context || '')))
app.post('/api/analysis/multiverse', analysisRoute('analysis_multiverse', (b) => agents.multiverse(b.message || '', b.turn_number || 2)))
app.post('/api/analysis/cognitive-load', analysisRoute('analysis_cognitive_load', (b) => agents.cognitiveLoad(b.message || '')))
app.post('/api/bot/reply', analysisRoute('bot_reply', (b) => agents.botReply(b.message || '')))

app.post('/api/analysis/patience', async (req, res) => {
  const { message, current_turn, session_id } = req.body || {}
  const session = await getSession(session_id)
  logActivity(session?.user_id || null, session_id, 'analysis_patience', {})
  const base = await agents.patienceAnalysis(message || '', current_turn || 1, session_id || '')
  if (session?.mode === 'simulator') {
    const turns = session.messages.filter(m => m.role === 'customer').length
    base.estimated_turns_left = Math.max(1, 7 - turns)
  }
  res.json(base)
})

app.post('/api/analysis/compliance', async (req, res) => {
  const { session_id } = req.body || {}
  const session = await getSession(session_id)
  logActivity(session?.user_id || null, session_id, 'analysis_compliance', {})
  res.json(agents.complianceCheck(session?.messages || [], []))
})

app.post('/api/analysis/tone', async (req, res) => { logActivity(null, null, 'analysis_tone', {}); res.json(await agents.tonePolish(req.body?.draft || '', req.body?.customer_message || '')) })
app.post('/api/analysis/scenario', async (req, res) => { logActivity(null, null, 'analysis_scenario', {}); res.json(await agents.scenarioGenerator(req.body?.product_context, req.body?.difficulty)) })

app.post('/api/analysis/qa-audit', async (req, res) => {
  const { session_id } = req.body || {}
  const session = await getSession(session_id)
  logActivity(session?.user_id || null, session_id, 'analysis_qa_audit', {})
  const report = session ? buildReport(session) : null
  res.json(await agents.qaAudit(report))
})

app.post('/api/analysis/auto-kb', async (req, res) => {
  const { session_id } = req.body || {}
  const session = await getSession(session_id)
  logActivity(session?.user_id || null, session_id, 'analysis_auto_kb', {})
  const report = session ? buildReport(session) : null
  res.json(agents.autoKbDraft(report?.knowledge_gaps))
})

app.post('/api/jira/ticket', async (req, res) => {
  const { product_context, session_id } = req.body || {}
  const session = await getSession(session_id)
  logActivity(session?.user_id || null, session_id, 'jira_ticket', { product_context })
  res.json(await agents.jiraTicket(product_context || 'Zomato - Food Delivery App', session?.messages || []))
})

// ---- Survival mode ----

app.post('/api/survival/start', (req, res) => {
  survivalState = { active: true, index: 0, score: 0, replies: [], startedAt: Date.now() }
  logActivity(null, null, 'survival_start', {})
  res.json({
    active: true,
    total_tickets: SURVIVAL_TICKETS.length,
    current_ticket: SURVIVAL_TICKETS[0],
    ticket_index: 0,
  })
})

app.post('/api/survival/turn', (req, res) => {
  const { ticket_index, reply_text, turn_time_seconds } = req.body || {}
  if (!survivalState.active) {
    return res.status(400).json({ error: 'Survival mode not started. Call /api/survival/start first.' })
  }
  const ticket = SURVIVAL_TICKETS[ticket_index]
  if (!ticket) return res.status(404).json({ error: 'Ticket not found' })
  const text = (reply_text || '').toLowerCase()
  const covered = ticket.keywords.filter(k => text.includes(k))
  const time = turn_time_seconds || 0
  const timeScore = Math.max(0, 1 - time / 120)
  const coverage = covered.length / ticket.keywords.length
  const score = Math.round((coverage * 0.7 + timeScore * 0.3) * 100)
  survivalState.score += score
  survivalState.replies.push({ ticket_index, score })
  const next = ticket_index + 1
  const done = next >= SURVIVAL_TICKETS.length
  if (done) survivalState.active = false
  logActivity(null, null, 'survival_turn', { ticket_index, score, done })
  res.json({
    score,
    total_score: survivalState.score,
    covered_keywords: covered,
    feedback: score >= 80 ? 'Excellent — key points covered, fast reply.' : score >= 50 ? 'Decent — hit the main points.' : 'Weak — you missed key keywords. Review the ticket.',
    next_ticket: done ? null : SURVIVAL_TICKETS[next],
    ticket_index: next,
    done,
  })
})

app.post('/api/manager/whisper', async (req, res) => {
  const { text, sender_id, session_id } = req.body || {}
  const session = await getSession(session_id)
  logActivity(session?.user_id || null, session_id, 'manager_whisper', {})
  const finalText = text || session?.messages?.filter(m => m.role === 'customer').at(-1)?.message || ''
  res.json(agents.managerWhisper(finalText, sender_id || 'Manager'))
})

// ---- Integrations ----

app.get('/api/integrations/status', (req, res) => {
  res.json({
    configured: !!process.env.COMPOSIO_API_KEY,
    connected_accounts: [],
  })
})

app.post('/api/gmail/send', async (req, res) => {
  const { recipient_email, subject, body } = req.body || {}
  if (!recipient_email || !subject || !body) {
    return res.status(400).json({ status: 'error', sent: false, detail: 'recipient_email, subject and body are required.' })
  }
  const r = await sendEmailViaComposio(recipient_email, subject, body)
  res.json({
    status: r.success ? 'success' : 'error',
    sent: r.success,
    detail: r.success ? `Email sent to ${recipient_email}` : r.message,
  })
})

app.get('/api/cache/reset', (req, res) => {
  resetCache()
  res.json({ ok: true })
})

const PORT = process.env.PORT || 8000

async function bootstrap() {
  await ensureSchema()
  try {
    const { chunks, embedded } = await ingestAll()
    console.log(`[coachai] KB ingested: ${chunks} chunks, ${embedded} embedded (${KB_DIR})`)
  } catch (e) {
    console.warn('[coachai] KB ingest skipped:', e.message)
  }
  if (!isDbReady()) console.log('[coachai] No DATABASE_URL — running with in-memory storage (reports lost on restart)')
}

bootstrap()

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`[coachai] backend v2 running on http://localhost:${PORT}`)
  })
}

export default app
