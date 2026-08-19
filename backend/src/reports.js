import { isDbReady, query } from './db.js'
import { loadSeedJson } from './paths.js'
import { sentimentAnalysis } from './agents.js'

// Module-private state — exposed only through the functions below, never
// exported directly, so callers can't mutate it by surprise.
let reports = []
let hallOfFame = []

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

export function buildReport(session) {
  const agentTurns = session.messages.filter(m => m.role === 'agent')
  const customerTurns = session.messages.filter(m => m.role === 'customer')
  const journey = agentTurns.map((t, i) => {
    const s = t.frustration_pct != null
      ? { sentiment: t.sentiment, frustration_pct: t.frustration_pct }
      : sentimentAnalysis(customerTurns[i]?.message || '')
    const prev = i > 0 ? (agentTurns[i - 1].frustration_pct != null ? { frustration_pct: agentTurns[i - 1].frustration_pct } : sentimentAnalysis(customerTurns[i - 1]?.message || '')) : null
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

export function getReports() {
  return reports
}

// Reusable: recording a finished session's report, and — when the score is
// notably high or low — mirroring it into the hall of fame/shame, is one
// operation. Routes call this instead of juggling both arrays themselves.
export function saveReport(report) {
  reports.push(report)
  if (report.overall_score >= 0.75 || report.overall_score <= 0.35) {
    const score = Math.round(report.overall_score * 100)
    const label = report.overall_score >= 0.75 ? 'Masterclass' : 'Needs Work'
    const entry = {
      entry_id: `HOF-${Date.now().toString(36)}`,
      title: `${label} Session (${score}%) — ${report.agent_name || 'Agent'}`,
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

export function getHallOfFame() {
  return hallOfFame
}

export async function loadHallOfFame() {
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
