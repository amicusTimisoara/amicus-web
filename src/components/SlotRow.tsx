import type { Category } from '../lib/categories'
import { cx } from '../lib/cx'
import { Tag } from './Tag'

export type SlotState = 'liber' | 'ocupat' | 'al-tau'

const STATUS: Record<SlotState, { label: string; className: string }> = {
  liber: { label: 'Liber', className: 'text-liber' },
  ocupat: { label: 'Ocupat', className: 'text-ink-muted' },
  'al-tau': { label: 'Rezervarea ta', className: 'text-ink' },
}

interface SlotRowProps {
  time: string
  duration: string
  /** The book's name — or, on a book's own page, the date instead. */
  title: string
  category: Category
  /** Omitted on a book's own page, where the tag would only repeat the header. */
  tagTo?: string
  showTag?: boolean
  state: SlotState
  selected?: boolean
  onSelect?: () => void
}

/**
 * One bookable slot.
 *
 * Taken slots are dimmed rather than hidden, so a student can see the day is
 * busy. What they never show is WHO holds the slot — the API does not return it,
 * by design, because some books are physicians and lawyers.
 */
export function SlotRow({
  time,
  duration,
  title,
  category,
  tagTo,
  showTag = true,
  state,
  selected,
  onSelect,
}: SlotRowProps) {
  const status = STATUS[state]
  const interactive = state !== 'ocupat' && Boolean(onSelect)

  return (
    <div
      className={cx(
        'flex items-center gap-4 rounded-lg border bg-raised p-4',
        state === 'ocupat' && 'opacity-55',
        selected ? 'border-line-strong' : 'border-line',
        interactive && 'cursor-pointer hover:border-line-mid',
      )}
      onClick={interactive ? onSelect : undefined}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={
        interactive
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onSelect?.()
              }
            }
          : undefined
      }
    >
      <div className="flex flex-col gap-1">
        <span className="t-label text-ink">{time}</span>
        <span className="t-body-sm text-ink-muted">{duration}</span>
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <span className="t-h3 truncate text-ink">{title}</span>
        {showTag && (
          <span>
            <Tag category={category} to={tagTo} />
          </span>
        )}
      </div>

      <span className={cx('t-label-sm shrink-0', status.className)}>{status.label}</span>
    </div>
  )
}
