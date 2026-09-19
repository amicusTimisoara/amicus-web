import { CATEGORIES, CATEGORY_CLASS, CATEGORY_LABEL, type Category } from '../lib/categories'
import { cx } from '../lib/cx'

/**
 * Spines differ in both dimensions, but only slightly.
 *
 * Six identical bars read as a chart, so the shelf needs some unevenness to read
 * as books at all. Too much and it reads as a toy — an earlier version ranged
 * 120–146 and looked like a children's shelf. Varying the width as well as the
 * height was what finally sold it: books differ in thickness, and six equal
 * widths was half of why these still looked like tabs.
 *
 * The values match the BookSpine component in Figma.
 */
const SPINE: Record<Category, { w: number; h: number }> = {
  spiritual: { w: 36, h: 124 },
  mentorat: { w: 32, h: 116 },
  medical: { w: 38, h: 132 },
  juridic: { w: 34, h: 120 },
  cariera: { w: 33, h: 112 },
  social: { w: 37, h: 128 },
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
    // As wide as its books plus the board's overhang. A board running the full
    // column left them huddled at one end of a bare plank.
    <div className="mb-10 w-fit select-none">
      <div className="flex items-end gap-[5px] px-5">
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
              style={{ width: SPINE[category].w, height: SPINE[category].h }}
              className={cx(
                'group relative shrink-0 cursor-pointer rounded-sm border p-0',
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
              {/*
                One colour for every mark on the spine. Saturated, the lettering
                and rules flip to the page colour — near-white on paper and
                near-black on the dark ground, the inverse of how the category
                colours are tuned.
              */}
              <span
                aria-hidden="true"
                className={cx('absolute inset-0', chosen ? 'text-page' : style.text)}
              >
                {/* The crease where a cover folds over the block. A rectangle
                    with a line down one side reads as a spine; without it, it
                    is a rectangle. */}
                <span className="absolute top-[7px] bottom-[7px] left-[5px] w-px bg-current opacity-45" />
                {/* Raised bands, where the binding is reinforced. They wrap the
                    whole spine — stopping them clear of the hinge turned each
                    one into a bracket pointing at the title. */}
                <span className="absolute top-[11px] right-[3px] left-[3px] h-px bg-current opacity-40" />
                <span className="absolute right-[3px] bottom-[11px] left-[3px] h-px bg-current opacity-40" />
              </span>

              <span
                className={cx(
                  't-tag absolute inset-0 grid place-items-center pl-1 tracking-[0.1em]',
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

      {/*
        The board. Three things it was missing: a thickness you can see, an
        overhang past the books at each end, and air between it and the book
        bottoms. Without those it read as an underline belonging to the heading
        above rather than furniture the books stand on.
      */}
      <div className="mt-[3px] h-[3px] rounded-[1px] bg-line-mid shadow-[0_2px_4px_-1px_rgba(31,27,22,0.28)]" />
    </div>
  )
}

