import { PROFILE_LABEL, type Profile } from '../lib/profiles'
import { cx } from '../lib/cx'

interface ProfileTagProps {
  profile: Profile
  /** Renders as a toggle instead of a plain label — used by the catalogue filters. */
  onClick?: () => void
  active?: boolean
  className?: string
}

/**
 * A book's story profile, sitting beside its category `Tag`.
 *
 * Outlined and uncoloured, deliberately. Category owns hue on this board and
 * green already means "free slot", so giving profiles their own palette would
 * either collide with a category or read as availability. The outline plus the
 * ◆ glyph separates the two axes by SHAPE, which survives both themes and works
 * for anyone who cannot tell the hues apart.
 */
export function ProfileTag({ profile, onClick, active = true, className }: ProfileTagProps) {
  const base = cx(
    't-tag inline-flex items-center gap-1.5 rounded-full border px-3 py-1 whitespace-nowrap',
    active ? 'border-line-mid text-ink-soft' : 'border-line text-ink-muted',
    className,
  )

  const content = (
    <>
      <span aria-hidden="true">◆</span>
      {PROFILE_LABEL[profile]}
    </>
  )

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-pressed={active}
        className={cx(base, 'cursor-pointer transition-opacity hover:opacity-75')}
      >
        {content}
      </button>
    )
  }

  return <span className={base}>{content}</span>
}
