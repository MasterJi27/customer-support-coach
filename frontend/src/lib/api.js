const BASE_URL = 'https://coachai-backend-swart.vercel.app'

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: options.method || 'GET',
    headers: { 'Content-Type': 'application/json' },
    body: options.body ? JSON.stringify(options.body) : undefined,
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`API ${res.status}: ${text || res.statusText}`)
  }
  return res.json()
}

export const api = {
  health: () => request('/health'),
  analytics: () => request('/api/analytics'),
  reports: () => request('/api/reports'),
  knowledge: () => request('/api/knowledge'),
  hallOfFame: () => request('/api/hall-of-fame'),

  startSession: (opts = {}) =>
    request('/api/session/start', {
      method: 'POST',
      body: {
        mode: opts.mode || 'simulator',
        agent_name: opts.agent_name || 'Support Agent',
        product_context: opts.product_context || 'Zomato Food Delivery',
        scenario_choice: opts.scenario_choice || 'delivery_delay',
      },
    }),

  sendMessage: (message, role = 'agent', sessionId) =>
    request('/api/chat/message', { method: 'POST', body: { message, role, session_id: sessionId } }),

  autopilot: (sessionId) => request('/api/chat/autopilot', { method: 'POST', body: { session_id: sessionId } }),

  managerTakeover: (message = '', sessionId) =>
    request('/api/chat/manager-takeover', { method: 'POST', body: { message, session_id: sessionId } }),

  endSession: (sessionId) => request('/api/chat/end', { method: 'POST', body: { session_id: sessionId } }),

  viralAnalysis: (message, context = '') =>
    request('/api/analysis/viral', { method: 'POST', body: { message, context } }),

  fraudAnalysis: (message, context = '') =>
    request('/api/analysis/fraud', { method: 'POST', body: { message, context } }),

  defectionAnalysis: (message, context = '') =>
    request('/api/analysis/defection', { method: 'POST', body: { message, context } }),

  mindReader: (message, context = '') =>
    request('/api/analysis/mind-reader', { method: 'POST', body: { message, context } }),

  multiverse: (message, turnNumber = 2) =>
    request('/api/analysis/multiverse', { method: 'POST', body: { message, turn_number: turnNumber } }),

  patience: (message, currentTurn = 1, sessionId) =>
    request('/api/analysis/patience', { method: 'POST', body: { message, current_turn: currentTurn, session_id: sessionId } }),

  cognitiveLoad: (message, context = '', sessionId) =>
    request('/api/analysis/cognitive-load', { method: 'POST', body: { message, context, session_id: sessionId } }),

  compliance: (sessionId) => request('/api/analysis/compliance', { method: 'POST', body: { session_id: sessionId } }),

  tonePolish: (draft, customerMessage = '') =>
    request('/api/analysis/tone', { method: 'POST', body: { draft, customer_message: customerMessage } }),

  scenario: (productContext = 'Zomato - Food Delivery App', difficulty = 'challenging') =>
    request('/api/analysis/scenario', { method: 'POST', body: { product_context: productContext, difficulty } }),

  qaAudit: (sessionId) => request('/api/analysis/qa-audit', { method: 'POST', body: { session_id: sessionId } }),

  autoKb: (sessionId) => request('/api/analysis/auto-kb', { method: 'POST', body: { session_id: sessionId } }),

  botReply: (message, sessionId) => request('/api/bot/reply', { method: 'POST', body: { message, session_id: sessionId } }),

  jiraTicket: (productContext = 'Zomato - Food Delivery App', sessionId) =>
    request('/api/jira/ticket', { method: 'POST', body: { product_context: productContext, session_id: sessionId } }),

  survivalStart: () => request('/api/survival/start', { method: 'POST', body: {} }),

  survivalTurn: (ticketIndex, replyText, turnTimeSeconds = 0) =>
    request('/api/survival/turn', {
      method: 'POST',
      body: { ticket_index: ticketIndex, reply_text: replyText, turn_time_seconds: turnTimeSeconds },
    }),

  managerWhisper: (text, senderId = 'Manager', sessionId) =>
    request('/api/manager/whisper', { method: 'POST', body: { text, sender_id: senderId, session_id: sessionId } }),
}

export default api
