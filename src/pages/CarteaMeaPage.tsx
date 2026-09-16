import { useCallback, useEffect, useMemo, useState } from 'react'
import { Button, ButtonLink } from '../components/Button'
import { DayCell, type DayMark } from '../components/DayCell'
import { cx } from '../lib/cx'
import { ApiError, api, type CarteSlot } from '../lib/api'
import {
  addMonths,
  dateKey,
  monthGrid,
  monthLabel,
  todayKey,
  weekdayLongFromKey,
  dayMonthLabel,
  type YearMonth,
} from '../lib/date'
import { FIELD_BASE, FIELD_IDLE } from '../lib/forms'
import { useSignedIn } from '../lib/useAuth'
import { useMe } from '../lib/useMe'

const WEEKDAYS_SHORT_RO = ['L', 'M', 'M', 'J', 'V', 'S', 'D']
const TIME_ZONE = 'Europe/Bucharest'

/**
 * On a „carte”'s own calendar every slot belongs to the same person, so the
 * category hue carries no information — only hollow vs solid (free vs booked)
 * does. `social` is the most neutral of the six, chosen so the dots read as
 * state rather than as a claim about what they advise on.
 */
const NEUTRAL_MARK = 'social' as const

const DURATIONS = [20, 30, 45, 60]

function thisMonth(): YearMonth {
  const now = new Date()
  return { year: now.getFullYear(), month: now.getMonth() + 1 }
}

/** Local day key for a slot, which is how it is grouped in the grid. */
function dayKeyOf(iso: string): string {
  const d = new Date(iso)
  return dateKey(d.getFullYear(), d.getMonth() + 1, d.getDate())
}

function timeOf(iso: string): string {
  return new Date(iso).toLocaleTimeString('ro-RO', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

function minutesOf(slot: CarteSlot): number {
  return Math.round((new Date(slot.endsAt).getTime() - new Date(slot.startsAt).getTime()) / 60000)
}

/**
 * Where a „carte” publishes the intervals they can make.
 *
 * Length is chosen per interval rather than once, which is why it is a control
 * here and not a question on the application — the same person can offer twenty
 * minutes one week and an hour the next.
 */
export function CarteaMeaPage() {
  const signedIn = useSignedIn()
  const { me } = useMe()
  const [month, setMonth] = useState<YearMonth>(thisMonth)
  const [slots, setSlots] = useState<CarteSlot[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<string | null>(null)

  const range = useMemo(() => {
    const first = dateKey(month.year, month.month, 1)
    const lastDay = new Date(month.year, month.month, 0).getDate()
    return { from: first, to: dateKey(month.year, month.month, lastDay) }
  }, [month])

  // State is set only from the async callbacks. Clearing the error synchronously
  // here made this a setState inside an effect, costing an extra render on every
  // month change for no benefit — a stale error clears when the retry succeeds.
  const load = useCallback(() => {
    api
      .carteSlots(range.from, range.to)
      .then((rows) => {
        setSlots(rows)
        setError(null)
      })
      .catch(() => setError('Nu am putut încărca intervalele.'))
  }, [range.from, range.to])

  useEffect(() => {
    if (!signedIn || me?.isCarte !== true) return
    load()
  }, [signedIn, me?.isCarte, load])

  const byDay = useMemo(() => {
    const map = new Map<string, CarteSlot[]>()
    for (const s of slots ?? []) {
      const key = dayKeyOf(s.startsAt)
      const list = map.get(key)
      if (list) list.push(s)
      else map.set(key, [s])
    }
    for (const list of map.values()) {
      list.sort((a, b) => a.startsAt.localeCompare(b.startsAt))
    }
    return map
  }, [slots])

  if (!signedIn) {
    return (
      <Shell>
        <p className="t-body mt-2 mb-4 text-ink-soft">Intră în cont ca să îți vezi calendarul.</p>
        <ButtonLink to="/login">Intră în cont</ButtonLink>
      </Shell>
    )
  }

  // Not a „carte” yet — point at the way in rather than a dead end.
  if (me && !me.isCarte) {
    return (
      <Shell>
        <p className="t-body mt-2 mb-4 text-ink-soft">
          Pagina asta e pentru „cărțile” din bibliotecă. Dacă ai o poveste de împărtășit,
          trimite-ne o cerere.
        </p>
        <ButtonLink to="/devino-carte">Devino o „carte”</ButtonLink>
      </Shell>
    )
  }

  const cells = monthGrid(month)
  const today = todayKey(TIME_ZONE)
  const daySlots = selected ? (byDay.get(selected) ?? []) : []

  return (
    <section className="mx-auto max-w-lg px-5 pt-6 pb-20">
      <h1 className="t-hero m-0 text-ink">Disponibilitatea mea</h1>
      <p className="t-body mt-2 text-ink-soft">
        Alege zilele și intervalele în care ești disponibilă. E nevoie de cel puțin un
        interval pe lună.
      </p>

      <div className="mt-8 flex items-center justify-between gap-4">
        <h2 className="t-h1 m-0 text-ink">{monthLabel(month)}</h2>
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => { setMonth(addMonths(month, -1)); setSelected(null) }}
            className="t-tag cursor-pointer bg-transparent p-0 text-ink-muted hover:text-ink"
          >
            ANTERIOR
          </button>
          <button
            type="button"
            onClick={() => { setMonth(addMonths(month, 1)); setSelected(null) }}
            className="t-tag cursor-pointer bg-transparent p-0 text-ink-muted hover:text-ink"
          >
            URMĂTOR
          </button>
        </div>
      </div>

      {error && (
        <p className="t-body-sm mt-4 text-danger" role="alert">
          {error}{' '}
          <button type="button" onClick={load} className="cursor-pointer bg-transparent p-0 text-ink underline">
            Încearcă din nou
          </button>
        </p>
      )}

      <div className="mt-5">
        <div className="grid grid-cols-7 gap-1">
          {WEEKDAYS_SHORT_RO.map((letter, i) => (
            <span key={i} className="t-label-sm py-1 text-center text-ink-muted">
              {letter}
            </span>
          ))}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-1">
          {cells.map((cell) => {
            const list = cell.inMonth ? (byDay.get(cell.key) ?? []) : []
            const marks: DayMark[] = list.map((s) => ({
              category: NEUTRAL_MARK,
              taken: s.isBooked,
            }))
            return (
              <DayCell
                key={cell.key}
                day={cell.day}
                inMonth={cell.inMonth}
                isToday={cell.key === today}
                isSelected={cell.key === selected}
                marks={marks}
                describeCategories={false}
                onSelect={() => setSelected(cell.key)}
              />
            )
          })}
        </div>
      </div>

      {selected ? (
        <DayPanel dayKey={selected} slots={daySlots} onChanged={load} />
      ) : (
        <p className="t-body mt-8 text-ink-soft">
          Alege o zi din calendar ca să adaugi sau să retragi intervale.
        </p>
      )}
    </section>
  )
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <section className="mx-auto max-w-lg px-5 pt-6 pb-20">
      <h1 className="t-h1 m-0 text-ink">Disponibilitatea mea</h1>
      {children}
    </section>
  )
}

function DayPanel({
  dayKey,
  slots,
  onChanged,
}: {
  dayKey: string
  slots: CarteSlot[]
  onChanged: () => void
}) {
  const [time, setTime] = useState('16:00')
  const [minutes, setMinutes] = useState(30)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function publish(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      // Built in the browser's own zone. Everyone running this project is in
      // Romania, which is the event zone; a „carte” travelling abroad would want
      // the event's zone applied instead, and that needs the server's help.
      const startsAt = new Date(`${dayKey}T${time}:00`).toISOString()
      await api.publishSlot(startsAt, minutes)
      onChanged()
    } catch (err) {
      setError(publishError(err))
    } finally {
      setBusy(false)
    }
  }

  async function withdraw(slot: CarteSlot) {
    setError(null)
    try {
      await api.withdrawSlot(slot.id)
      onChanged()
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 409
          ? 'Un student a rezervat deja acest interval. Scrie-i echipei ca să îl anuleze.'
          : 'Nu am putut retrage intervalul.',
      )
    }
  }

  const booked = slots.filter((s) => s.isBooked).length

  return (
    <div className="mt-8">
      <h2 className="t-h2 m-0 text-ink">
        {weekdayLongFromKey(dayKey)}, {dayMonthLabel(dayKey)}
      </h2>
      <p className="t-body-sm mt-1 text-ink-muted">
        {slots.length === 0
          ? 'Niciun interval publicat.'
          : `${slots.length} ${slots.length === 1 ? 'interval publicat' : 'intervale publicate'}${
              booked > 0 ? ` · ${booked} rezervat${booked === 1 ? '' : 'e'}` : ''
            }`}
      </p>

      {slots.length > 0 && (
        <ul className="mt-4 flex list-none flex-col gap-2 p-0">
          {slots.map((slot) => (
            <li
              key={slot.id}
              className="flex items-center gap-3 rounded-lg border border-line bg-raised px-4 py-3"
            >
              <span className="t-body text-ink">{timeOf(slot.startsAt)}</span>
              <span className="t-body-sm text-ink-muted">{minutesOf(slot)} min</span>
              <span
                className={cx(
                  't-label-sm ml-auto',
                  slot.isBooked ? 'text-ink-soft' : 'text-liber',
                )}
              >
                {slot.isBooked ? 'Ocupat' : 'Liber'}
              </span>
              {/* A booked interval has a student expecting it, so there is no
                  button — cancelling goes through a person. */}
              {!slot.isBooked && (
                <button
                  type="button"
                  onClick={() => withdraw(slot)}
                  className="t-body-sm cursor-pointer bg-transparent p-0 text-ink-muted underline hover:text-ink"
                >
                  Retrage
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={publish} className="mt-5 flex flex-col gap-3">
        <div className="flex gap-3">
          <label className="flex flex-1 flex-col gap-1.5">
            <span className="t-label-sm text-ink-soft">Ora de început</span>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className={cx(FIELD_BASE, FIELD_IDLE)}
            />
          </label>
          <label className="flex flex-1 flex-col gap-1.5">
            <span className="t-label-sm text-ink-soft">Durată</span>
            <select
              value={minutes}
              onChange={(e) => setMinutes(Number(e.target.value))}
              className={cx(FIELD_BASE, FIELD_IDLE)}
            >
              {DURATIONS.map((m) => (
                <option key={m} value={m}>
                  {m} de minute
                </option>
              ))}
            </select>
          </label>
        </div>

        {error && (
          <p className="t-body-sm m-0 text-danger" role="alert">
            {error}
          </p>
        )}

        <Button type="submit" variant="secondary" fullWidth disabled={busy}>
          {busy ? 'Se publică…' : 'Adaugă un interval'}
        </Button>
      </form>
    </div>
  )
}

/** The server distinguishes several ways this fails; each needs its own answer. */
function publishError(err: unknown): string {
  if (!(err instanceof ApiError)) {
    return 'Nu am putut publica intervalul. Verifică legătura la internet.'
  }
  const detail = err.message.toLowerCase()
  if (err.status === 409 && detail.includes('overlap')) {
    return 'Se suprapune cu un interval pe care l-ai publicat deja.'
  }
  if (err.status === 409 && detail.includes('more than one event')) {
    return 'Ziua asta e acoperită de mai multe evenimente. Scrie-i echipei.'
  }
  if (err.status === 409) {
    return 'Nu ești pe lista niciunui eveniment care acoperă ziua asta.'
  }
  if (err.status === 400 && detail.includes('past')) {
    return 'Nu poți publica un interval în trecut.'
  }
  if (err.status === 400) {
    return 'Durata trebuie să fie între 1 și 240 de minute.'
  }
  return 'Nu am putut publica intervalul. Încearcă din nou.'
}
