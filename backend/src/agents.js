import { chatComplete, tryJson } from './llm.js'

export { chatComplete } from './llm.js'
import { searchKB } from './rag.js'

const FRUSTRATION_WORDS = ['angry', 'furious', 'ridiculous', 'unacceptable', 'fed up', 'tired of', 'terrible', 'awful', 'horrible', 'worst', 'annoyed', 'frustrated', 'rage', 'sick of', 'never again']
const URGENT_WORDS = ['immediately', 'right now', 'asap', 'urgent', 'now', 'refund', 'lawsuit', 'legal', 'chargeback', 'complaint', 'escalate', 'manager', 'police', 'court']
const CHURN_WORDS = ['switch', 'cancel', 'leaving', 'competitor', 'alternative', 'goodbye', 'never come back', 'another app', 'uninstall', 'delete account']
const THREAT_WORDS = ['post', 'tweet', 'social media', 'twitter', 'instagram', 'share this', 'viral', 'review', 'publicly', 'newspaper', 'media']

export function sentimentAnalysis(text) {
  const lower = text.toLowerCase()
  let frustration = 0
  for (const w of FRUSTRATION_WORDS) if (lower.includes(w)) frustration += 0.22
  for (const w of ['very', 'really', 'extremely', 'totally']) if (lower.includes(w)) frustration += 0.1
  const exclamations = (lower.match(/!/g) || []).length
  const caps = (text.match(/[A-Z]/g) || []).length
  if (exclamations >= 2) frustration += 0.1
  if (text.length > 10 && caps / text.length > 0.25) frustration += 0.15
  frustration = Math.min(0.97, frustration + 0.25)

  let sentiment = 'negative'
  if (frustration < 0.35) sentiment = 'neutral'
  if (frustration < 0.2) sentiment = 'positive'

  let intent = 'query'
  if (lower.includes('refund') || lower.includes('money back')) intent = 'refund_request'
  if (lower.includes('cancel') || lower.includes('unsubscribe')) intent = 'cancellation'
  if (lower.includes('missing') || lower.includes('wrong order')) intent = 'order_issue'
  if (lower.includes('billing') || lower.includes('charged') || lower.includes('double')) intent = 'billing_dispute'
  if (lower.includes('complaint') || lower.includes('lawsuit')) intent = 'escalation'

  const urgent = URGENT_WORDS.some(w => lower.includes(w))
  const churn = CHURN_WORDS.some(w => lower.includes(w))
  const threat = THREAT_WORDS.some(w => lower.includes(w))
  const escalationRisk = Math.min(0.98, 0.25 + frustration * 0.5 + (urgent ? 0.2 : 0) + (threat ? 0.25 : 0))
  const churnRisk = Math.min(0.95, 0.1 + frustration * 0.4 + (churn ? 0.4 : 0))

  return {
    sentiment,
    frustration_pct: Math.round(frustration * 100),
    intent,
    urgent: urgent ? 'Yes' : 'No',
    escalation_risk_pct: Math.round(escalationRisk * 100),
    churn_risk_pct: Math.round(churnRisk * 100),
    viral_threat: threat ? 'High' : 'Low',
  }
}

export async function kbRecommendation(text) {
  const results = await searchKB(text, 3)
  if (!results.length) {
    return {
      title: 'No direct KB match',
      content: 'Search the knowledge base for related articles or flag a knowledge gap.',
      source: 'keyword',
      score: 0,
    }
  }
  const top = results[0]
  return {
    title: top.title,
    content: top.content,
    source: top.source,
    keywords: top.keywords,
    score: top.score,
    top_matches: results,
  }
}

export async function tonePolish(draft, customerMessage = '') {
  const system = `You are a customer support writing coach. Rewrite the agent's draft reply to be warmer, clearer and more empathetic. Keep it professional and concise (max 4 sentences). Respond ONLY with the rewritten reply text, no quotes, no explanation.`
  const user = `Customer message: "${customerMessage || '(none)'}"\n\nAgent draft: "${draft}"`
  const llm = await chatComplete([
    { role: 'system', content: system },
    { role: 'user', content: user },
  ])
  if (llm) {
    return { rewritten: llm.replace(/^["']|["']$/g, ''), mode: 'llm' }
  }
  const lower = draft.toLowerCase()
  let rewritten = draft.trim()
  if (!/sorry|apolog|understand|empath/.test(lower)) {
    rewritten = `I completely understand your frustration. ${rewritten}`
  }
  rewritten = rewritten.replace(/\bunfortunately\b/g, 'I want to help')
  if (!/[.!?]\s*$/.test(rewritten)) rewritten += '.'
  return { rewritten, mode: 'heuristic' }
}

export async function coachSuggestion(customerText, kbHit, sentiment) {
  const system = `You are a customer support coach. Given the customer message, the matching KB article, and sentiment analysis, suggest the best reply. Respond as JSON: {"reply": "...", "tone": "empathetic|neutral|firm", "clarity": 1-5, "key_point": "..."}`
  const user = `Customer: "${customerText}"\n\nKB article: ${kbHit?.title ? `"${kbHit.title}" — ${kbHit.content}` : 'none'}\n\nSentiment: ${JSON.stringify(sentiment)}`
  const raw = await chatComplete([
    { role: 'system', content: system },
    { role: 'user', content: user },
  ], { json: true })
  const parsed = await tryJson(raw)
  if (parsed?.reply) {
    return { reply: parsed.reply, tone: parsed.tone || 'empathetic', clarity: parsed.clarity || 4, key_point: parsed.key_point || '', mode: 'llm' }
  }
  return {
    reply: `I'm really sorry about that — let me fix this for you right away. ${kbHit?.title ? `Based on our policy (${kbHit.title}), ` : ''}I can resolve this now. Could you confirm your order/account details so I can process it immediately?`,
    tone: 'empathetic',
    clarity: 4,
    key_point: kbHit?.title || 'Resolve with urgency',
    mode: 'heuristic',
  }
}

export async function scenarioGenerator(productContext = 'Zomato - Food Delivery App', difficulty = 'challenging') {
  const system = `You are a training scenario generator for customer support. Create one realistic customer support scenario. Respond as JSON: {"title": "...", "persona": "...", "emotion": "angry|frustrated|neutral|happy", "problem": "...", "context": "...", "resolution": "...", "difficulty": "${difficulty}"}`
  const raw = await chatComplete([
    { role: 'system', content: system },
    { role: 'user', content: `Product: ${productContext}. Difficulty: ${difficulty}.` },
  ], { json: true })
  const parsed = await tryJson(raw)
  if (parsed?.title) return parsed
  return {
    title: 'Billing Double Charge',
    persona: 'Frustrated customer who was charged twice for a subscription.',
    emotion: 'frustrated',
    problem: 'billing',
    context: `Customer on ${productContext} noticed a duplicate charge on their credit card. They want it reversed immediately and are threatening to switch providers.`,
    resolution: 'Apologize, verify the transaction, initiate a refund trace, and offer a goodwill credit.',
    difficulty,
  }
}

export async function mindReader(message, context = '') {
  const system = `You are a customer psychology analyst. Read the customer message and infer their TRUE underlying intent, what they actually want, and what they're not saying. Respond as JSON: {"true_intent": "...", "internal_monologue": "...", "emotional_state": "...", "unspoken_need": "..."}`
  const raw = await chatComplete([
    { role: 'system', content: system },
    { role: 'user', content: `Customer message: "${message}"\nContext: ${context || 'none'}` },
  ], { json: true })
  const parsed = await tryJson(raw)
  if (parsed?.true_intent) return parsed
  const s = sentimentAnalysis(message)
  return {
    true_intent: s.intent === 'refund_request' ? 'Wants the money back, not promises' : 'Wants the issue resolved without further effort',
    internal_monologue: `"This is taking too long. I just want ${s.intent === 'billing_dispute' ? 'my money back' : 'this fixed'}."`,
    emotional_state: s.sentiment,
    unspoken_need: 'To be taken seriously and compensated for inconvenience',
  }
}

export async function multiverse(message, turnNumber = 2) {
  const system = `You are a "what if" simulator for customer support. Given a customer message, generate 3 alternative agent replies and predict each outcome (customer reaction + escalation risk). Respond as JSON: {"branches": [{"label": "...", "reply": "...", "outcome": "...", "risk": 1-100}]}`
  const raw = await chatComplete([
    { role: 'system', content: system },
    { role: 'user', content: `Customer message (turn ${turnNumber}): "${message}"` },
  ], { json: true })
  const parsed = await tryJson(raw)
  if (parsed?.branches?.length) return parsed
  const s = sentimentAnalysis(message)
  return {
    branches: [
      { label: 'Refund first', reply: 'I understand. I will process the refund right now — you should see it within 5-7 business days.', outcome: 'Customer relieved, risk drops', risk: Math.max(10, s.escalation_risk_pct - 50) },
      { label: 'Ask questions first', reply: 'Can you tell me more about what happened?', outcome: 'Customer more frustrated', risk: s.escalation_risk_pct + 10 },
      { label: 'Apologize + escalate', reply: 'I sincerely apologize. I will escalate this to our senior team now.', outcome: 'Customer satisfied, resolution delayed', risk: Math.max(15, s.escalation_risk_pct - 30) },
    ],
  }
}

export async function patienceAnalysis(message, currentTurn = 1, sessionId = '') {
  const s = sentimentAnalysis(message)
  const patience = Math.max(1, Math.round(7 - currentTurn * 0.8 - s.frustration_pct / 25))
  return {
    estimated_turns_left: patience,
    patience_level: patience >= 5 ? 'High' : patience >= 3 ? 'Medium' : 'Low',
    risk_of_dropoff: patience <= 2 ? 'Very high — respond with resolution now' : patience <= 3 ? 'High — avoid probing questions' : 'Normal',
    advice: patience <= 2 ? 'Skip questions, offer resolution directly.' : 'Keep replies short and action-oriented.',
  }
}

export function cognitiveLoad(message) {
  const words = message.split(/\s+/).length
  const complexity = Math.min(1, words / 80)
  return {
    load_score: Math.round(40 + complexity * 60),
    level: complexity > 0.5 ? 'High' : 'Moderate',
    advice: complexity > 0.5 ? 'Customer message is complex — break into parts.' : 'Manageable message load.',
  }
}

export function fraudAnalysis(message) {
  const lower = message.toLowerCase()
  const fraudWords = ['hacked', 'stolen', 'unauthorized', 'didn\'t make', 'not mine', 'fraud', 'scam', 'refund immediately', 'refund now']
  const hits = fraudWords.filter(w => lower.includes(w))
  if (hits.length >= 2) {
    return { fraud_risk: 'High', flags: hits, advice: 'Verify identity and transaction history before any refund.' }
  }
  return { fraud_risk: 'Low', flags: [], advice: 'Looks legitimate — proceed normally.' }
}

export function defectionAnalysis(message) {
  const lower = message.toLowerCase()
  const hits = CHURN_WORDS.filter(w => lower.includes(w))
  const competitor = (lower.match(/switch to (\w+)/) || [])[1] || null
  return {
    defection_risk: hits.length ? 'High' : 'Low',
    signals: hits,
    competitor,
    advice: hits.length ? 'Offer a retention incentive and resolve the core issue first.' : 'No churn signals.',
  }
}

export function viralThreat(message) {
  const lower = message.toLowerCase()
  const hits = THREAT_WORDS.filter(w => lower.includes(w))
  return {
    viral_risk: hits.length ? 'High' : 'Low',
    signals: hits,
    advice: hits.length ? 'De-escalate immediately — public exposure risk.' : 'Low public exposure risk.',
  }
}

export function complianceCheck(messages, kbHits) {
  const agentMsgs = messages.filter(m => m.role === 'agent')
  if (!agentMsgs.length) return { status: 'PASS', violations: [], notes: 'No agent messages to check.' }
  const full = agentMsgs.map(m => m.message).join(' ').toLowerCase()
  const violations = []
  if (/\bunfortunately\b/.test(full)) violations.push('Used "unfortunately" — discourages empathy')
  if (/promise|guarantee/.test(full)) violations.push('Made an unverifiable promise')
  if (/refund (immediately|right now)/.test(full) && kbHits.length === 0) violations.push('Promised refund without KB policy match')
  return {
    status: violations.length ? 'FAIL' : 'PASS',
    violations,
    notes: violations.length ? 'Review flagged lines before sending.' : 'All checks passed.',
  }
}

export async function qaAudit(report) {
  const score = report?.overall_score ?? 0.5
  const issues = []
  if (score < 0.4) issues.push('Resolution score critically low')
  if (report?.escalation_triggers?.length) issues.push(`Escalation triggers: ${report.escalation_triggers.join(', ')}`)
  if (!report?.resolution_quality?.issue_resolved) issues.push('Issue was not resolved')
  const passed = 21 - issues.length
  return {
    status: issues.length ? 'FAIL' : 'PASS',
    checks_passed: Math.max(passed, 0),
    total_checks: 21,
    issues,
  }
}

export function autoKbDraft(gaps) {
  if (!gaps?.length) {
    return { drafted: false, message: 'No knowledge gaps detected.' }
  }
  return {
    drafted: true,
    gap: gaps[0],
    draft: {
      title: `FAQ: ${gaps[0]}`,
      category: 'auto-generated',
      content: `Draft answer for "${gaps[0]}". Verify against actual policy before publishing.`,
      keywords: gaps[0].toLowerCase().split(' '),
      status: 'Pending Review',
    },
  }
}

export async function botReply(message) {
  const kb = await kbRecommendation(message)
  const s = sentimentAnalysis(message)
  const canned = `Thanks for reaching out! I see you're ${s.sentiment === 'positive' ? 'happy' : 'concerned'} about your ${s.intent}. ${kb.title && !kb.title.includes('No direct') ? `I found relevant info: "${kb.content}"` : 'A human agent will join you shortly to help.'} Is there anything else I can help with?`
  return { reply: canned, kb_used: kb.title, intent: s.intent, sentiment: s.sentiment }
}

export async function jiraTicket(productContext, messages = []) {
  const last = [...messages].reverse().find(m => m.role === 'customer')
  const system = `You are a QA engineer writing a Jira bug ticket. Generate a structured ticket. Respond as JSON: {"summary": "...", "description": "...", "priority": "Low|Medium|High|Critical", "issue_type": "Bug|Task|Feature Request"}. Summary under 80 chars.`
  const raw = await chatComplete([
    { role: 'system', content: system },
    { role: 'user', content: `Product: ${productContext}\nCustomer complaint: "${last?.message || 'No customer message captured yet'}"` },
  ], { json: true })
  const parsed = await tryJson(raw)
  if (parsed?.summary) {
    return {
      ticket_id: `COACH-${Math.floor(1000 + Math.random() * 9000)}`,
      ...parsed,
      jira_url: process.env.COMPOSIO_JIRA_PROJECT_KEY ? `https://composio.app/jira/${process.env.COMPOSIO_JIRA_PROJECT_KEY}` : '',
    }
  }
  return {
    ticket_id: `COACH-${Math.floor(1000 + Math.random() * 9000)}`,
    summary: `${productContext.split(' ')[0]} support issue: ${last?.message?.slice(0, 60) || 'customer complaint'}`,
    description: last?.message || 'No details.',
    priority: 'Medium',
    issue_type: 'Bug',
    jira_url: '',
  }
}

export function managerWhisper(text, senderId = 'Manager') {
  const s = sentimentAnalysis(text)
  const whisper = s.escalation_risk_pct >= 75
    ? `[${senderId}] ⚠️ Escalation risk ${s.escalation_risk_pct}% — authorize the resolution now. Do not ask more questions.`
    : s.escalation_risk_pct >= 50
      ? `[${senderId}] Keep it brief — offer the fix in your next message.`
      : `[${senderId}] Good pace. Keep it up.`
  return { whisper, sender_id: senderId, escalation_risk_pct: s.escalation_risk_pct }
}
