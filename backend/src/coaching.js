import * as agents from './agents.js'
import { rand } from './scenarios.js'
import { pushCustomerMessage } from './sessionStore.js'

export async function customerReply(session, lastAgentMsg) {
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

// The core coaching step: read the customer's message, pull a KB match,
// score risk signals, and package everything the frontend needs for one
// turn (suggested reply + all the coaching-rail numbers).
export async function coachTurn(session, customerMsg) {
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

// Reusable: "get the customer's next line and record it in the transcript"
// happens after every agent turn — manual reply, autopilot, and manager
// takeover all called this same two-line sequence before. Now it's one
// call, so all three flows stay in sync automatically.
export async function advanceCustomer(session, lastAgentMsg) {
  const custReply = await customerReply(session, lastAgentMsg)
  pushCustomerMessage(session, custReply)
  return custReply
}
