/**
 * Story profiles — the "whose story is this" axis, alongside the advice-domain
 * `Category` in `categories.ts`.
 *
 * The two answer different questions and are deliberately kept apart. A category
 * says what kind of advice someone gives and owns the COLOUR on the board; a
 * profile says what they lived through. A physician listed because they survived
 * a tragedy is `medical` on one axis and `Tragedie` on the other.
 *
 * Profiles carry no hue on purpose. Six category colours already collided at dot
 * size once; eleven more would be unreadable, and green is reserved for "free
 * slot". So a profile renders as a neutral outlined pill and stays legible next
 * to any category.
 *
 * Keys are the server's enum names exactly (`StoryProfile.ToString()`), so an
 * unknown value from a newer API simply renders no profile tag instead of
 * throwing.
 */
export const PROFILES = [
  'FostDependent',
  'Antreprenor',
  'Medic',
  'Refugiat',
  'FostDetinut',
  'FostAteu',
  'Tragedie',
  'Artist',
  'Psiholog',
  'Pastor',
  'FostOlimpic',
] as const

export type Profile = (typeof PROFILES)[number]

export const PROFILE_LABEL: Record<Profile, string> = {
  FostDependent: 'Fost dependent',
  Antreprenor: 'Antreprenor',
  Medic: 'Medic',
  Refugiat: 'Refugiat',
  FostDetinut: 'Fost deținut',
  FostAteu: 'Fost ateu',
  Tragedie: 'A trecut printr-o tragedie',
  Artist: 'Artist',
  Psiholog: 'Psiholog',
  Pastor: 'Pastor',
  FostOlimpic: 'Fost student olimpic',
}

const KNOWN = new Set<string>(PROFILES)

/** Narrows a raw server string, or null for absent/unrecognised values. */
export function toProfile(value: string | null | undefined): Profile | null {
  if (!value) return null
  return KNOWN.has(value) ? (value as Profile) : null
}
