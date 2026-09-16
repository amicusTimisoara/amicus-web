/**
 * The shared text-input styling, matching the `Field` component in the design
 * file.
 *
 * It lives here because it was previously written out by hand on every form
 * page, and the copies had already drifted: the password-reset pages used
 * `rounded-xl`, wider padding, a lighter border, no body type — and
 * `focus:border-primary`, which names a `--color-primary` token that does not
 * exist, so the focus state silently did nothing.
 *
 * The border COLOUR is deliberately left out. Forms that validate swap it for
 * `border-danger`, so callers append either that or `border-line-mid`.
 */
export const FIELD_BASE =
  't-body rounded-md border bg-raised px-3 py-2.5 text-ink outline-none focus:border-line-strong'

/** The resting border colour, for fields with nothing to report. */
export const FIELD_IDLE = 'border-line-mid'
