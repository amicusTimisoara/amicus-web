/**
 * Initials for an account that has no display name — which is every account,
 * since the API returns only an email from /auth/manage/info.
 *
 * "ana.student@amicus.ro" -> "AS", "marc@amicus.ro" -> "MA". Splits the local
 * part on the separators people actually use in addresses.
 */
export function initialsFromEmail(email: string): string {
  const local = email.split('@')[0] ?? ''
  const parts = local.split(/[._\-+]/).filter(Boolean)

  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toLocaleUpperCase('ro-RO')
  return (parts[0][0] + parts[1][0]).toLocaleUpperCase('ro-RO')
}

/** "Ana Maria Popescu" -> "AP". Falls back gracefully on single-word names. */
export function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return '?'
  if (words.length === 1) return words[0].slice(0, 2).toLocaleUpperCase('ro-RO')
  return (words[0][0] + words[words.length - 1][0]).toLocaleUpperCase('ro-RO')
}
