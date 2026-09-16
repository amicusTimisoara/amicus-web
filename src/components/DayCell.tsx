import type { Category } from '../lib/categories'
import { CATEGORY_LABEL } from '../lib/categories'
import { cx } from '../lib/cx'
import { Dot } from './Dot'

export interface DayMark {
  category: Category
  taken: boolean
}

interface DayCellProps {
  day: number
  inMonth: boolean
  isToday: boolean
  isSelected: boolean
  marks: DayMark[]
  onSelect?: () => void
  /**
   * Whether the accessible name should name the categories present.
   *
   * False on a single person's own calendar, where every dot is theirs and the
   * hue carries no information — naming a category there states something untrue
   * to a screen-reader user, which is worse than saying nothing.
   */
  describeCategories?: boolean
}

/** Four dots in a 48px cell is already crowded; beyond that we count instead. */
const MAX_DOTS = 3

function summarise(day: number, marks: DayMark[], describeCategories: boolean): string {
  if (marks.length === 0) return `${day}, nicio întâlnire`
  const free = marks.filter((m) => !m.taken).length
  const taken = marks.length - free
  const parts: string[] = []
  if (free > 0) parts.push(free === 1 ? 'un loc liber' : `${free} locuri libere`)
  if (taken > 0) parts.push(taken === 1 ? 'un loc ocupat' : `${taken} locuri ocupate`)
  const counts = `${day}, ${parts.join(' și ')}`
  if (!describeCategories) return counts
  const kinds = [...new Set(marks.map((m) => CATEGORY_LABEL[m.category]))].join(', ')
  return `${counts} — ${kinds}`
}

/**
 * One day in the month grid.
 *
 * Selected is drawn as an ink ring rather than a filled dark cell on purpose: a
 * dark fill would wreck the contrast of the category dots sitting inside it,
 * which are the whole reason the cell exists.
 */
export function DayCell({
  day,
  inMonth,
  isToday,
  isSelected,
  marks,
  onSelect,
  describeCategories = true,
}: DayCellProps) {
  const shown = marks.slice(0, MAX_DOTS)
  const overflow = marks.length - shown.length

  return (
    <button
      type="button"
      onClick={onSelect}
      // Every day of the month is selectable, including empty ones: the panel
      // answering "nothing that day" is a real answer, and it is what lets this
      // work as a plain calendar in a month with no meetings.
      disabled={!inMonth}
      aria-current={isToday ? 'date' : undefined}
      aria-pressed={inMonth ? isSelected : undefined}
      aria-label={summarise(day, marks, describeCategories)}
      className={cx(
        'flex h-14 flex-col items-center gap-1 rounded-md pt-2 transition-colors',
        'sm:h-[76px] sm:pt-3',
        !inMonth && 'opacity-35',
        isToday && !isSelected && 'bg-sunken',
        isSelected && 'border-2 border-line-strong bg-raised',
        inMonth ? 'cursor-pointer hover:bg-sunken' : 'cursor-default',
      )}
    >
      <span className={cx('t-num', inMonth ? 'text-ink' : 'text-ink-muted')}>{day}</span>

      <span className="flex items-center gap-[3px]">
        {shown.map((mark, i) => (
          <Dot key={i} category={mark.category} taken={mark.taken} />
        ))}
        {overflow > 0 && (
          <span aria-hidden="true" className="t-label-sm text-ink-muted">
            +{overflow}
          </span>
        )}
      </span>
    </button>
  )
}
