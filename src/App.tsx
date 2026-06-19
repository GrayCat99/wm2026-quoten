import { useState } from 'react'
import { useMatchdays } from './useMatchdays'
import { MatchRow } from './MatchRow'
import { formatUpdatedAt } from './formatDate'

const MATCHDAY_LABELS: Record<string, string> = {
  '1': 'Spieltag 1 (Gruppenphase)',
  '2': 'Spieltag 2 (Gruppenphase)',
  '3': 'Spieltag 3 (Gruppenphase)',
}

export default function App() {
  const [selectedMatchday, setSelectedMatchday] = useState<string>('1')
  const state = useMatchdays()

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-4 shadow-sm">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-xl font-bold text-gray-900">
            WM 2026 – Wettmarkt-Wahrscheinlichkeiten
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Marktbereinigte Wahrscheinlichkeiten aus aktuellen Buchmacher-Quoten (Vig herausgerechnet)
          </p>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-6">
        {/* Dropdown */}
        <div className="flex items-center gap-3 mb-6">
          <label htmlFor="matchday-select" className="text-sm font-medium text-gray-700">
            Spieltag:
          </label>
          <select
            id="matchday-select"
            value={selectedMatchday}
            onChange={(e) => setSelectedMatchday(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-1.5 text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {['1', '2', '3'].map((md) => (
              <option key={md} value={md}>
                {MATCHDAY_LABELS[md]}
              </option>
            ))}
          </select>
        </div>

        {/* States */}
        {state.status === 'loading' && (
          <div className="text-center py-16 text-gray-400">Daten werden geladen…</div>
        )}

        {state.status === 'error' && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-red-700 text-sm">
            <strong>Fehler beim Laden:</strong> {state.message}
            <p className="mt-1 text-red-500">
              Bitte sicherstellen, dass <code>public/data/matchdays.json</code> vorhanden ist
              (GitHub Actions Workflow ausführen).
            </p>
          </div>
        )}

        {state.status === 'ok' && (() => {
          const matches = state.data.matchdays[selectedMatchday] ?? []

          if (matches.length === 0) {
            return (
              <div className="text-center py-16 text-gray-400">
                Keine Spiele für diesen Spieltag gefunden.
              </div>
            )
          }

          return (
            <>
              {/* Notice */}
              <div className="mb-4 rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800">
                <strong>Hinweis:</strong> Die Prozentwerte sind marktbereinigte Wahrscheinlichkeiten
                aus Buchmacher-Quoten. Sie stellen keinen eigenen Vorhersage-Vorteil dar und sind
                keine Garantie für Spielausgänge.
              </div>

              {/* Table */}
              <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Datum (MEZ)
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Spiel
                      </th>
                      <th className="px-3 py-2 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Sieg A
                      </th>
                      <th className="px-3 py-2 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Remis
                      </th>
                      <th className="px-3 py-2 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Sieg B
                      </th>
                      <th className="px-3 py-2 w-8" />
                    </tr>
                  </thead>
                  <tbody>
                    {matches.map((m) => (
                      <MatchRow
                        key={`${m.teamA}-${m.teamB}-${m.kickoffUtc}`}
                        match={m}
                      />
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Timestamp */}
              <p className="mt-3 text-xs text-gray-400 text-right">
                Stand: {formatUpdatedAt(state.data.updatedAt)} Uhr (MEZ)
              </p>
            </>
          )
        })()}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white px-4 py-4 text-center text-xs text-gray-400">
        <p>
          Quoten-Quelle: The Odds API · Anzeige rein informativ · Keine Wettfunktion
        </p>
        <p className="mt-1">
          <strong>18+</strong> · Glücksspiel kann süchtig machen.
          Hilfe: <a href="https://www.bzga.de/" className="underline">bzga.de</a> ·
          Verantwortungsvolles Spielen:{' '}
          <a href="https://www.check-dein-spiel.de/" className="underline">check-dein-spiel.de</a>
        </p>
      </footer>
    </div>
  )
}
