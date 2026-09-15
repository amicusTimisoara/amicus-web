import { CATEGORY_CLASS, CATEGORY_LABEL, type Category } from '../lib/categories'
import { cx } from '../lib/cx'

interface DotProps {
  category: Category
  /** Solid when taken, hollow when free. */
  taken: boolean
  className?: string
}

/**
 * The calendar mark. It carries two facts at once: hue says which kind of book,
 * fill says whether the slot is still open.
 *
 * Decorative by default — the day cell it sits in announces the same information
 * in words, so repeating it here would make screen readers read every dot twice.
 */
export function Dot({ category, taken, className }: DotProps) {
  const style = CATEGORY_CLASS[category]
  return (
    <span
      aria-hidden="true"
      title={`${CATEGORY_LABEL[category]} — ${taken ? 'ocupat' : 'liber'}`}
      className={cx(
        'inline-block size-3 shrink-0 rounded-full border-[1.5px]',
        style.border,
        taken ? style.solidBg : 'bg-transparent',
        className,
      )}
    />
  )
}
