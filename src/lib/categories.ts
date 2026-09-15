/**
 * Book categories — the "what kind of book is this" axis of the calendar.
 *
 * The backend has no category field: a specialist carries a free-text
 * `Specialty` ("Avocat", "Medic de familie", "Pastor"). So the mapping from that
 * string to one of our six categories lives here, on the client, and is
 * deliberately forgiving — an unrecognised specialty still renders, it just
 * lands in `social`. If categories ever become first-class on the server, this
 * file is the only thing that changes.
 */

export const CATEGORIES = [
  'spiritual',
  'mentorat',
  'medical',
  'juridic',
  'cariera',
  'social',
] as const

export type Category = (typeof CATEGORIES)[number]

export const CATEGORY_LABEL: Record<Category, string> = {
  spiritual: 'Spiritual',
  mentorat: 'Mentorat',
  medical: 'Medical',
  juridic: 'Juridic',
  cariera: 'Carieră',
  social: 'Social',
}

/**
 * Tailwind scans source statically, so class names cannot be assembled at
 * runtime — `bg-cat-${slug}` compiles to nothing. Every class is spelled out.
 */
export const CATEGORY_CLASS: Record<
  Category,
  { text: string; softBg: string; border: string; solidBg: string }
> = {
  spiritual: {
    text: 'text-cat-spiritual',
    softBg: 'bg-cat-spiritual-soft',
    border: 'border-cat-spiritual',
    solidBg: 'bg-cat-spiritual',
  },
  mentorat: {
    text: 'text-cat-mentorat',
    softBg: 'bg-cat-mentorat-soft',
    border: 'border-cat-mentorat',
    solidBg: 'bg-cat-mentorat',
  },
  medical: {
    text: 'text-cat-medical',
    softBg: 'bg-cat-medical-soft',
    border: 'border-cat-medical',
    solidBg: 'bg-cat-medical',
  },
  juridic: {
    text: 'text-cat-juridic',
    softBg: 'bg-cat-juridic-soft',
    border: 'border-cat-juridic',
    solidBg: 'bg-cat-juridic',
  },
  cariera: {
    text: 'text-cat-cariera',
    softBg: 'bg-cat-cariera-soft',
    border: 'border-cat-cariera',
    solidBg: 'bg-cat-cariera',
  },
  social: {
    text: 'text-cat-social',
    softBg: 'bg-cat-social-soft',
    border: 'border-cat-social',
    solidBg: 'bg-cat-social',
  },
}

/**
 * Order matters: the first match wins, so more specific phrases come first.
 * "Asistent social" must be tested before the bare `asistent` that means a
 * medical assistant, or social workers silently become medics.
 */
const RULES: ReadonlyArray<readonly [Category, readonly string[]]> = [
  ['social', ['asistent social', 'lucrator social', 'lucrător social', 'voluntar', 'ong']],
  ['spiritual', ['pastor', 'spiritual', 'teolog', 'capelan', 'duhovnic', 'credin']],
  ['medical', ['medic', 'doctor', 'asistent', 'psiholog', 'psihiatru', 'terapeut', 'sanatate', 'sănătate']],
  ['juridic', ['avocat', 'jurist', 'juridic', 'drept', 'notar', 'procuror']],
  ['cariera', ['carier', 'antreprenor', 'contabil', 'econom', 'inginer', 'programator', 'recrut', 'hr']],
  ['mentorat', ['mentor', 'coach', 'profesor', 'invat', 'învăț', 'student', 'consilier']],
]

/** Strips Romanian diacritics so "Sănătate" and "Sanatate" match the same rule. */
function fold(value: string): string {
  return value
    .toLocaleLowerCase('ro-RO')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
}

export function toCategory(specialty: string | null | undefined): Category {
  if (!specialty) return 'social'
  const needle = fold(specialty)

  for (const [category, keywords] of RULES) {
    for (const keyword of keywords) {
      if (needle.includes(fold(keyword))) return category
    }
  }
  return 'social'
}
