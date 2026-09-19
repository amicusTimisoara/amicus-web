import { CATEGORIES, CATEGORY_CLASS, CATEGORY_LABEL, type Category } from '../lib/categories'
import { cx } from '../lib/cx'

/**
 * Heights differ per category on purpose.
 *
 * Six identical rectangles read as a chart. Real shelves are uneven, and that
 * unevenness is most of what makes this legible as books rather than as tabs.
 * The values match the BookSpine component in Figma.
 */
const SPINE_HEIGHT: Record<Category, number> = {
  spiritual: 138,
  mentorat: 126,
  medical: 146,
  juridic: 132,
  cariera: 120,
  social: 140,
}

interface ShelfProps {
  /** The chosen category, or null when the whole shelf is on display. */
  active: Category | null
  onToggle: (category: Category) => void
}

/**
 * The catalogue filters, as books on a shelf.
 *
 * Filtering by category IS taking one book off a shelf, so the control says so
 * rather than being six pills that happen to sit above a list. Choosing one
 * lifts it clear of the board and pushes the rest back.
 *
 * Still six buttons underneath: each is focusable, carries `aria-pressed`, and
 * names its category, so nothing here depends on seeing the shelf.
 */
export function Shelf({ active, onToggle }: ShelfProps) {
  return (
    // Width follows the books, so the board ends where the shelf does. Letting it
    // run the full column left the books huddled at one end of a bare plank.
    <div className="mb-10 w-fit select-none">
      <div className="flex items-end gap-[7px] px-1">
        {CATEGORIES.map((category) => {
          const chosen = active === category
          const pushedBack = active !== null && !chosen
          return (
            <button
              key={category}
              type="button"
              onClick={() => onToggle(category)}
              aria-pressed={chosen}
              style={{ height: SPINE_HEIGHT[category] }}
              className={cx(
                'group relative w-11 shrink-0 cursor-pointer rounded-[3px] border-0 p-0',
                'transition-[transform,opacity,filter] duration-200 ease-out',
                // The lift is the whole gesture, so it stays — but it stops
                // animating for anyone who asked for less movement.
                'motion-reduce:transition-none',
                'focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2',
                'focus-visible:ring-offset-page focus-visible:outline-none',
                CATEGORY_CLASS[category].solidBg,
                chosen
                  ? '-translate-y-4 shadow-[0_6px_12px_rgba(31,27,22,0.28)]'
                  : 'hover:-translate-y-1.5',
                // Pushed back rather than hidden: the rest of the shelf is still
                // there, which is what tells you a filter is on.
                pushedBack && 'opacity-45 saturate-[0.6]',
              )}
            >
              {/* The bands on a cloth spine. Without them these are just
                  coloured rectangles standing up. */}
              <span
                aria-hidden="true"
                className="absolute inset-x-1.5 top-3.5 h-[1.5px] bg-page/60"
              />
              <span
                aria-hidden="true"
                className="absolute inset-x-1.5 bottom-4 h-[1.5px] bg-page/60"
              />

              <span className="t-tag absolute inset-0 grid place-items-center text-page">
                {/* vertical-rl turns the line 90° clockwise; the extra 180°
                    turns it back so the title reads upward, the way a spine on a
                    shelf is read. */}
                <span className="[writing-mode:vertical-rl] [transform:rotate(180deg)] whitespace-nowrap">
                  {CATEGORY_LABEL[category]}
                </span>
              </span>
            </button>
          )
        })}
      </div>

      {/* The board, and the shadow it throws back into the recess.

          The lettering and banding use `page`, not a paper tone: the category
          colours are defined against the page — dark and saturated on paper,
          light on the dark ground — so `page` is the one value that stays
          readable on a spine in both themes. */}
      <div className="h-[7px] rounded-sm bg-line-strong" />
      <div className="h-2.5 bg-sunken opacity-50" />
    </div>
  )
}
