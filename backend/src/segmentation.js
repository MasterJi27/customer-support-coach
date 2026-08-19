const DEFAULT_DICTIONARY = {
  frustration: ['angry', 'furious', 'ridiculous', 'unacceptable', 'fed up', 'tired of', 'terrible', 'awful', 'horrible', 'worst', 'annoyed', 'frustrated', 'rage', 'sick of', 'never again'],
  intensifiers: ['very', 'really', 'extremely', 'totally'],
  urgent: ['immediately', 'right now', 'asap', 'urgent', 'now', 'refund', 'lawsuit', 'legal', 'chargeback', 'complaint', 'escalate', 'manager', 'police', 'court'],
  churn: ['switch', 'cancel', 'leaving', 'competitor', 'alternative', 'goodbye', 'never come back', 'another app', 'uninstall', 'delete account'],
  threat: ['post', 'tweet', 'social media', 'twitter', 'instagram', 'share this', 'viral', 'review', 'publicly', 'newspaper', 'media'],
  intents: [
    { id: 'refund_request', words: ['refund', 'money back'] },
    { id: 'cancellation', words: ['cancel', 'unsubscribe'] },
    { id: 'order_issue', words: ['missing', 'wrong order'] },
    { id: 'billing_dispute', words: ['billing', 'charged', 'double'] },
    { id: 'escalation', words: ['complaint', 'lawsuit'] },
  ],
}

function mergeDicts(base, overrides) {
  const out = { ...base }
  for (const key of Object.keys(base)) {
    if (Array.isArray(base[key]) && Array.isArray(overrides?.[key])) {
      out[key] = [...new Set([...base[key], ...overrides[key]])]
    } else if (overrides?.[key] !== undefined) {
      out[key] = overrides[key]
    }
  }
  return out
}

export function createSegmenter(dictionary = {}) {
  const dict = mergeDicts(DEFAULT_DICTIONARY, dictionary)

  function scoreFrustration(text) {
    const lower = text.toLowerCase()
    let frustration = 0
    for (const w of dict.frustration) if (lower.includes(w)) frustration += 0.22
    for (const w of dict.intensifiers) if (lower.includes(w)) frustration += 0.1
    const exclamations = (lower.match(/!/g) || []).length
    const caps = (text.match(/[A-Z]/g) || []).length
    if (exclamations >= 2) frustration += 0.1
    if (text.length > 10 && caps / text.length > 0.25) frustration += 0.15
    return Math.min(0.97, frustration + 0.25)
  }

  function detectIntent(lower) {
    for (const intent of dict.intents) {
      if (intent.words.some(w => lower.includes(w))) return intent.id
    }
    return 'query'
  }

  function segmentCustomer(text) {
    const lower = text.toLowerCase()
    const frustration = scoreFrustration(text)

    let sentiment = 'negative'
    if (frustration < 0.35) sentiment = 'neutral'
    if (frustration < 0.2) sentiment = 'positive'

    const intent = detectIntent(lower)
    const urgent = dict.urgent.some(w => lower.includes(w))
    const churn = dict.churn.some(w => lower.includes(w))
    const threat = dict.threat.some(w => lower.includes(w))

    const escalationRisk = Math.min(0.98, 0.25 + frustration * 0.5 + (urgent ? 0.2 : 0) + (threat ? 0.25 : 0))
    const churnRisk = Math.min(0.95, 0.1 + frustration * 0.4 + (churn ? 0.4 : 0))

    return {
      segment: intent,
      sentiment,
      frustration_pct: Math.round(frustration * 100),
      intent,
      urgent: urgent ? 'Yes' : 'No',
      escalation_risk_pct: Math.round(escalationRisk * 100),
      churn_risk_pct: Math.round(churnRisk * 100),
      viral_threat: threat ? 'High' : 'Low',
    }
  }

  return { segmentCustomer, scoreFrustration, detectIntent }
}

export const customerSegmenter = createSegmenter()
export const sentimentAnalysis = customerSegmenter.segmentCustomer