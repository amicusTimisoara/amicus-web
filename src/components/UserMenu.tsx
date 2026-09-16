import { useEffect, useId, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { auth } from '../lib/api'
import { cx } from '../lib/cx'
import { initialsFromEmail } from '../lib/initials'
import { clearMeCache, useMe } from '../lib/useMe'

/**
 * The account circle and the panel it opens.
 *
 * Opens on hover AND on click, deliberately. Hover alone would be unreachable on
 * a phone and unreachable from a keyboard; click alone would feel sticky on a
 * desktop. So hover is an enhancement layered on a control that works without it.
 *
 * The avatar draws initials rather than a photo because the API has no picture
 * for an account — `AppUser` carries only DisplayName and CreatedAt, and Google
 * sign-in does not capture one. `photoUrl` is here so a real picture drops in
 * without touching any caller.
 */
export function UserMenu() {
  const navigate = useNavigate()
  const me = useMe()
  const [open, setOpen] = useState(false)
  // A menu opened by clicking stays open until it is dismissed deliberately.
  // Without this, moving the pointer off the circle closes a menu the person
  // just clicked to open — which is the one interaction they were certain about.
  const [latched, setLatched] = useState(false)
  const wrapper = useRef<HTMLDivElement>(null)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const menuId = useId()

  const photoUrl: string | null = null
  const initials = me ? initialsFromEmail(me.email) : '·'

  // Close on click outside and on Escape. Without these the panel survives
  // navigation clicks and traps keyboard users with no way back out.
  useEffect(() => {
    if (!open) return

    function onPointerDown(e: PointerEvent) {
      if (!wrapper.current?.contains(e.target as Node)) close()
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') close()
    }

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  useEffect(() => () => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
  }, [])

  // A small grace period on leaving: the pointer has to cross a gap between the
  // circle and the panel, and closing the instant it leaves the button makes the
  // menu impossible to reach.
  function close() {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    setOpen(false)
    setLatched(false)
  }

  function openNow() {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    setOpen(true)
  }

  function closeSoon() {
    if (latched) return
    if (closeTimer.current) clearTimeout(closeTimer.current)
    closeTimer.current = setTimeout(() => setOpen(false), 180)
  }

  function toggleByClick() {
    if (open && latched) {
      close()
      return
    }
    openNow()
    setLatched(true)
  }

  function signOut() {
    auth.clear()
    clearMeCache()
    close()
    navigate('/login')
  }

  return (
    <div
      ref={wrapper}
      className="relative"
      onMouseEnter={openNow}
      onMouseLeave={closeSoon}
    >
      <button
        type="button"
        onClick={toggleByClick}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label="Contul meu"
        className={cx(
          'flex size-10 cursor-pointer items-center justify-center overflow-hidden rounded-full',
          'border transition-colors',
          open ? 'border-line-strong bg-sunken' : 'border-line bg-sunken hover:border-line-mid',
        )}
      >
        {photoUrl ? (
          <img src={photoUrl} alt="" className="size-full object-cover" />
        ) : (
          <span className="t-label-sm text-ink-soft">{initials}</span>
        )}
      </button>

      {open && (
        <div
          id={menuId}
          role="menu"
          className={cx(
            'absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-lg border border-line',
            'bg-raised shadow-[0_12px_32px_rgba(31,27,22,0.12)]',
          )}
        >
          <div className="border-b border-line px-4 py-3">
            <p className="t-label-sm m-0 text-ink-muted">Conectat ca</p>
            <p className="t-body m-0 truncate text-ink">{me?.email ?? '…'}</p>
            {me && !me.isEmailConfirmed && (
              <p className="t-body-sm m-0 mt-1 text-ink-muted">Email neconfirmat</p>
            )}
          </div>

          <nav className="flex flex-col py-1">
            <MenuLink to="/rezervarile-mele" onNavigate={close}>
              Rezervările mele
            </MenuLink>
            <MenuLink to="/setari" onNavigate={close}>
              Setările contului
            </MenuLink>
          </nav>

          <div className="border-t border-line py-1">
            <button
              type="button"
              role="menuitem"
              onClick={signOut}
              className="t-label w-full cursor-pointer px-4 py-2.5 text-left text-ink-soft transition-colors hover:bg-sunken hover:text-ink"
            >
              Ieși din cont
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function MenuLink({
  to,
  onNavigate,
  children,
}: {
  to: string
  onNavigate: () => void
  children: React.ReactNode
}) {
  return (
    <Link
      to={to}
      role="menuitem"
      onClick={onNavigate}
      className="t-label px-4 py-2.5 text-ink no-underline transition-colors hover:bg-sunken"
    >
      {children}
    </Link>
  )
}
