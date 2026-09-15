import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { cx } from '../lib/cx'

type Variant = 'primary' | 'secondary' | 'ghost'

const VARIANT: Record<Variant, string> = {
  primary: 'bg-inverse text-on-inverse hover:opacity-90',
  secondary: 'bg-sunken text-ink hover:bg-paper-200',
  ghost: 'border border-line-mid text-ink hover:bg-sunken',
}

/**
 * `py-4` on a 20px line box gives a 52px control — comfortably past the 44px
 * minimum touch target, which matters because the main action here is tapped on
 * a phone, often in a corridor.
 */
const BASE =
  't-label inline-flex items-center justify-center rounded-md px-6 py-4 ' +
  'transition-opacity disabled:cursor-not-allowed disabled:opacity-40'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  fullWidth?: boolean
  children: ReactNode
}

export function Button({
  variant = 'primary',
  fullWidth,
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type="button"
      {...rest}
      className={cx(BASE, VARIANT[variant], fullWidth && 'w-full', className)}
    >
      {children}
    </button>
  )
}

interface ButtonLinkProps {
  to: string
  variant?: Variant
  fullWidth?: boolean
  className?: string
  children: ReactNode
}

/** Same skin, but a real anchor — so it opens in a new tab, gets copied, etc. */
export function ButtonLink({
  to,
  variant = 'primary',
  fullWidth,
  className,
  children,
}: ButtonLinkProps) {
  return (
    <Link
      to={to}
      className={cx(BASE, VARIANT[variant], fullWidth && 'w-full', className)}
    >
      {children}
    </Link>
  )
}
