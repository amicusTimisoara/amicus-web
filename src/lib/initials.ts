/** "Ana Maria Popescu" -> "AP". Falls back gracefully on single-word names. */
export function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return '?'
  if (words.length === 1) return words[0].slice(0, 2).toLocaleUpperCase('ro-RO')
  return (words[0][0] + words[words.length - 1][0]).toLocaleUpperCase('ro-RO')
}
