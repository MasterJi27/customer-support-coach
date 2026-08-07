const BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '' : 'https://coachai-backend-swart.vercel.app')

async function request(path, options = {}) {
  const token = localStorage.getItem('coachai_token')
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`
  const res = await fetch(`${BASE_URL}${path}`, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  })
  if (!res.ok) {
    let message = `API ${res.status}${res.statusText ? `: ${res.statusText}` : ''}`
    try {
      const data = await res.json()
      // FastAPI's HTTPException serializes as {"detail": "..."}, not {"error": "..."}
      const detail = data?.detail
      if (typeof detail === 'string') message = detail
      else if (Array.isArray(detail) && detail[0]?.msg) message = detail[0].msg
      else if (data?.error) message = data.error
    } catch { /* keep fallback */ }
    const err = new Error(message)
    err.status = res.status
    throw err
  }
  return res.json()
}

export const api = {
  health: () => request('/health'),
  analytics: () => request('/api/analytics'),
  reports: () => request('/api/reports'),
  knowledge: () => request('/api/knowledge'),
  hallOfFame: () => request('/api/hall-of-fame'),
  activity: () => request('/api/activity'),

  register: (name, email, password) =>
    request('/api/auth/register', { method: 'POST', body: { name, email, password } }),

  login: (email, password) =>
    request('/api/auth/login', { method: 'POST', body: { email, password } }),

  guestLogin: () =>
    request('/api/auth/guest', { method: 'POST', body: {} }),

  logout: () =>
    request('/api/auth/logout', { method: 'POST', body: {} }),

  me: () => request('/api/auth/me'),

  startSession: (opts = {}) =>
    request('/api/session/start', {
      method: 'POST',
      body: {
        mode: opts.mode || 'simulator',
        agent_name: opts.agent_name || 'Support Agent',
        product_context: opts.product_context || 'Zomato Food Delivery',
        scenario_choice: opts.scenario_choice || 'order_not_received',
        scenario_title: opts.scenario_title,
        scenario_persona: opts.scenario_persona,
      },
    }),

  sendMessage: (message, role = 'agent', sessionId) =>
    request('/api/chat/message', { method: 'POST', body: { message, role, session_id: sessionId } }),

  autopilot: (sessionId) => request('/api/chat/autopilot', { method: 'POST', body: { session_id: sessionId } }),

  managerTakeover: (message = '', sessionId) =>
    request('/api/chat/manager-takeover', { method: 'POST', body: { message, session_id: sessionId } }),

  endSession: (sessionId, recipientEmail) =>
    request('/api/chat/end', { method: 'POST', body: { session_id: sessionId, recipient_email: recipientEmail } }),

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

  sendEmail: (recipientEmail, subject, body) =>
    request('/api/gmail/send', { method: 'POST', body: { recipient_email: recipientEmail, subject, body } }),

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
