import { Link, NavLink, useLocation } from 'react-router-dom'
import { cx } from '../lib/cx'
import { useSignedIn } from '../lib/useAuth'
import { Logo } from './Logo'
import { UserMenu } from './UserMenu'

const CALENDAR = { to: '/', label: 'Calendar', end: true }
const BIBLIOTECA = { to: '/carti', label: 'Biblioteca', end: false }

export function TopBar() {
  const signedIn = useSignedIn()
  const { pathname } = useLocation()

  // Both destinations need an account: every /events endpoint on the API sits
  // behind RequireAuthorization, so to a signed-out visitor the calendar and the
  // catalogue are just sign-in prompts. Advertising them in the header offers
  // doors that don't open.
  //
  // "Calendar" additionally disappears while the calendar IS the page — a link
  // to what you are already looking at is noise. The calendar lives on the home
  // route, so that test is simply the pathname.
  const links = !signedIn
    ? []
    : pathname === CALENDAR.to
      ? [BIBLIOTECA]
      : [CALENDAR, BIBLIOTECA]

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
        {links.map((link) => (
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
