import pg from 'pg'

const { Pool } = pg

let pool = null
let dbReady = false

export function initDb() {
  if (pool) return pool
  const url = process.env.DATABASE_URL
  if (!url) return null
  try {
    pool = new Pool({ connectionString: url, ssl: { rejectUnauthorized: false }, max: 3, connectionTimeoutMillis: 8000 })
    return pool
  } catch {
    return null
  }
}

export async function ensureSchema() {
  if (dbReady) return true
  const p = initDb()
  if (!p) return false
  try {
    await p.query(`
      CREATE TABLE IF NOT EXISTS coach_sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        config JSONB,
        messages JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMPTZ DEFAULT now(),
        is_active BOOLEAN DEFAULT true
      )
    `)
    await p.query('ALTER TABLE coach_sessions ADD COLUMN IF NOT EXISTS user_id TEXT')
    await p.query(`
      CREATE TABLE IF NOT EXISTS coach_reports (
        id SERIAL PRIMARY KEY,
        session_id TEXT UNIQUE,
        report JSONB,
        created_at TIMESTAMPTZ DEFAULT now()
      )
    `)
    await p.query(`
      CREATE TABLE IF NOT EXISTS coach_kb (
        doc_id TEXT,
        chunk_text TEXT,
        embedding JSONB,
        title TEXT,
        category TEXT,
        keywords JSONB
      )
    `)
    await p.query(`
      CREATE TABLE IF NOT EXISTS coach_users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT DEFAULT 'Agent',
        created_at TIMESTAMPTZ DEFAULT now()
      )
    `)
    await p.query(`
      CREATE TABLE IF NOT EXISTS coach_auth_sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        token TEXT UNIQUE NOT NULL,
        login_at TIMESTAMPTZ DEFAULT now(),
        logout_at TIMESTAMPTZ,
        ip TEXT,
        user_agent TEXT,
        is_active BOOLEAN DEFAULT true
      )
    `)
    await p.query(`
      CREATE TABLE IF NOT EXISTS coach_activity_log (
        id SERIAL PRIMARY KEY,
        user_id TEXT,
        session_id TEXT,
        action TEXT NOT NULL,
        details JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ DEFAULT now()
      )
    `)
    await p.query(`
      CREATE TABLE IF NOT EXISTS coach_hall_of_fame (
        entry_id TEXT PRIMARY KEY,
        title TEXT,
        category TEXT,
        overall_score REAL,
        summary TEXT,
        transcript JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMPTZ DEFAULT now()
      )
    `)
    dbReady = true
    return true
  } catch (e) {
    console.warn('DB init failed (falling back to in-memory):', e.message)
    return false
  }
}

export function isDbReady() {
  return dbReady
}

export async function query(text, params) {
  if (!dbReady) return null
  try {
    return await pool.query(text, params)
  } catch (e) {
    console.warn('DB query failed:', e.message)
    return null
  }
}
