import { useCallback, useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Button, ButtonLink } from '../components/Button'
import { Tag } from '../components/Tag'
import { ApiError, api, type BookingDetail } from '../lib/api'
import { fromServerCategory, toCategory } from '../lib/categories'
import { cx } from '../lib/cx'
import {
  dayMonthLabel,
  minutesBetween,
  zonedDayKey,
  zonedTime,
  zonedWeekdayLong,
} from '../lib/date'

/** Bookings are rendered in the event's zone; the API does not repeat it per booking. */
const ZONE = 'Europe/Bucharest'

type State =
  | { status: 'loading' }
  | { status: 'unauthenticated' }
  | { status: 'error'; message: string }
  | { status: 'ready'; bookings: BookingDetail[] }

export function RezervarilePage() {
  const [params] = useSearchParams()
  const justBooked = params.get('noua')

  // `null` until the first response lands. Refreshing bumps the nonce but keeps
  // the previous list on screen, so cancelling a booking doesn't blank the page.
  const [result, setResult] = useState<State | null>(null)
  const [nonce, setNonce] = useState(0)
  const load = useCallback(() => setNonce((n) => n + 1), [])

  useEffect(() => {
    let live = true
    api
      .myBookings()
      .then((bookings) => live && setResult({ status: 'ready', bookings }))
      .catch((error: unknown) => {
        if (!live) return
        setResult(
          error instanceof ApiError && error.status === 401
            ? { status: 'unauthenticated' }
            : {
                status: 'error',
                message: error instanceof Error ? error.message : String(error),
              },
        )
      })
    return () => {
      live = false
    }
  }, [nonce])

  const state: State = result ?? { status: 'loading' }

  return (
    <section className="px-5 pt-2 pb-20 sm:px-12 lg:px-25">
      <h1 className="t-hero m-0 text-ink">Rezervările mele</h1>

      {state.status === 'loading' && (
        <p className="t-body mt-6 text-ink-muted">Se încarcă…</p>
      )}

      {state.status === 'unauthenticated' && (
        <div className="mt-6 rounded-lg border border-line bg-raised p-6">
          <p className="t-body m-0 text-ink-soft">
            Intră în cont ca să vezi rezervările tale.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <ButtonLink to="/login">Intră în cont</ButtonLink>
            <ButtonLink to="/inregistrare" variant="ghost">
              Creează cont
            </ButtonLink>
          </div>
        </div>
      )}

      {state.status === 'error' && (
        <p className="t-body mt-6 text-ink-soft">Nu am putut încărca: {state.message}</p>
      )}

      {state.status === 'ready' && state.bookings.length === 0 && (
        <div className="mt-6 flex flex-col items-start gap-4">
          <p className="t-body m-0 text-ink-soft">Nu ai nicio rezervare încă.</p>
          <ButtonLink to="/">Vezi calendarul</ButtonLink>
        </div>
      )}

      {state.status === 'ready' && state.bookings.length > 0 && (
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          {state.bookings.map((booking) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              highlight={booking.id === justBooked}
              onChanged={load}
            />
          ))}
        </div>
      )}
    </section>
  )
}

const STATUS_LABEL: Record<BookingDetail['status'], string> = {
  Booked: 'Rezervarea ta',
  CheckedIn: 'Ai ajuns',
  Completed: 'Încheiată',
  Cancelled: 'Anulată',
  NoShow: 'Neprezentat',
}

function BookingCard({
  booking,
  highlight,
  onChanged,
}: {
  booking: BookingDetail
  highlight: boolean
  onChanged: () => void
}) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const dayKey = zonedDayKey(booking.startsAt, ZONE)
  const active = booking.status === 'Booked' || booking.status === 'CheckedIn'

  async function cancel() {
    setBusy(true)
    setError(null)
    try {
      await api.cancelBooking(booking.id)
      onChanged()
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 409
          ? 'Rezervarea nu mai poate fi anulată.'
          : 'Nu am putut anula rezervarea. Încearcă din nou.',
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <article
      className={cx(
        'flex flex-col items-start gap-4 rounded-xl border bg-raised p-7',
        highlight ? 'border-line-strong' : 'border-line',
        !active && 'opacity-60',
      )}
    >
      <span
        className={cx('t-tag', booking.status === 'Cancelled' ? 'text-ink-muted' : 'text-liber')}
      >
        {STATUS_LABEL[booking.status]}
      </span>

      <h2 className="t-h1 m-0 text-ink">
        {zonedWeekdayLong(booking.startsAt, ZONE)}, {dayMonthLabel(dayKey)}
      </h2>

      <p className="t-body m-0 text-ink-soft">
        {zonedTime(booking.startsAt, ZONE)} ·{' '}
        {minutesBetween(booking.startsAt, booking.endsAt)} de minute
        {booking.location ? ` · ${booking.location}` : ''}
      </p>

      <div className="flex items-center gap-3">
        <span className="t-h2 text-ink">{booking.specialistName}</span>
        {/* The server's category wins here too. Guessing from the free-text
            specialty made a booking with a „carte” tagged SOCIAL everywhere
            else show up as SPIRITUAL on this page. */}
        <Tag category={fromServerCategory(booking.category) ?? toCategory(booking.specialty)} />
      </div>

      {booking.topic && (
        <p className="t-body-sm m-0 text-ink-muted">Ai notat: „{booking.topic}”</p>
      )}

      {error && (
        <p className="t-body-sm m-0 text-danger" role="alert">
          {error}
        </p>
      )}

      {booking.status === 'Booked' && (
        <Button variant="ghost" fullWidth disabled={busy} onClick={cancel}>
          {busy ? 'Se anulează…' : 'Anulează rezervarea'}
        </Button>
      )}

      <Link to="/" className="t-label text-ink no-underline">
        Înapoi la calendar
      </Link>
    </article>
  )
}
