import { cx } from '../lib/cx'

interface SwitchProps {
  checked: boolean
  onChange: (next: boolean) => void
  /** Required: the control is a bare track and knob, with no text of its own. */
  label: string
  describedBy?: string
  className?: string
}

/**
 * An on/off switch.
 *
 * A real `<button role="switch">` rather than a styled checkbox: it gets keyboard
 * activation and focus-visible for free, and `aria-checked` is what a screen
 * reader announces as on or off.
 *
 * The track is 44px wide so the hit area clears the touch-target minimum even
 * though it is only 26 tall.
 */
export function Switch({ checked, onChange, label, describedBy, className }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      aria-describedby={describedBy}
      onClick={() => onChange(!checked)}
      className={cx(
        'inline-flex h-[26px] w-11 shrink-0 cursor-pointer items-center rounded-full p-[3px]',
        'transition-colors',
        checked ? 'bg-inverse' : 'bg-line-mid',
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cx(
          'block size-5 rounded-full bg-raised transition-transform',
          checked ? 'translate-x-[18px]' : 'translate-x-0',
        )}
      />
    </button>
  )
}
