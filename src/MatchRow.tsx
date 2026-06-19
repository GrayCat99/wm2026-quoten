import { useState } from 'react'
import type { MatchOdds } from './types'
import { formatKickoff } from './formatDate'

interface Props {
  match: MatchOdds
}

function ProbCell({ value, highlight }: { value: number | null; highlight?: boolean }) {
  if (value === null) return <td className="px-3 py-2 text-center text-gray-400">—</td>
  return (
    <td
      className={`px-3 py-2 text-center font-medium tabular-nums ${
        highlight ? 'text-emerald-700 font-semibold' : 'text-gray-700'
      }`}
    >
      {value} %
    </td>
  )
}

export function MatchRow({ match }: Props) {
  const [expanded, setExpanded] = useState(false)
  const hasOdds = match.probA !== null

  const maxProb =
    hasOdds ? Math.max(match.probA ?? 0, match.probDraw ?? 0, match.probB ?? 0) : -1

  const dimClass = match.played ? 'opacity-50' : ''

  return (
    <>
      <tr
        className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${dimClass}`}
        title={match.venue}
      >
        <td className="px-3 py-2 text-sm text-gray-500 whitespace-nowrap">
          {formatKickoff(match.kickoffUtc)}
          {match.played && (
            <span className="ml-1 text-xs bg-gray-200 text-gray-500 rounded px-1">gespielt</span>
          )}
        </td>
        <td className="px-3 py-2">
          <div className="flex items-center gap-1">
            <span className="font-medium text-gray-900">{match.teamA}</span>
            <span className="text-gray-400 text-xs">vs</span>
            <span className="font-medium text-gray-900">{match.teamB}</span>
            <span className="ml-1 text-xs text-gray-400">({match.group})</span>
          </div>
        </td>

        <ProbCell value={match.probA} highlight={match.probA === maxProb && maxProb >= 0} />
        <ProbCell value={match.probDraw} highlight={match.probDraw === maxProb && maxProb >= 0} />
        <ProbCell value={match.probB} highlight={match.probB === maxProb && maxProb >= 0} />

        <td className="px-2 py-2 text-center">
          {hasOdds && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
              title="Quoten anzeigen"
            >
              {expanded ? '▲' : '▼'}
            </button>
          )}
        </td>
      </tr>

      {expanded && hasOdds && (
        <tr className={`bg-gray-50 border-b border-gray-100 text-xs text-gray-500 ${dimClass}`}>
          <td />
          <td className="px-3 pb-2 pt-1 italic text-gray-400">Dezimalquoten (Median)</td>
          <td className="px-3 pb-2 pt-1 text-center">{match.oddsA?.toFixed(2)}</td>
          <td className="px-3 pb-2 pt-1 text-center">{match.oddsDraw?.toFixed(2)}</td>
          <td className="px-3 pb-2 pt-1 text-center">{match.oddsB?.toFixed(2)}</td>
          <td />
        </tr>
      )}
    </>
  )
}
