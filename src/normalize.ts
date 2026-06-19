/**
 * Canonical team name → list of aliases used by The Odds API or other sources.
 * The schedule.json `teamAliases` map is the authoritative source; this mirrors it
 * and adds runtime helpers.
 */
const ALIASES: Record<string, string[]> = {
  'United States': ['USA', 'USMNT', 'United States of America'],
  Turkey: ['Turkiye', 'Türkiye', 'Tuerkiye'],
  'Ivory Coast': ["Cote d'Ivoire", 'Cote d Ivoire', 'Cote dIvoire', "Côte d'Ivoire"],
  Iran: ['IR Iran', 'Iran (Islamic Republic of)'],
  'South Korea': ['Korea Republic', 'Republic of Korea', 'Korea, South'],
  'Cape Verde': ['Cabo Verde'],
  'DR Congo': ['Congo DR', 'Democratic Republic of the Congo', 'Congo (DR)'],
  Czechia: ['Czech Republic'],
  'Bosnia and Herzegovina': ['Bosnia', 'Bosnia-Herzegovina', 'Bosnia & Herzegovina'],
  Curacao: ['Curaçao'],
}

/** Maps every alias (lower-cased) → canonical name. */
const aliasToCanonical = new Map<string, string>()
for (const [canonical, aliases] of Object.entries(ALIASES)) {
  aliasToCanonical.set(canonical.toLowerCase(), canonical)
  for (const alias of aliases) {
    aliasToCanonical.set(alias.toLowerCase(), canonical)
  }
}

export function normalizeTeam(name: string): string {
  return aliasToCanonical.get(name.toLowerCase()) ?? name
}
