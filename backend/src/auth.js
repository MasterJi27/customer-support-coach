import crypto from 'crypto'
import { ensureSchema, isDbReady, query } from './db.js'

// Reusable: salted scrypt hash. Paired 1:1 with verifyPassword below so
// there is exactly one place that defines "how we hash a password."
export function hashPassword(pw) {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.scryptSync(pw, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

export function verifyPassword(pw, stored) {
  try {
    const [salt, hash] = String(stored).split(':')
    const test = crypto.scryptSync(pw, salt, 64).toString('hex')
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(test, 'hex'))
  } catch {
    return false
  }
}

export function generateToken() {
  return crypto.randomBytes(24).toString('hex')
}

export function getClientInfo(req) {
  const fwd = req.headers['x-forwarded-for']
  return {
    ip: fwd ? String(fwd).split(',')[0].trim() : req.ip || null,
    userAgent: req.headers['user-agent'] || null,
  }
}

// Reusable: register, login and guest-login each need to insert the exact
// same auth-session row — this was copy-pasted three times before. Now the
// row shape only has to change in one place.
export async function createAuthSession(userId, token, req) {
  const ci = getClientInfo(req)
  await query(
    'INSERT INTO coach_auth_sessions (id, user_id, token, ip, user_agent, is_active) VALUES ($1, $2, $3, $4, $5, true)',
    [crypto.randomBytes(8).toString('hex'), userId, token, ci.ip, ci.userAgent]
  )
}

// Reusable: turns a request's Bearer token into the logged-in user (or
// null). Every protected route calls this instead of re-parsing headers.
export async function authUser(req) {
  const h = req.headers.authorization || ''
  const token = h.startsWith('Bearer ') ? h.slice(7) : null
  if (!token) return null
  await ensureSchema()
  if (!isDbReady()) return null
  const row = await query(
    `SELECT u.id, u.name, u.email, u.role, a.token
     FROM coach_auth_sessions a JOIN coach_users u ON u.id = a.user_id
     WHERE a.token = $1 AND a.is_active = true`,
    [token]
  )
  return row?.rows?.[0] || null
}
