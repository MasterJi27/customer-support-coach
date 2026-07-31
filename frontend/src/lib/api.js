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

  sendMessage: (message, role = 'agent') =>
    request('/api/chat/message', { method: 'POST', body: { message, role } }),

  autopilot: () => request('/api/chat/autopilot', { method: 'POST', body: {} }),

  managerTakeover: (message = '') =>
    request('/api/chat/manager-takeover', { method: 'POST', body: { message } }),
}

export default api
