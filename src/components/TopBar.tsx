import { Link, NavLink, useNavigate } from 'react-router-dom'
import { auth } from '../lib/api'
import { cx } from '../lib/cx'

const LINKS = [
  { to: '/', label: 'Calendar', end: true },
  { to: '/carti', label: 'Cărți', end: false },
]

export function TopBar() {
  const navigate = useNavigate()
  const signedIn = auth.token !== null

  return (
    <header className="flex items-center justify-between gap-4 px-5 py-5 sm:px-12 lg:px-25">
      <Link to="/" className="t-label shrink-0 font-semibold text-ink no-underline">
        AMiCUS
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

        {signedIn ? (
          <>
            <NavLink
              to="/rezervarile-mele"
              className={({ isActive }) =>
                cx(
                  't-label no-underline transition-colors hover:text-ink',
                  isActive ? 'text-ink' : 'text-ink-soft',
                )
              }
            >
              Rezervările mele
            </NavLink>
            <button
              type="button"
              onClick={() => {
                auth.clear()
                navigate('/login')
              }}
              className="t-label hidden cursor-pointer text-ink-muted transition-colors hover:text-ink sm:inline"
            >
              Ieși
            </button>
          </>
        ) : (
          <Link to="/login" className="t-label text-ink no-underline">
            Intră în cont
          </Link>
        )}
      </nav>
    </header>
  )
}
