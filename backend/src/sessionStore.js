import { isDbReady, query } from './db.js'

// Module-private: the live, in-memory session cache. Nothing outside this
// file touches the Map directly — everyone else goes through the functions
// below, so the storage detail can change later without breaking callers.
const sessions = new Map()

export async function persistSession(session) {
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

export async function loadSession(id) {
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

// Reusable: every route that takes a session_id calls this one function —
// it checks the in-memory cache first, then falls back to the database.
export async function getSession(id) {
  if (sessions.has(id)) return sessions.get(id)
  const s = await loadSession(id)
  if (s) sessions.set(id, s)
  return s
}

export function registerSession(session) {
  sessions.set(session.id, session)
}

export function listLiveSessions() {
  return [...sessions.values()]
}

// Reusable: appends an agent-role message. Both a raw agent/manager string
// and a full coachTurn() result (see pushAgentTurn) end up in the same
// {role, message, content, ...} shape by going through this one function.
export function pushAgentMessage(session, message, extra = {}) {
  session.messages.push({ role: 'agent', message, content: message, ...extra })
}

// Reusable: a coachTurn() result IS an agent message plus its coaching
// analysis attached — this is the one place that turns "a turn" into
// "a stored message," used by session start, autopilot and manager takeover.
export function pushAgentTurn(session, turn) {
  pushAgentMessage(session, turn.suggested_response, turn)
}

export function pushCustomerMessage(session, message) {
  session.messages.push({ role: 'customer', message, content: message })
}
