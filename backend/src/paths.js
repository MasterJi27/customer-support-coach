import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Reusable: tries each candidate path in turn and returns the first that
// exists on disk. Any "look here, then here, then here" lookup can share
// this instead of re-writing its own existsSync loop.
export function resolveDataDir(...candidates) {
  for (const c of candidates) {
    if (c && fs.existsSync(c)) return c
  }
  return candidates[0] || null
}

// Reusable: the three places a /data sub-path could live (relative to this
// package, relative to cwd, or alongside the source). KB_DIR and every seed
// file resolve through here so that logic exists exactly once.
export function dataPath(...segments) {
  return resolveDataDir(
    path.join(__dirname, '..', 'data', ...segments),
    path.join(process.cwd(), 'data', ...segments),
    path.join(__dirname, 'data', ...segments)
  )
}

// Reusable: read-and-parse-JSON-or-null, so seed files don't each need their
// own try/catch around fs.readFileSync + JSON.parse.
export function loadSeedJson(name) {
  try {
    return JSON.parse(fs.readFileSync(dataPath(name), 'utf8'))
  } catch {
    return null
  }
}
