import { CATEGORIES, CATEGORY_CLASS, CATEGORY_LABEL, type Category } from '../lib/categories'
import { cx } from '../lib/cx'

/**
 * Heights differ per category, but only slightly.
 *
 * Six identical bars read as a chart, so the shelf needs some unevenness to read
 * as books at all. Too much and it reads as a toy — the earlier version ranged
 * 120–146 and looked like a children's shelf. The values match BookSpine in Figma.
 */
const SPINE_HEIGHT: Record<Category, number> = {
  spiritual: 124,
  mentorat: 116,
  medical: 132,
  juridic: 120,
  cariera: 112,
  social: 128,
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
 * rather than being six pills that happen to sit above a list.
 *
 * Quiet at rest: each spine is the soft category tint with a hairline edge in
 * the solid colour, which is the same pairing the `Tag` component already uses.
 * Only the chosen one saturates. Six solid blocks of colour sitting under the
 * masthead fought the rest of the page, which is deliberately restrained — the
 * design system keeps the primary action ink-coloured for the same reason.
 *
 * Still six buttons underneath: each focusable, carrying `aria-pressed` and its
 * category name, so nothing here depends on seeing the shelf.
 */
export function Shelf({ active, onToggle }: ShelfProps) {
  return (
    // As wide as its books. A board running the full column left them huddled
    // at one end of a bare plank.
    <div className="mb-10 w-fit select-none">
      <div className="flex items-end gap-[5px]">
        {CATEGORIES.map((category) => {
          const style = CATEGORY_CLASS[category]
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
                'group relative w-9 shrink-0 cursor-pointer rounded-sm border p-0',
                'transition-[transform,opacity] duration-200 ease-out',
                'motion-reduce:transition-none',
                'focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2',
                'focus-visible:ring-offset-page focus-visible:outline-none',
                style.border,
                chosen
                  ? cx(style.solidBg, '-translate-y-2.5 shadow-[0_4px_10px_rgba(31,27,22,0.22)]')
                  : cx(style.softBg, 'hover:-translate-y-1'),
                // Pushed back, not hidden: the rest of the shelf still being
                // there is what tells you a filter is on.
                pushedBack && 'opacity-50',
              )}
            >
              <span
                className={cx(
                  't-tag absolute inset-0 grid place-items-center tracking-[0.1em]',
                  // Saturated spine, so the lettering flips to the page colour —
                  // which is near-white on paper and near-black on the dark
                  // ground, the inverse of how the category colours are tuned.
                  chosen ? 'text-page' : style.text,
                )}
              >
                {/* vertical-rl turns the line 90° clockwise; the extra 180°
                    turns it back so the title reads upward, the way a spine on
                    a shelf is read. */}
                <span className="[writing-mode:vertical-rl] [transform:rotate(180deg)] whitespace-nowrap">
                  {CATEGORY_LABEL[category]}
                </span>
              </span>
            </button>
          )
        })}
      </div>

      {/* A hairline. The first version was a 7px plank over a 10px recess —
          furniture drawn at the same weight as the books standing on it. */}
      <div className="h-px bg-line" />
    </div>
  )
}
