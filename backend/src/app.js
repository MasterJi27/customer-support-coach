import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { fileURLToPath } from 'url'
import * as agents from './agents.js'
import { searchKB, ingestAll, resetCache } from './rag.js'
import { ensureSchema, isDbReady, query } from './db.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function resolveDataDir(...candidates) {
  for (const c of candidates) {
    if (c && fs.existsSync(c)) return c
  }
  return candidates[0] || null
}

const KB_DIR = process.env.KB_DIR || resolveDataDir(
  path.join(__dirname, '..', 'data', 'knowledge_base'),
  path.join(process.cwd(), 'data', 'knowledge_base'),
  path.join(__dirname, 'data', 'knowledge_base')
)

const app = express()
app.use(cors())
app.use(express.json({ limit: '2mb' }))

const sessions = new Map()
let reports = []
let hallOfFame = []

function hashPassword(pw) {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.scryptSync(pw, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

function verifyPassword(pw, stored) {
  try {
    const [salt, hash] = String(stored).split(':')
    const test = crypto.scryptSync(pw, salt, 64).toString('hex')
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(test, 'hex'))
  } catch {
    return false
  }
}

function generateToken() {
  return crypto.randomBytes(24).toString('hex')
}

function getClientInfo(req) {
  const fwd = req.headers['x-forwarded-for']
  return {
    ip: fwd ? String(fwd).split(',')[0].trim() : req.ip || null,
    userAgent: req.headers['user-agent'] || null,
  }
}

async function authUser(req) {
  const h = req.headers.authorization || ''
  const token = h.startsWith('Bearer ') ? h.slice(7) : null
  if (!token) return null
  await ensureDb()
  if (!isDbReady()) return null
  const row = await query(
    `SELECT u.id, u.name, u.email, u.role, a.token
     FROM coach_auth_sessions a JOIN coach_users u ON u.id = a.user_id
     WHERE a.token = $1 AND a.is_active = true`,
    [token]
  )
  return row?.rows?.[0] || null
}

function logActivity(userId, sessionId, action, details = {}) {
  if (!isDbReady()) return
  query(
    `INSERT INTO coach_activity_log (user_id, session_id, action, details) VALUES ($1, $2, $3, $4)`,
    [userId || null, sessionId || null, action, JSON.stringify(details)]
  ).catch(() => {})
}

async function persistSession(session) {
  if (!isDbReady()) return
  await query(
    `INSERT INTO coach_sessions (id, user_id, config, messages, is_active)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (id) DO UPDATE SET messages = $4, is_active = $5`,
    [
      session.id,
      session.user_id || null,
      JSON.stringify(session.config || {}),
      JSON.stringify(session.messages || []),
      session.is_active,
    ]
  )
}

async function loadSession(id) {
  if (!isDbReady()) return null
  const row = await query(
    `SELECT id, user_id, config, messages, is_active FROM coach_sessions WHERE id = $1`,
    [id]
  )
  const r = row?.rows?.[0]
  if (!r) return null
  return {
    id: r.id,
    user_id: r.user_id,
    config: r.config || {},
    messages: r.messages || [],
    is_active: r.is_active,
  }
}

async function getSession(id) {
  if (sessions.has(id)) return sessions.get(id)
  const s = await loadSession(id)
  if (s) sessions.set(id, s)
  return s
}

function loadSeedJson(name) {
  const p = resolveDataDir(
    path.join(__dirname, '..', 'data', name),
    path.join(process.cwd(), 'data', name),
    path.join(__dirname, 'data', name)
  )
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'))
  } catch {
    return null
  }
}

const hallSeed = loadSeedJson('hall_of_fame.json')
if (Array.isArray(hallSeed)) {
  hallOfFame = hallSeed.map((e, i) => ({
    entry_id: e.entry_id || `HOF-${i}`,
    title: e.title || 'Archived session',
    category: e.category || 'hall_of_fame',
    overall_score: e.overall_score ?? 0.7,
    summary: e.summary || '',
    transcript: e.transcript || [],
    created_at: e.created_at || new Date().toISOString(),
  }))
}

const SURVIVAL_TICKETS = [
  { title: 'Double Billing Charge', keywords: ['refund', 'double', 'charged', 'money', 'bank'], message: 'You charged my card twice this month. I want my money back immediately.' },
  { title: 'Missing Delivery', keywords: ['order', 'missing', 'never arrived', 'track', 'delivery'], message: 'My order says delivered but I never got it. Where is my food?' },
  { title: 'Wrong Order Received', keywords: ['wrong', 'order', 'replace', 'sent back', 'exchange'], message: 'This is the wrong order. I ordered a burger, you sent a salad. Fix this.' },
  { title: 'Account Hacked', keywords: ['hacked', 'account', 'stolen', 'password', 'security'], message: 'Someone hacked my account and ordered using my card. Help me now!' },
  { title: 'Refund Delay', keywords: ['refund', '10 days', 'processing', 'waiting', 'when'], message: 'You promised a refund 10 days ago and nothing. When exactly will I get it?' },
]

let survivalState = { active: false, index: 0, score: 0, replies: [], startedAt: 0 }

const SCENARIOS = {
  delivery_delay: { problem: 'Your order is 45 minutes late. The rider is stuck in traffic and has not updated the app.', persona: 'Hungry and annoyed customer' },
  wrong_order: { problem: 'The customer received a completely different order from what was ordered.', persona: 'Confused customer' },
  refund_request: { problem: 'The customer wants an immediate refund for a cancelled order that was still charged.', persona: 'Frustrated customer' },
  billing_issue: { problem: 'The customer noticed a double charge on their credit card for a subscription.', persona: 'Worried customer' },
  quality_complaint: { problem: 'The food arrived cold and the customer is threatening to post a bad review.', persona: 'Disappointed customer' },
  rude_agent: { problem: 'The customer had a previous rude experience and is now demanding a manager.', persona: 'Angry customer' },
}

function rand(arr) { return arr[Math.floor(Math.random() * arr.length)] }

function defaultScenario(choice) {
  const s = SCENARIOS[choice] || SCENARIOS.delivery_delay
  return {
    title: choice === 'custom' ? 'Custom Scenario' : `Scenario: ${choice.replace(/_/g, ' ')}`,
    persona: s.persona,
    problem: s.problem,
    opening: `Hi. ${s.problem} ${rand(['I need this fixed right now.', 'This is unacceptable.', 'Please tell me how you will solve this.'])}`,
  }
}

function seedSession(opts) {
  const id = `sess_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`
  const scenario = defaultScenario(opts.scenario_choice || 'delivery_delay')
  return {
    id,
    mode: opts.mode || 'simulator',
    agent_name: opts.agent_name || 'Support Agent',
    product_context: opts.product_context || 'Zomato Food Delivery',
    scenario_choice: opts.scenario_choice || 'delivery_delay',
    scenario,
    messages: [],
    created_at: new Date().toISOString(),
    is_active: true,
    user_id: opts.user_id || null,
    config: opts,
  }
}

function analyzeTurn(session, customerMsg, agentMsg) {
  const senti = agents.sentimentAnalysis(customerMsg)
  return {
    role: 'agent',
    message: agentMsg,
    kb: null,
    entries: [
      { key: 'KB Match', text: 'BM25 + embeddings search in progress…' },
      { key: 'Sentiment', value: senti.sentiment, text: `${senti.frustration_pct}% frustrated` },
      { key: 'Intent', text: senti.intent },
      { key: 'Escalation risk', value: `${senti.escalation_risk_pct}%` },
    ],
    coaching_tips: [],
    sentiment: senti,
  }
}

async function customerReply(session, lastAgentMsg) {
  const system = `You are simulating a customer called "${session.scenario.persona}" on ${session.product_context}. Stay in character: you are ${session.scenario.problem.toLowerCase()} Keep replies short (1-3 sentences), natural, and never break character.`
  const llm = await agents.chatComplete([
    { role: 'system', content: system },
    { role: 'user', content: `The support agent just said: "${lastAgentMsg}"\n\nReply as the customer.` },
  ])
  if (llm) return llm
  const replies = [
    "That doesn't help me. I want this fixed now.",
    "Are you serious? I've been waiting for ages.",
    "Fine, but I'm going to take my business elsewhere.",
    "Okay, what do you need from me to fix this?",
    "I really hope you can resolve this quickly.",
  ]
  return rand(replies)
}

async function coachTurn(session, customerMsg) {
  const kb = await agents.kbRecommendation(customerMsg)
  const senti = agents.sentimentAnalysis(customerMsg)
  const suggestion = await agents.coachSuggestion(customerMsg, kb, senti)
  const tips = []
  if (senti.escalation_risk_pct >= 75) tips.push('High escalation risk — authorize resolution, no more probing questions.')
  if (senti.churn_risk_pct >= 60) tips.push('Churn signals detected — consider a retention incentive.')
  if (senti.viral_threat === 'High') tips.push('Public exposure threat — keep replies measured and calm.')
  if (kb.title && !kb.title.includes('No direct')) tips.push(`Reference KB: ${kb.title}`)
  else tips.push('No KB match — flag a knowledge gap after the session.')

  const churn = senti.churn_risk_pct
  const viral = senti.viral_threat === 'High' ? Math.max(35, senti.escalation_risk_pct - 10) : senti.escalation_risk_pct >= 60 ? 25 : 0
  const fraud = agents.fraudAnalysis(customerMsg).fraud_risk === 'High' ? Math.max(50, senti.escalation_risk_pct) : senti.escalation_risk_pct >= 65 ? 15 : 0
  const csat = Math.max(1, Math.min(5, Math.round((4.2 - senti.frustration_pct / 30) * 10) / 10))

  return {
    customer_message: customerMsg,
    sentiment: senti.sentiment,
    intent: senti.intent,
    frustration_pct: senti.frustration_pct,
    satisfaction_trend: 'stable',
    escalation_risk_pct: senti.escalation_risk_pct,
    escalation_reasoning: senti.escalation_risk_pct >= 60 ? 'High frustration combined with urgency — resolve now.' : '',
    escalation_strategies: senti.escalation_risk_pct >= 60 ? ['Authorize resolution', 'No more probing questions', 'Offer concrete timeline'] : [],
    predicted_csat: csat,
    churn_risk_pct: churn,
    csat_drivers: [],
    viral_risk_pct: viral,
    platform_risk: viral >= 40 ? 'Public blast risk' : '',
    pr_statement: viral >= 40 ? 'We sincerely apologize for this experience. We are resolving it with top priority right now.' : '',
    fraud_risk_pct: fraud,
    fraud_category: fraud >= 60 ? 'refund_fraud' : '',
    fraud_protocol: fraud >= 60 ? 'Verify identity and transaction history before any refund.' : '',
    defection_risk_pct: churn,
    competitor_mentioned: null,
    retention_counter_offer: churn >= 50 ? 'Offer a retention incentive once the core issue is resolved.' : '',
    internal_monologue: '',
    true_intent: senti.intent,
    escalation_trigger: senti.escalation_risk_pct >= 75 ? `Escalation risk ${senti.escalation_risk_pct}%` : '',
    coaching_tips: tips,
    suggested_response: suggestion.reply,
    suggested_actions: [],
    quality_score: Math.round((0.7 + (1 - senti.frustration_pct / 100) * 0.3) * 100) / 100,
    clarity_pct: Math.max(50, 100 - Math.round(senti.frustration_pct * 0.4)),
    tone_quality: 'Professional',
    kb: {
      title: kb.title || '',
      content: kb.content || '',
      source: kb.source || '',
    },
    entries: [
      { key: 'KB Match', text: kb.title || 'No match', value: kb.score || '' },
      { key: 'Sentiment', text: senti.sentiment, value: `${senti.frustration_pct}% frustrated` },
      { key: 'Intent', text: senti.intent },
      { key: 'Escalation risk', value: `${senti.escalation_risk_pct}%` },
      { key: 'Suggested reply', text: suggestion.reply },
    ],
  }
}

function buildReport(session) {
  const agentTurns = session.messages.filter(m => m.role === 'agent')
  const customerTurns = session.messages.filter(m => m.role === 'customer')
  const journey = agentTurns.map((t, i) => {
    const s = t.frustration_pct != null
      ? { sentiment: t.sentiment, frustration_pct: t.frustration_pct }
      : agents.sentimentAnalysis(customerTurns[i]?.message || '')
    const prev = i > 0 ? (agentTurns[i - 1].frustration_pct != null ? { frustration_pct: agentTurns[i - 1].frustration_pct } : agents.sentimentAnalysis(customerTurns[i - 1]?.message || '')) : null
    const trend = !prev ? 'stable' : s.frustration_pct < prev.frustration_pct ? 'improving' : s.frustration_pct > prev.frustration_pct ? 'deteriorating' : 'stable'
    return {
      turn: i + 1,
      sentiment: s.sentiment,
      frustration: s.frustration_pct / 100,
      satisfaction_trend: trend,
    }
  })
  const lastSenti = journey.length ? journey[journey.length - 1] : { frustration: 0.8 }
  const resolvedWords = /\b(done|fixed|resolved|on its way|refund(ed)?|replaced|sorted|apolog|credit)\b/i
  const lastAgentText = agentTurns[agentTurns.length - 1]?.message || ''
  const issueResolved = lastSenti.frustration <= 0.4 || resolvedWords.test(lastAgentText)
  const escalationNeeded = lastSenti.frustration > 0.6
  const resolutionScore = issueResolved ? (0.7 + (1 - lastSenti.frustration) * 0.3) : Math.max(0.15, 0.4 - lastSenti.frustration)
  const avgFrustration = journey.length ? journey.reduce((s, j) => s + j.frustration, 0) / journey.length : 0.8
  const sentimentScore = Math.max(0, 1 - avgFrustration * 1.1)
  const kbUsed = [...new Set(agentTurns.map(t => t.kb?.title).filter(Boolean))]
  const overallScore = Math.round((0.55 * resolutionScore + 0.45 * sentimentScore) * 100) / 100
  const gaps = customerTurns
    .map(m => m.message.toLowerCase())
    .flatMap(msg => ['refund', 'delivery', 'billing', 'order', 'account', 'subscription'].filter(k => msg.includes(k) && !kbUsed.some(u => u.toLowerCase().includes(k))))
  const triggers = []
  for (const t of agentTurns) {
    if ((t.escalation_risk_pct ?? t.sentiment?.escalation_risk_pct) >= 75) triggers.push(`Escalation risk ${t.escalation_risk_pct ?? t.sentiment?.escalation_risk_pct}% at turn ${journey.findIndex(j => j.turn) + 1}`)
  }
  return {
    session_id: session.id,
    agent_name: session.agent_name,
    interaction_mode: session.mode,
    total_turns: agentTurns.length,
    sentiment_journey: journey,
    resolution_quality: {
      score: Math.round(resolutionScore * 100) / 100,
      issue_resolved: issueResolved,
      customer_satisfied: lastSenti.frustration <= 0.35,
      escalation_needed: escalationNeeded,
    },
    overall_score: overallScore,
    coaching_recommendations: [
      ...(issueResolved ? ['Issue resolved — reinforce with a follow-up message.'] : ['Resolution not reached — reassign or escalate.']),
      ...(avgFrustration > 0.6 ? ['Customer frustration stayed high — lead with empathy next time.'] : ['Frustration managed well.']),
      ...(kbUsed.length ? [`Referenced KB: ${kbUsed.join(', ')}`] : ['No KB article used — improve article coverage.']),
    ],
    escalation_triggers: triggers,
    knowledge_gaps: [...new Set(gaps.slice(0, 4))],
    kb_articles_used: kbUsed,
    generated_at: new Date().toISOString(),
  }
}

function saveReport(report) {
  reports.push(report)
  if (report.overall_score >= 0.75 || report.overall_score <= 0.35) {
    const entry = {
      entry_id: `HOF-${Date.now().toString(36)}`,
      title: report.agent_name,
      category: report.overall_score >= 0.75 ? 'hall_of_fame' : 'hall_of_shame',
      overall_score: report.overall_score,
      summary: report.coaching_recommendations?.[0] || '',
      transcript: [],
      created_at: report.generated_at,
    }
    hallOfFame.unshift(entry)
    if (isDbReady()) {
      query(
        `INSERT INTO coach_hall_of_fame (entry_id, title, category, overall_score, summary, transcript, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (entry_id) DO UPDATE SET title = $2, category = $3, overall_score = $4, summary = $5, transcript = $6`,
        [entry.entry_id, entry.title, entry.category, entry.overall_score, entry.summary, JSON.stringify(entry.transcript), entry.created_at]
      ).catch(() => {})
    }
  }
}

async function loadHallOfFame() {
  if (!isDbReady()) return null
  const row = await query(
    `SELECT entry_id, title, category, overall_score, summary, transcript, created_at
     FROM coach_hall_of_fame ORDER BY created_at DESC LIMIT 40`
  )
  return row?.rows?.map(r => ({
    entry_id: r.entry_id,
    title: r.title,
    category: r.category,
    overall_score: r.overall_score,
    summary: r.summary,
    transcript: r.transcript || [],
    created_at: r.created_at,
  })) || null
}

app.get('/health', async (req, res) => {
  await ensureDb()
  res.json({
    status: 'online',
    engine: 'Azure AI Foundry + OpenRouter + Groq',
    rag: 'BM25 + OpenRouter embeddings',
    db: isDbReady(),
    vector_store: 'embedding cache',
  })
})

app.get('/api/analytics', async (req, res) => {
  let live = [...sessions.values()].map(s => ({
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
  let out = reports
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
  res.json({ entries: (dbEntries || hallOfFame).slice(0, 40) })
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

async function ensureDb() {
  await ensureSchema()
  return isDbReady()
}

app.post('/api/auth/register', async (req, res) => {
  const { name, email, password } = req.body || {}
  if (!name?.trim() || !email?.trim() || !password || password.length < 6) {
    return res.status(400).json({ error: 'Name, valid email and password (min 6 chars) are required.' })
  }
  if (!(await ensureDb())) return res.status(503).json({ error: 'Database unavailable.' })
  const exists = await query('SELECT id FROM coach_users WHERE email = $1', [email.trim().toLowerCase()])
  if (exists?.rows?.length) return res.status(409).json({ error: 'An account with this email already exists.' })
  const id = `usr_${crypto.randomBytes(6).toString('hex')}`
  const token = generateToken()
  const ci = getClientInfo(req)
  const created = await query(
    'INSERT INTO coach_users (id, name, email, password_hash, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, role',
    [id, name.trim(), email.trim().toLowerCase(), hashPassword(password), 'Agent']
  )
  if (!created?.rows?.[0]) return res.status(500).json({ error: 'Could not create account.' })
  await query(
    'INSERT INTO coach_auth_sessions (id, user_id, token, ip, user_agent, is_active) VALUES ($1, $2, $3, $4, $5, true)',
    [crypto.randomBytes(8).toString('hex'), id, token, ci.ip, ci.userAgent]
  )
  logActivity(id, null, 'register', { email: email.trim().toLowerCase() })
  res.json({ user: created.rows[0], token })
})

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body || {}
  if (!email?.trim() || !password) return res.status(400).json({ error: 'Email and password are required.' })
  if (!(await ensureDb())) return res.status(503).json({ error: 'Database unavailable.' })
  const row = await query('SELECT id, name, email, role, password_hash FROM coach_users WHERE email = $1', [email.trim().toLowerCase()])
  const user = row?.rows?.[0]
  if (!user || !verifyPassword(password, user.password_hash)) {
    logActivity(null, null, 'login_failed', { email: email.trim().toLowerCase() })
    return res.status(401).json({ error: 'Invalid email or password.' })
  }
  const token = generateToken()
  const ci = getClientInfo(req)
  await query(
    'INSERT INTO coach_auth_sessions (id, user_id, token, ip, user_agent, is_active) VALUES ($1, $2, $3, $4, $5, true)',
    [crypto.randomBytes(8).toString('hex'), user.id, token, ci.ip, ci.userAgent]
  )
  logActivity(user.id, null, 'login', { email: user.email })
  res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role }, token })
})

app.post('/api/auth/guest', async (req, res) => {
  if (!(await ensureDb())) return res.status(503).json({ error: 'Database unavailable.' })
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
  const ci = getClientInfo(req)
  await query(
    'INSERT INTO coach_auth_sessions (id, user_id, token, ip, user_agent, is_active) VALUES ($1, $2, $3, $4, $5, true)',
    [crypto.randomBytes(8).toString('hex'), user.id, token, ci.ip, ci.userAgent]
  )
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

app.post('/api/session/start', async (req, res) => {
  const user = await authUser(req)
  const session = seedSession({ ...(req.body || {}), user_id: user?.id || null })
  const opening = session.scenario.opening
  session.messages.push({ role: 'customer', message: opening, content: opening })
  const turn = await coachTurn(session, opening)
  session.messages.push({ role: 'agent', message: turn.suggested_response, content: turn.suggested_response, ...turn })
  sessions.set(session.id, session)
  await persistSession(session)
  logActivity(user?.id || null, session.id, 'session_start', {
    mode: session.mode,
    scenario: session.scenario_choice,
    product_context: session.product_context,
  })
  res.json({
    session_id: session.id,
    product_context: session.product_context,
    messages: session.messages.map(m => ({ role: m.role, content: m.message })),
    last_turn: turn,
  })
})

app.post('/api/chat/message', async (req, res) => {
  const { message, role, session_id } = req.body || {}
  const session = await getSession(session_id)
  if (!session) return res.status(404).json({ error: 'Session not found' })
  const agentMsg = (message || '').trim()
  if (!agentMsg) return res.status(400).json({ error: 'Message required' })
  session.messages.push({ role: 'agent', message: agentMsg, content: agentMsg })
  const custReply = await customerReply(session, agentMsg)
  session.messages.push({ role: 'customer', message: custReply, content: custReply })
  const turn = await coachTurn(session, custReply)
  session.messages.push({ role: 'agent', message: turn.suggested_response, content: turn.suggested_response, ...turn })
  await persistSession(session)
  logActivity(session.user_id, session.id, 'chat_message', { role: role || 'agent' })
  res.json({
    messages: session.messages.map(m => ({ role: m.role, content: m.message })),
    last_turn: turn,
  })
})

app.post('/api/chat/autopilot', async (req, res) => {
  const { session_id } = req.body || {}
  const session = await getSession(session_id)
  if (!session) return res.status(404).json({ error: 'Session not found' })
  const lastCustomer = [...session.messages].reverse().find(m => m.role === 'customer')
  const turn = await coachTurn(session, lastCustomer?.message || '')
  session.messages.push({ role: 'agent', message: turn.suggested_response, content: turn.suggested_response, ...turn })
  const custReply = await customerReply(session, turn.suggested_response)
  session.messages.push({ role: 'customer', message: custReply, content: custReply })
  const turn2 = await coachTurn(session, custReply)
  session.messages.push({ role: 'agent', message: turn2.suggestion, content: turn2.suggestion, ...turn2 })
  await persistSession(session)
  logActivity(session.user_id, session.id, 'autopilot', {})
  res.json({
    messages: session.messages.map(m => ({ role: m.role, content: m.message })),
    last_turn: turn2,
  })
})

app.post('/api/chat/manager-takeover', async (req, res) => {
  const { message, session_id } = req.body || {}
  const session = await getSession(session_id)
  if (!session) return res.status(404).json({ error: 'Session not found' })
  const managerMsg = message?.trim() || `Hi, this is ${session.agent_name === 'Support Agent' ? 'the manager' : 'a manager'} speaking. I've reviewed your case and I'll personally handle it now.`
  session.messages.push({ role: 'agent', message: managerMsg, content: managerMsg, is_manager: true })
  const custReply = await customerReply(session, managerMsg)
  session.messages.push({ role: 'customer', message: custReply, content: custReply })
  const turn = await coachTurn(session, custReply)
  session.messages.push({ role: 'agent', message: turn.suggested_response, content: turn.suggested_response, ...turn })
  await persistSession(session)
  logActivity(session.user_id, session.id, 'manager_takeover', {})
  res.json({
    messages: session.messages.map(m => ({ role: m.role, content: m.message })),
    last_turn: turn,
  })
})

app.post('/api/chat/end', async (req, res) => {
  const { session_id, recipient_email } = req.body || {}
  const session = await getSession(session_id)
  if (!session) return res.status(404).json({ error: 'Session not found' })
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
    const r = await composioExecute('GMAIL_SEND_EMAIL', {
      recipient_email,
      subject,
      body,
      is_html: false,
    })
    email_sent = r.success
    if (!r.success) email_error = r.message
  }

  res.json({ session_id: session.id, report, email_sent, email_error })
})

app.post('/api/analysis/viral', (req, res) => { logActivity(null, req.body?.session_id, 'analysis_viral', {}); res.json(agents.viralThreat(req.body?.message || '')) })
app.post('/api/analysis/fraud', (req, res) => { logActivity(null, req.body?.session_id, 'analysis_fraud', {}); res.json(agents.fraudAnalysis(req.body?.message || '')) })
app.post('/api/analysis/defection', (req, res) => { logActivity(null, req.body?.session_id, 'analysis_defection', {}); res.json(agents.defectionAnalysis(req.body?.message || '')) })
app.post('/api/analysis/mind-reader', async (req, res) => { logActivity(null, req.body?.session_id, 'analysis_mind_reader', {}); res.json(await agents.mindReader(req.body?.message || '', req.body?.context || '')) })
app.post('/api/analysis/multiverse', async (req, res) => { logActivity(null, req.body?.session_id, 'analysis_multiverse', {}); res.json(await agents.multiverse(req.body?.message || '', req.body?.turn_number || 2)) })
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
app.post('/api/analysis/cognitive-load', (req, res) => { logActivity(null, req.body?.session_id, 'analysis_cognitive_load', {}); res.json(agents.cognitiveLoad(req.body?.message || '')) })
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
  res.json(agents.qaAudit(report))
})
app.post('/api/analysis/auto-kb', async (req, res) => {
  const { session_id } = req.body || {}
  const session = await getSession(session_id)
  logActivity(session?.user_id || null, session_id, 'analysis_auto_kb', {})
  const report = session ? buildReport(session) : null
  res.json(agents.autoKbDraft(report?.knowledge_gaps))
})

app.post('/api/bot/reply', async (req, res) => { logActivity(null, req.body?.session_id, 'bot_reply', {}); res.json(await agents.botReply(req.body?.message || '')) })

app.post('/api/jira/ticket', async (req, res) => {
  const { product_context, session_id } = req.body || {}
  const session = await getSession(session_id)
  logActivity(session?.user_id || null, session_id, 'jira_ticket', { product_context })
  res.json(await agents.jiraTicket(product_context || 'Zomato - Food Delivery App', session?.messages || []))
})

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

async function composioExecute(slug, arguments_) {
  const apiKey = process.env.COMPOSIO_API_KEY
  const userId = process.env.COMPOSIO_USER_ID
  if (!apiKey) return { success: false, message: 'COMPOSIO_API_KEY not configured.' }
  const base = 'https://backend.composio.dev/api/v3.1/tools/execute/'
  const body = { user_id: userId, arguments: arguments_ }
  try {
    let resp = await fetch(base + slug, {
      method: 'POST',
      headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    let data = {}
    try { data = await resp.json() } catch { data = {} }
    if (data?.successful === false) {
      const msg = data.error || JSON.stringify(data)
      if (String(msg).match(/version/i) && !body.version) {
        body.version = 'latest'
        resp = await fetch(base + slug, {
          method: 'POST',
          headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        try { data = await resp.json() } catch { data = {} }
      }
    }
    const ok = data?.successful !== false && !data?.error
    return { success: ok, message: ok ? 'ok' : (data?.error || JSON.stringify(data)) }
  } catch (e) {
    return { success: false, message: String(e?.message || e) }
  }
}

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
  const r = await composioExecute('GMAIL_SEND_EMAIL', {
    recipient_email,
    subject,
    body,
    is_html: false,
  })
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
