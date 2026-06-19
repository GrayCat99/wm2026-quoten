/**
 * Converts decimal odds to market-fair probabilities by removing the vig (overround).
 *
 * Steps:
 *  1. implied_i   = 1 / decimal_i       (raw implied probability)
 *  2. overround   = sum of all implied_i  (> 1.0 due to bookmaker margin)
 *  3. prob_i      = implied_i / overround (normalised, sums to 1.0)
 *  4. Round to integers; add rounding remainder to the largest value so sum = 100.
 */
export function calcProbabilities(
  dHome: number,
  dDraw: number,
  dAway: number,
): [number, number, number] {
  const impHome = 1 / dHome
  const impDraw = 1 / dDraw
  const impAway = 1 / dAway
  const overround = impHome + impDraw + impAway

  const rawHome = (impHome / overround) * 100
  const rawDraw = (impDraw / overround) * 100
  const rawAway = (impAway / overround) * 100

  const rHome = Math.round(rawHome)
  const rDraw = Math.round(rawDraw)
  const rAway = Math.round(rawAway)

  const diff = 100 - (rHome + rDraw + rAway)
  if (diff === 0) return [rHome, rDraw, rAway]

  // Add the rounding remainder to whichever value has the largest fractional part.
  const fracs: [number, number][] = [
    [rawHome - rHome, 0],
    [rawDraw - rDraw, 1],
    [rawAway - rAway, 2],
  ]
  // Sort descending by fractional part (for positive diff) or ascending (negative).
  fracs.sort((a, b) => (diff > 0 ? b[0] - a[0] : a[0] - b[0]))
  const result = [rHome, rDraw, rAway]
  for (let i = 0; i < Math.abs(diff); i++) {
    result[fracs[i][1]] += Math.sign(diff)
  }
  return [result[0], result[1], result[2]]
}

/** Returns the median value of a sorted or unsorted array of numbers. */
export function median(values: number[]): number {
  if (values.length === 0) throw new Error('empty array')
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2
}
