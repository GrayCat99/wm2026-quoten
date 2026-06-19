const TZ = 'Europe/Berlin'

export function formatKickoff(isoUtc: string): string {
  return new Intl.DateTimeFormat('de-DE', {
    timeZone: TZ,
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(isoUtc))
}

export function formatUpdatedAt(isoUtc: string): string {
  return new Intl.DateTimeFormat('de-DE', {
    timeZone: TZ,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(isoUtc))
}
