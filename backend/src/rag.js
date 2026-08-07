import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { embed, embedBatch, cosine } from './llm.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const KB_DIR = process.env.KB_DIR || path.join(__dirname, '..', 'data', 'knowledge_base')

let chunksCache = null
let embeddingCache = null
let embeddingJob = null
let embeddingStatus = 'not_attempted' // 'ok' | 'failed' | 'partial'

async function computeEmbeddings() {
  if (embeddingJob) return embeddingJob
  embeddingJob = (async () => {
    const chunks = loadChunks()
    const vecs = await embedBatch(chunks.map(c => c.text))
    if (vecs.some(Boolean)) embeddingCache = vecs
    return vecs
  })()
  try {
    return await embeddingJob
  } finally {
    embeddingJob = null
  }
}

function loadChunks() {
  if (chunksCache) return chunksCache
  if (!fs.existsSync(KB_DIR)) return []
  chunksCache = []
  for (const f of fs.readdirSync(KB_DIR)) {
    if (!f.endsWith('.json')) continue
    try {
      const doc = JSON.parse(fs.readFileSync(path.join(KB_DIR, f), 'utf8'))
      const content = doc.content || ''
      const title = doc.title || f.replace(/\.json$/, '')
      const keywords = doc.keywords || []
      const category = doc.category || ''
      const sentences = content
        .split(/(?<=[.!?])\s+|\n/)
        .map(s => s.trim())
        .filter(s => s.length > 40)
      for (const s of sentences) {
        chunksCache.push({
          doc_id: f,
          title,
          category,
          keywords,
          text: s,
          doc: content,
        })
      }
    } catch { /* skip corrupt */ }
  }
  return chunksCache
}

function tokenize(text) {
  return (text.toLowerCase().match(/[a-z0-9]+/g) || []).filter(w => w.length > 2)
}

function tf(doc) {
  const tokens = tokenize(doc)
  const map = {}
  for (const t of tokens) map[t] = (map[t] || 0) + 1
  return map
}

export function bm25(query, chunks) {
  const qTokens = tokenize(query)
  if (!qTokens.length) return []
  const N = chunks.length
  const idf = {}
  for (const t of qTokens) {
    const df = chunks.filter(c => tf(c.text)[t]).length
    idf[t] = Math.log(1 + (N - df + 0.5) / (df + 0.5))
  }
  const k1 = 1.2
  const b = 0.75
  const scored = chunks.map((c, i) => {
    const ctf = tf(c.text)
    const len = tokenize(c.text).length || 1
    const avgLen = chunks.reduce((s, x) => s + (tokenize(x.text).length || 1), 0) / Math.max(N, 1)
    let score = 0
    for (const t of qTokens) {
      const f = ctf[t] || 0
      if (f === 0) continue
      score += idf[t] * ((f * (k1 + 1)) / (f + k1 * (1 - b + b * (len / avgLen))))
    }
    return { chunk: c, index: i, score }
  })
  return scored
    .filter(r => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
}

export async function searchKB(query, topK = 3) {
  const chunks = loadChunks()
  if (!chunks.length) return []

  const qv = await embed(query)
  let results = []

  if (qv) {
    let vecs = embeddingCache
    if (!vecs) {
      vecs = await computeEmbeddings()
    }
    const scored = chunks.map((c, i) => {
      const sim = vecs[i] ? cosine(qv, vecs[i]) : 0
      return { chunk: c, index: i, score: sim }
    })
    results = scored
      .filter(r => r.score > 0.2)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
    embeddingStatus = results.length ? 'ok' : 'failed'
  }

  if (!results.length) {
    const bm = bm25(query, chunks)
    results = bm.slice(0, topK).map(r => ({ chunk: r.chunk, index: r.index, score: r.score / 100 }))
    embeddingStatus = qv ? 'partial' : 'not_attempted'
  }

  return results.map(r => ({
    title: r.chunk.title,
    category: r.chunk.category,
    keywords: r.chunk.keywords || [],
    content: r.chunk.text,
    source: r.chunk.doc_id,
    score: Math.round(r.score * 100) / 100,
  }))
}

export function getEmbeddingStatus() {
  return embeddingStatus
}

export function resetCache() {
  chunksCache = null
  embeddingCache = null
  embeddingJob = null
}

export async function ingestAll() {
  const chunks = loadChunks()
  const vecs = await computeEmbeddings()
  return { chunks: chunks.length, embedded: vecs.filter(Boolean).length }
}
