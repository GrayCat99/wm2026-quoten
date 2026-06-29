/**
 * Fetch live odds from The Odds API, join with schedule.json,
 * calculate vig-adjusted probabilities, and write public/data/matchdays.json.
 *
 * Run via:  npx tsx scripts/fetch-odds.ts
 * Requires: ODDS_API_KEY environment variable
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { calcProbabilities, median } from '../src/calc.ts'
import { normalizeTeam } from '../src/normalize.ts'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')

// ── Types ────────────────────────────────────────────────────────────────────

interface ScheduleMatch {
  matchday: number
  group: string
  kickoffUtc: string
  teamA: string
  teamB: string
  venue: string
}

interface ScheduleFile {
  matches: ScheduleMatch[]
}

interface OddsApiOutcome {
  name: string
  price: number
}

interface OddsApiMarket {
  key: string
  outcomes: OddsApiOutcome[]
}

interface OddsApiBookmaker {
  key: string
  markets: OddsApiMarket[]
}

interface OddsApiEvent {
  id: string
  sport_key: string
  commence_time: string
  home_team: string
  away_team: string
  bookmakers: OddsApiBookmaker[]
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function sameDay(a: string, b: string): boolean {
  return a.slice(0, 10) === b.slice(0, 10)
}

/** Returns all h2h decimal odds for a given outcome name from all bookmakers. */
function collectOdds(bookmakers: OddsApiBookmaker[], teamName: string): number[] {
  const result: number[] = []
  for (const bm of bookmakers) {
    const market = bm.markets.find((m) => m.key === 'h2h')
    if (!market) continue
    const outcome = market.outcomes.find(
      (o) => normalizeTeam(o.name) === normalizeTeam(teamName),
    )
    if (outcome) result.push(outcome.price)
  }
  return result
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const apiKey = process.env.ODDS_API_KEY
  if (!apiKey) {
    console.error('Missing ODDS_API_KEY environment variable')
    process.exit(1)
  }

  // Load schedule
  const scheduleRaw = fs.readFileSync(path.join(ROOT, 'data', 'schedule.json'), 'utf-8')
  const schedule: ScheduleFile = JSON.parse(scheduleRaw)

  // Fetch odds
  // Alle vier Regionen → 20-30 Buchmacher → robusterer Median
  const url =
    `https://api.the-odds-api.com/v4/sports/soccer_fifa_world_cup/odds/` +
    `?apiKey=${apiKey}&regions=eu,uk,us,au&markets=h2h&oddsFormat=decimal`

  console.log('Fetching odds from The Odds API…')
  const res = await fetch(url)
  if (!res.ok) {
    console.error(`API error ${res.status}: ${await res.text()}`)
    process.exit(1)
  }
  const events: OddsApiEvent[] = await res.json() as OddsApiEvent[]
  console.log(`Received ${events.length} events`)

  const now = new Date().toISOString()

  // Build lookup: "normA|normB|date" → event
  const eventMap = new Map<string, OddsApiEvent>()
  for (const ev of events) {
    const normHome = normalizeTeam(ev.home_team)
    const normAway = normalizeTeam(ev.away_team)
    const day = ev.commence_time.slice(0, 10)
    // Index both orderings
    eventMap.set(`${normHome}|${normAway}|${day}`, ev)
    eventMap.set(`${normAway}|${normHome}|${day}`, ev)
  }

  // Process each match
  type MatchOdds = {
    matchday: number; group: string; kickoffUtc: string
    teamA: string; teamB: string; venue: string
    probA: number | null; probDraw: number | null; probB: number | null
    oddsA: number | null; oddsDraw: number | null; oddsB: number | null
    played: boolean
  }

  const matchdayMap: Record<string, MatchOdds[]> = {}

  for (const match of schedule.matches) {
    const normA = normalizeTeam(match.teamA)
    const normB = normalizeTeam(match.teamB)
    const day = match.kickoffUtc.slice(0, 10)

    // Try same-day lookup (schedule day may differ slightly from API commence_time)
    let event = eventMap.get(`${normA}|${normB}|${day}`)
    if (!event) {
      // Fallback: search by team names ignoring date
      event = events.find((ev) => {
        const h = normalizeTeam(ev.home_team)
        const a = normalizeTeam(ev.away_team)
        return (h === normA && a === normB) || (h === normB && a === normA)
      })
    }

    const played = new Date(match.kickoffUtc) < new Date(now)

    let probA: number | null = null
    let probDraw: number | null = null
    let probB: number | null = null
    let oddsA: number | null = null
    let oddsDraw: number | null = null
    let oddsB: number | null = null

    if (event && event.bookmakers.length > 0) {
      const isSwapped =
        normalizeTeam(event.home_team) === normB &&
        normalizeTeam(event.away_team) === normA

      const rawHome = collectOdds(event.bookmakers, event.home_team)
      const rawDraw = collectOdds(event.bookmakers, 'Draw')
      const rawAway = collectOdds(event.bookmakers, event.away_team)

      if (rawHome.length && rawDraw.length && rawAway.length) {
        const mHome = median(rawHome)
        const mDraw = median(rawDraw)
        const mAway = median(rawAway)

        const [pHome, pDraw, pAway] = calcProbabilities(mHome, mDraw, mAway)

        if (isSwapped) {
          probA = pAway; probB = pHome
          oddsA = mAway; oddsB = mHome
        } else {
          probA = pHome; probB = pAway
          oddsA = mHome; oddsB = mAway
        }
        probDraw = pDraw
        oddsDraw = mDraw
      }
    }

    const md = String(match.matchday)
    if (!matchdayMap[md]) matchdayMap[md] = []
    matchdayMap[md].push({
      matchday: match.matchday,
      group: match.group,
      kickoffUtc: match.kickoffUtc,
      teamA: match.teamA,
      teamB: match.teamB,
      venue: match.venue,
      probA, probDraw, probB,
      oddsA, oddsDraw, oddsB,
      played,
    })
  }

  const output = { updatedAt: now, matchdays: matchdayMap }
  const outPath = path.join(ROOT, 'public', 'data', 'matchdays.json')
  const newContent = JSON.stringify(output, null, 2)

  // Only write if changed (avoids spurious commits in CI)
  let changed = true
  if (fs.existsSync(outPath)) {
    const existing = JSON.parse(fs.readFileSync(outPath, 'utf-8'))
    const existingNoTs = { ...existing, updatedAt: '' }
    const newNoTs = { ...output, updatedAt: '' }
    changed = JSON.stringify(existingNoTs) !== JSON.stringify(newNoTs)
  }

  if (changed) {
    fs.writeFileSync(outPath, newContent)
    console.log(`Written ${outPath}`)
  } else {
    // Still update timestamp so the UI shows fresh "Stand"
    fs.writeFileSync(outPath, newContent)
    console.log('Odds unchanged; timestamp updated.')
  }
}

main().catch((e) => { console.error(e); process.exit(1) })
