import { Link, NavLink } from 'react-router-dom'
import { auth } from '../lib/api'
import { cx } from '../lib/cx'
import { Logo } from './Logo'
import { UserMenu } from './UserMenu'

const LINKS = [
  { to: '/', label: 'Calendar', end: true },
  { to: '/carti', label: 'Cărți', end: false },
]

export function TopBar() {
  const signedIn = auth.token !== null

  return (
    <header className="flex items-center justify-between gap-4 px-5 py-5 sm:px-12 lg:px-25">
      {/* Mark plus wordmark: the mark alone is an "A", which does not yet carry
          the name for anyone meeting the project for the first time. */}
      <Link
        to="/"
        className="flex shrink-0 items-center gap-2 no-underline"
        aria-label="AMiCUS — pagina principală"
      >
        <Logo className="text-brand" />
        <span className="t-label font-semibold text-ink">AMiCUS</span>
      </Link>

      <nav className="flex items-center gap-4 sm:gap-8">
        {LINKS.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={({ isActive }) =>
              cx(
                't-label no-underline transition-colors hover:text-ink',
                isActive ? 'text-ink' : 'text-ink-soft',
              )
            }
          >
            {link.label}
          </NavLink>
        ))}

        {/*
          Everything account-shaped lives behind the avatar — bookings, settings
          and sign-out. Keeping them in the header worked with two items and
          would not survive a third.
        */}
        {signedIn ? (
          <UserMenu />
        ) : (
          <Link to="/login" className="t-label text-ink no-underline">
            Intră în cont
          </Link>
        )}
      </nav>
    </header>
  )
}
