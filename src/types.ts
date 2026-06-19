export interface MatchOdds {
  matchday: number
  group: string
  kickoffUtc: string
  teamA: string
  teamB: string
  venue: string
  /** Rounded probabilities (sum = 100) */
  probA: number | null
  probDraw: number | null
  probB: number | null
  /** Raw median decimal odds used for the calculation */
  oddsA: number | null
  oddsDraw: number | null
  oddsB: number | null
  played: boolean
}

export interface MatchdaysData {
  updatedAt: string
  matchdays: {
    [matchday: string]: MatchOdds[]
  }
}
