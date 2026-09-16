import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button, ButtonLink } from '../components/Button'
import { Switch } from '../components/Switch'
import { ApiError, PASSWORD_MIN_LENGTH, api, auth } from '../lib/api'
import { cx } from '../lib/cx'
import { FIELD_BASE, FIELD_IDLE } from '../lib/forms'
import { initialsFromEmail } from '../lib/initials'
import { resolvedTheme, useTheme } from '../lib/theme'
import { useSignedIn } from '../lib/useAuth'
import { useMyApplication } from '../lib/useApplication'
import { clearMeCache, setMeCache, useMe } from '../lib/useMe'

export function SetariPage() {
  const navigate = useNavigate()
  const { me, status, retry } = useMe()
  const signedIn = useSignedIn()

  if (!signedIn) {
    return (
      <section className="mx-auto max-w-lg px-5 pt-6 pb-20">
        <h1 className="t-h1 m-0 text-ink">Setările contului</h1>
        <p className="t-body mt-2 mb-4 text-ink-soft">
          Intră în cont ca să îți vezi setările.
        </p>
        <ButtonLink to="/login">Intră în cont</ButtonLink>
      </section>
    )
  }

  return (
    <section className="mx-auto max-w-lg px-5 pt-6 pb-20">
      <h1 className="t-hero m-0 text-ink">Setările contului</h1>

      <div className="mt-8 flex items-center gap-4 rounded-lg border border-line bg-raised p-5">
        <span
          aria-hidden="true"
          className={cx(
            't-label flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-sunken text-ink-soft',
            // Same marker as the header avatar: brand red, never danger red.
            me?.isCarte && 'border-2 border-brand',
          )}
        >
          {me?.photoUrl ? (
            <img src={me.photoUrl} alt="" className="size-full object-cover" />
          ) : (
            <span>{me ? initialsFromEmail(me.email) : '·'}</span>
          )}
        </span>
        <div className="min-w-0">
          <p className="t-body m-0 truncate text-ink">
            {me?.displayName ??
              me?.email ??
              (status === 'error' ? 'Profil indisponibil' : 'Se încarcă…')}
          </p>
          {status === 'error' ? (
            <p className="t-body-sm m-0 text-danger">
              Nu am putut încărca profilul.{' '}
              <button
                type="button"
                onClick={retry}
                className="cursor-pointer bg-transparent p-0 text-ink underline"
              >
                Încearcă din nou
              </button>
            </p>
          ) : (
            <p className="t-body-sm m-0 text-ink-muted">
              {me
                ? me.isEmailConfirmed
                  ? 'Email confirmat'
                  : 'Email neconfirmat'
                : ' '}
            </p>
          )}
        </div>
      </div>

      <DisplayName />

      <Appearance />

      <ChangePassword />

      <DevinoCarte />

      <div className="mt-10 border-t border-line pt-6">
        <Button
          variant="ghost"
          fullWidth
          onClick={() => {
            auth.clear()
            clearMeCache()
            navigate('/login')
          }}
        >
          Ieși din cont
        </Button>
      </div>

      <p className="t-body-sm mt-6 text-center text-ink-muted">
        <Link to="/rezervarile-mele" className="text-ink">
          Vezi rezervările tale
        </Link>
      </p>
    </section>
  )
}

function DisplayName() {
  const { me, status } = useMe()
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const seeded = useRef(false)

  // Seed the field once, when the account first loads (useMe is null on the
  // first render). Guarded by a ref so re-seeding never fights a deliberate edit
  // — clearing the field to save an empty name must stick.
  useEffect(() => {
    if (me && !seeded.current) {
      seeded.current = true
      setName(me.displayName ?? '')
    }
  }, [me])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    setDone(false)
    try {
      const info = await api.updateAccount(name.trim())
      setMeCache(info) // updates the header avatar/name immediately
      setDone(true)
    } catch {
      setError('Nu am putut salva numele. Încearcă din nou.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mt-8">
      <h2 className="t-h2 m-0 text-ink">Numele afișat</h2>
      <p className="t-body-sm mt-1 text-ink-muted">
        Cum apari în aplicație. Lasă gol ca să folosești adresa de email.
      </p>

      <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="t-label-sm text-ink-soft">Nume</span>
          <input
            type="text"
            value={name}
            maxLength={80}
            onChange={(e) => {
              setName(e.target.value)
              setDone(false)
            }}
            placeholder="ex. Ana P."
            disabled={!me}
            className={cx(FIELD_BASE, FIELD_IDLE)}
          />
        </label>
        {error && <p className="t-body-sm m-0 text-danger">{error}</p>}
        {done && <p className="t-body-sm m-0 text-ink-muted">Salvat.</p>}
        {status === 'error' && (
          <p className="t-body-sm m-0 text-ink-muted">
            Nu putem încărca numele actual, așa că nu îl putem nici salva.
          </p>
        )}
        <Button type="submit" disabled={busy || !me}>
          {busy ? 'Se salvează…' : 'Salvează numele'}
        </Button>
      </form>
    </div>
  )
}

/**
 * The way in to becoming a „carte”.
 *
 * Shows where the person actually is rather than one fixed invitation: already a
 * „carte”, waiting on a decision, refused (with the reason, so they know what to
 * change), or never asked.
 */
function DevinoCarte() {
  const { me } = useMe()
  const { state } = useMyApplication()

  if (me?.isCarte) {
    return (
      <div className="mt-10">
        <h2 className="t-h2 m-0 text-ink">Ești o „carte”</h2>
        <p className="t-body-sm mt-1 text-ink-muted">
          Publică intervalele în care ești disponibilă în luna aceasta.
        </p>
      </div>
    )
  }

  // Don't flash an invitation at someone who has already applied.
  if (state.status === 'loading' || state.status === 'anonymous') return null

  const pending = state.status === 'ready' && state.application.status === 'Pending'
  const note = state.status === 'ready' ? state.application.reviewNote : null

  return (
    <div className="mt-10">
      <h2 className="t-h2 m-0 text-ink">Vrei să devii o „carte”?</h2>
      <p className="t-body-sm mt-1 text-ink-muted">
        {pending
          ? 'Cererea ta e în analiză. Îți scriem pe email când primim un răspuns.'
          : 'Dacă ai o poveste pe care studenții ar avea de câștigat ascultând-o, trimite-ne o cerere.'}
      </p>
      {note && <p className="t-body-sm mt-2 text-ink-soft">Răspuns anterior: {note}</p>}
      {!pending && (
        <div className="mt-4">
          <ButtonLink to="/devino-carte" variant="ghost" fullWidth>
            Trimite o cerere
          </ButtonLink>
        </div>
      )}
    </div>
  )
}

function Appearance() {
  const [theme, setThemeChoice] = useTheme()
  const dark = resolvedTheme(theme) === 'dark'

  return (
    <div className="mt-8">
      <h2 className="t-h2 m-0 text-ink">Aspect</h2>

      <div className="mt-4 flex items-center gap-4 rounded-lg border border-line bg-raised p-5">
        <div className="min-w-0 flex-1">
          <p className="t-body m-0 text-ink">Mod întunecat</p>
          <p id="tema-explicatie" className="t-body-sm m-0 text-ink-muted">
            {theme === 'system'
              ? 'Urmează setarea sistemului. Atinge comutatorul ca să alegi tu.'
              : dark
                ? 'Ales manual. Nu se mai schimbă odată cu sistemul.'
                : 'Ales manual. Nu se mai schimbă odată cu sistemul.'}
          </p>
        </div>

        <Switch
          checked={dark}
          // Flipping it commits to an explicit choice — the point of touching the
          // switch is to stop following the system.
          onChange={(next) => setThemeChoice(next ? 'dark' : 'light')}
          label="Mod întunecat"
          describedBy="tema-explicatie"
        />
      </div>

      {theme !== 'system' && (
        <button
          type="button"
          onClick={() => setThemeChoice('system')}
          className="t-body-sm mt-3 cursor-pointer text-ink-soft underline"
        >
          Revino la setarea sistemului
        </button>
      )}
    </div>
  )
}

function ChangePassword() {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const tooShort = next.length > 0 && next.length < PASSWORD_MIN_LENGTH
  const mismatch = confirm.length > 0 && confirm !== next

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (next !== confirm) {
      setError('Parolele nu se potrivesc.')
      return
    }

    setBusy(true)
    setError(null)
    setDone(false)
    try {
      await api.changePassword(current, next)
      setDone(true)
      setCurrent('')
      setNext('')
      setConfirm('')
    } catch (err) {
      // Identity reports a wrong current password as a generic validation
      // failure, so name the likely cause rather than echoing its wording.
      setError(
        err instanceof ApiError && err.status === 400
          ? 'Nu am putut schimba parola. Verifică parola actuală.'
          : 'Nu am putut schimba parola. Încearcă din nou.',
      )
    } finally {
      setBusy(false)
    }
  }


  return (
    <div className="mt-8">
      <h2 className="t-h2 m-0 text-ink">Schimbă parola</h2>

      <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-5">
        <label className="flex flex-col gap-1.5">
          <span className="t-label-sm text-ink-soft">Parola actuală</span>
          <input
            type="password"
            required
            autoComplete="current-password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            className={cx(FIELD_BASE, FIELD_IDLE)}
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="t-label-sm text-ink-soft">Parola nouă</span>
          <input
            type="password"
            required
            autoComplete="new-password"
            minLength={PASSWORD_MIN_LENGTH}
            value={next}
            onChange={(e) => setNext(e.target.value)}
            className={cx(FIELD_BASE, tooShort ? 'border-danger' : 'border-line-mid')}
          />
          <span className={cx('t-body-sm', tooShort ? 'text-danger' : 'text-ink-muted')}>
            Cel puțin {PASSWORD_MIN_LENGTH} caractere.
          </span>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="t-label-sm text-ink-soft">Confirmă parola nouă</span>
          <input
            type="password"
            required
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className={cx(FIELD_BASE, mismatch ? 'border-danger' : 'border-line-mid')}
          />
          {mismatch && (
            <span className="t-body-sm text-danger">Parolele nu se potrivesc.</span>
          )}
        </label>

        {error && (
          <p className="t-body-sm m-0 text-danger" role="alert">
            {error}
          </p>
        )}
        {done && (
          <p className="t-body-sm m-0 text-liber" role="status">
            Parola a fost schimbată.
          </p>
        )}

        <Button type="submit" fullWidth disabled={busy || tooShort || mismatch}>
          {busy ? 'Se salvează…' : 'Schimbă parola'}
        </Button>
      </form>
    </div>
  )
}
