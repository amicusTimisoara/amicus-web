import { Link } from 'react-router-dom'
import { CATEGORY_CLASS, CATEGORY_LABEL, type Category } from '../lib/categories'
import { cx } from '../lib/cx'

interface TagProps {
  category: Category
  /** Where the tag leads. Omit to render a plain, non-interactive label. */
  to?: string
  /** Renders as a toggle instead of a link — used by the catalogue filters. */
  onClick?: () => void
  active?: boolean
  className?: string
}

/**
 * A book's category tag, and its navigational handle: wherever a book appears,
 * its tag is the way through to the page that describes it.
 *
 * Three shapes from one component — link (`to`), toggle (`onClick`), or plain
 * label (neither) — because they must stay visually identical, and would drift
 * if they were three components.
 */
export function Tag({ category, to, onClick, active = true, className }: TagProps) {
  const style = CATEGORY_CLASS[category]
  const label = CATEGORY_LABEL[category]

  const base = cx(
    't-tag inline-flex items-center rounded-full px-3 py-1 whitespace-nowrap',
    active ? cx(style.softBg, style.text) : 'bg-sunken text-ink-muted',
    className,
  )

  if (to) {
    return (
      <Link to={to} className={cx(base, 'transition-opacity hover:opacity-75')}>
        {label}
      </Link>
    )
  }

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-pressed={active}
        className={cx(base, 'cursor-pointer transition-opacity hover:opacity-75')}
      >
        {label}
      </button>
    )
  }

  return <span className={base}>{label}</span>
}
