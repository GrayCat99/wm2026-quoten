import { useState, useEffect } from 'react'
import type { MatchdaysData } from './types'

type State =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ok'; data: MatchdaysData }

export function useMatchdays(): State {
  const [state, setState] = useState<State>({ status: 'loading' })

  useEffect(() => {
    const url = './data/matchdays.json'
    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json() as Promise<MatchdaysData>
      })
      .then((data) => setState({ status: 'ok', data }))
      .catch((e: unknown) =>
        setState({
          status: 'error',
          message: e instanceof Error ? e.message : String(e),
        }),
      )
  }, [])

  return state
}
