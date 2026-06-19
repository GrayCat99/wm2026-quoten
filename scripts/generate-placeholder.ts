/**
 * Generates a placeholder matchdays.json with null odds (no API key needed).
 * Useful for local dev / first-time setup before the real fetch runs.
 *
 * Run: npx tsx scripts/generate-placeholder.ts
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')

interface ScheduleMatch {
  matchday: number
  group: string
  kickoffUtc: string
  teamA: string
  teamB: string
  venue: string
}

const schedule = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'data', 'schedule.json'), 'utf-8'),
) as { matches: ScheduleMatch[] }

const now = new Date().toISOString()
const matchdays: Record<string, unknown[]> = {}

for (const m of schedule.matches) {
  const md = String(m.matchday)
  if (!matchdays[md]) matchdays[md] = []
  matchdays[md].push({
    ...m,
    probA: null, probDraw: null, probB: null,
    oddsA: null, oddsDraw: null, oddsB: null,
    played: new Date(m.kickoffUtc) < new Date(now),
  })
}

const outPath = path.join(ROOT, 'public', 'data', 'matchdays.json')
fs.mkdirSync(path.dirname(outPath), { recursive: true })
fs.writeFileSync(outPath, JSON.stringify({ updatedAt: now, matchdays }, null, 2))
console.log(`Written placeholder to ${outPath}`)
