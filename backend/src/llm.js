import 'dotenv/config'

const OPENROUTER = 'https://openrouter.ai/api/v1'
const GROQ = 'https://api.groq.com/openai/v1'

const MODEL_CHAIN = [
  process.env.OPENROUTER_MODEL || 'nvidia/nemotron-3-super-120b-a12b:free',
  'meta-llama/llama-3.3-70b-instruct:free',
  'google/gemma-4-26b-a4b-it:free',
]

function firstAvailable(key) {
  return key && key.length > 10 && !key.includes('xxxx')
}

export async function chatComplete(messages, { json = false } = {}) {
  const azure = await azureChatComplete(messages, json)
  if (azure) return azure
  const body = {
    model: MODEL_CHAIN[0],
    messages,
    temperature: 0.4,
    max_tokens: 1200,
    ...(json ? { response_format: { type: 'json_object' } } : {}),
  }

  if (firstAvailable(process.env.OPENROUTER_API_KEY)) {
    try {
      const res = await fetch(`${OPENROUTER}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'HTTP-Referer': 'https://coachai.local',
          'X-Title': 'CoachAI',
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(60000),
      })
      if (res.ok) {
        const data = await res.json()
        return data.choices?.[0]?.message?.content?.trim() ?? null
      }
    } catch { /* fall through */ }
  }

  if (firstAvailable(process.env.GROQ_API_KEY)) {
    try {
      const res = await fetch(`${GROQ}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({ ...body, model: 'llama-3.3-70b-versatile' }),
        signal: AbortSignal.timeout(60000),
      })
      if (res.ok) {
        const data = await res.json()
        return data.choices?.[0]?.message?.content?.trim() ?? null
      }
    } catch { /* fall through */ }
  }

  return null
}

async function azureChatComplete(messages, json) {
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT
  const key = process.env.AZURE_OPENAI_KEY
  const model = process.env.AZURE_OPENAI_DEPLOYMENT
  if (!endpoint || !firstAvailable(key) || !model) return null
  try {
    const system = messages.filter(m => m.role === 'system').map(m => m.content).join('\n')
    const input = messages
      .filter(m => m.role !== 'system')
      .map(m => ({ role: m.role, content: m.content }))
    if (json && input.length) {
      input[input.length - 1].content = `${input[input.length - 1].content}\n\nReply in JSON format only.`
    }
    const body = {
      model,
      ...(system ? { instructions: system } : {}),
      input: input.length ? input : 'Say hello.',
      temperature: 0.4,
      max_output_tokens: 1200,
    }
    if (json) body.text = { format: { type: 'json_object' } }
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': key,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(45000),
    })
    if (res.ok) {
      const data = await res.json()
      const text = data.output?.[0]?.content?.[0]?.text ?? data.output_text ?? null
      return text?.trim() ?? null
    }
  } catch { /* fall through to next provider */ }
  return null
}

export async function embed(text) {
  const models = [
    process.env.OPENROUTER_EMBED_MODEL || 'nvidia/llama-nemotron-embed-vl-1b-v2:free',
    'nvidia/nemotron-3-embed-1b:free',
  ]
  if (!firstAvailable(process.env.OPENROUTER_API_KEY)) return null
  for (const model of models) {
    try {
    const res = await fetch(`${OPENROUTER}/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      },
      body: JSON.stringify({ model, input: text.slice(0, 8000) }),
      signal: AbortSignal.timeout(60000),
    })
      if (res.ok) {
        const data = await res.json()
        const emb = data.data?.[0]?.embedding
        if (Array.isArray(emb) && emb.length > 0) return emb
      }
    } catch { /* try next model */ }
  }
  return null
}

export async function embedBatch(texts, concurrency = 8) {
  const out = new Array(texts.length)
  let i = 0
  const workers = Array.from({ length: concurrency }, async () => {
    while (i < texts.length) {
      const idx = i++
      out[idx] = await embed(texts[idx])
    }
  })
  await Promise.all(workers)
  return out
}

export function cosine(a, b) {
  if (!a || !b || a.length !== b.length) return 0
  let dot = 0, na = 0, nb = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    na += a[i] * a[i]
    nb += b[i] * b[i]
  }
  if (na === 0 || nb === 0) return 0
  return dot / (Math.sqrt(na) * Math.sqrt(nb))
}

export async function tryJson(content) {
  if (!content) return null
  try {
    return JSON.parse(content)
  } catch {
    const m = content.match(/\{[\s\S]*\}/)
    if (m) {
      try { return JSON.parse(m[0]) } catch { return null }
    }
    return null
  }
}
