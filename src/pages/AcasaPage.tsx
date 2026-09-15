import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Button, ButtonLink } from '../components/Button'
import { DayCell, type DayMark } from '../components/DayCell'
import { Dot } from '../components/Dot'
import { SlotRow } from '../components/SlotRow'
import { bookingErrorMessage, api } from '../lib/api'
import { CATEGORIES, CATEGORY_LABEL } from '../lib/categories'
import {
  addMonths,
  dayMonthLabel,
  monthGrid,
  monthLabel,
  todayKey,
  weekdayLongFromKey,
  WEEKDAYS_SHORT_RO,
  zonedTime,
  type YearMonth,
} from '../lib/date'
import { useMonthBoard, type DaySlot } from '../lib/useMonthBoard'

function thisMonth(): YearMonth {
  const now = new Date()
  return { year: now.getFullYear(), month: now.getMonth() + 1 }
}

export function AcasaPage() {
  const [month, setMonth] = useState<YearMonth>(thisMonth)
  const [params, setParams] = useSearchParams()
  const board = useMonthBoard(month)

  const selectedDay = params.get('zi')

  function selectDay(key: string | null) {
    const next = new URLSearchParams(params)
    if (key) next.set('zi', key)
    else next.delete('zi')
    setParams(next, { replace: true })
  }

  function step(delta: number) {
    setMonth((m) => addMonths(m, delta))
    selectDay(null)
  }

  return (
    <>
      <Hero />
      <section className="px-5 pb-16 sm:px-12 lg:px-25">
        <div className="mb-6 h-px w-full bg-line" />

        <div className="grid gap-10 lg:grid-cols-[1fr_440px] lg:items-start">
          <div>
            <div className="mb-6 flex items-center justify-between gap-4">
              <h2 className="t-h1 m-0 text-ink sm:text-[26px]">{monthLabel(month)}</h2>
              <div className="flex gap-5">
                <button
                  type="button"
                  onClick={() => step(-1)}
                  className="t-tag cursor-pointer text-ink-muted transition-colors hover:text-ink"
                >
                  Anterior
                </button>
                <button
                  type="button"
                  onClick={() => step(1)}
                  className="t-tag cursor-pointer text-ink-muted transition-colors hover:text-ink"
                >
                  Următor
                </button>
              </div>
            </div>

            {board.status === 'loading' && (
              <p className="t-body text-ink-muted">Se încarcă întâlnirile…</p>
            )}

            {board.status === 'unauthenticated' && <SignInPrompt />}

            {board.status === 'empty' && (
              <p className="t-body text-ink-muted">
                Nicio întâlnire programată în {monthLabel(month).toLocaleLowerCase('ro-RO')}.
                Încearcă luna următoare.
              </p>
            )}

            {board.status === 'error' && (
              <div className="rounded-lg border border-line bg-raised p-4">
                <p className="t-body m-0 text-ink">Nu am putut încărca calendarul.</p>
                <p className="t-body-sm mt-1 mb-3 text-ink-muted">{board.message}</p>
                <Button variant="secondary" onClick={board.refresh}>
                  Încearcă din nou
                </Button>
              </div>
            )}

            {board.status === 'ready' && (
              <MonthGrid
                month={month}
                byDay={board.byDay}
                timeZone={board.event.timeZoneId}
                selectedDay={selectedDay}
                onSelect={selectDay}
              />
            )}

            <Legend />
          </div>

          {board.status === 'ready' && (
            <DayPanel
              dayKey={selectedDay}
              slots={selectedDay ? (board.byDay.get(selectedDay) ?? []) : []}
              timeZone={board.event.timeZoneId}
              onBooked={board.refresh}
            />
          )}
        </div>
      </section>
    </>
  )
}

function Hero() {
  return (
    <section className="flex flex-col gap-6 px-5 pt-6 pb-12 sm:px-12 lg:grid lg:grid-cols-[1fr_460px] lg:items-center lg:gap-16 lg:px-25 lg:pb-16">
      <div className="flex flex-col items-start gap-6">
        <span className="t-tag text-ink-muted">AMiCUS Timișoara</span>
        <h1 className="t-hero m-0 text-ink">Biblioteca Vie</h1>
        <p className="t-quote m-0 max-w-[36ch] text-ink-soft lg:hidden">
          „Împrumută oameni, nu cărți.”
        </p>
        <p className="t-body-lg m-0 max-w-[48ch] text-ink-soft">
          Aici „cărțile” sunt oameni. Alegi o poveste, rezervi o jumătate de oră și stai de
          vorbă. Fără etichete, fără grabă — ascultarea e singura regulă.
        </p>
        <ButtonLink to="/carti">Vezi cărțile</ButtonLink>
      </div>

      <div className="hidden flex-col gap-6 rounded-xl bg-sunken px-10 py-12 lg:flex">
        <p className="t-h1 m-0 text-ink">„Împrumută oameni, nu cărți.”</p>
        <p className="t-quote m-0 text-ink-soft">
          Dincolo de etichete, există o poveste.
        </p>
      </div>
    </section>
  )
}

function SignInPrompt() {
  return (
    <div className="rounded-lg border border-line bg-raised p-6">
      <h3 className="t-h2 m-0 text-ink">Intră în cont ca să vezi calendarul</h3>
      <p className="t-body mt-2 mb-4 text-ink-soft">
        Locurile sunt vizibile doar studenților autentificați.
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <ButtonLink to="/login">Intră în cont</ButtonLink>
        <ButtonLink to="/inregistrare" variant="ghost">
          Creează cont
        </ButtonLink>
      </div>
    </div>
  )
}

interface MonthGridProps {
  month: YearMonth
  byDay: Map<string, DaySlot[]>
  timeZone: string
  selectedDay: string | null
  onSelect: (key: string) => void
}

function MonthGrid({ month, byDay, timeZone, selectedDay, onSelect }: MonthGridProps) {
  const cells = useMemo(() => monthGrid(month), [month])
  const today = todayKey(timeZone)

  return (
    <div>
      <div className="grid grid-cols-7 gap-1">
        {WEEKDAYS_SHORT_RO.map((letter, i) => (
          <span key={i} className="t-label-sm py-1 text-center text-ink-muted">
            {letter}
          </span>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-1">
        {cells.map((cell) => {
          const slots = cell.inMonth ? (byDay.get(cell.key) ?? []) : []
          const marks: DayMark[] = slots.map((s) => ({
            category: s.category,
            taken: !s.slot.isAvailable,
          }))
          return (
            <DayCell
              key={cell.key}
              day={cell.day}
              inMonth={cell.inMonth}
              isToday={cell.key === today}
              isSelected={cell.key === selectedDay}
              marks={marks}
              onSelect={() => onSelect(cell.key)}
            />
          )
        })}
      </div>
    </div>
  )
}

function Legend() {
  return (
    <div className="mt-8 rounded-lg border border-line bg-raised p-4">
      <p className="t-label m-0 text-ink">Cum citești calendarul</p>

      <div className="mt-3 flex gap-6">
        <span className="flex items-center gap-2">
          <Dot category="medical" taken={false} />
          <span className="t-body-sm text-ink-soft">loc liber</span>
        </span>
        <span className="flex items-center gap-2">
          <Dot category="medical" taken />
          <span className="t-body-sm text-ink-soft">loc ocupat</span>
        </span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2.5">
        {CATEGORIES.map((category) => (
          <span key={category} className="flex items-center gap-2">
            <Dot category={category} taken={false} />
            <span className="t-body-sm text-ink-soft">{CATEGORY_LABEL[category]}</span>
          </span>
        ))}
      </div>
    </div>
  )
}

interface DayPanelProps {
  dayKey: string | null
  slots: DaySlot[]
  timeZone: string
  onBooked: () => void
}

function DayPanel({ dayKey, slots, timeZone, onBooked }: DayPanelProps) {
  const navigate = useNavigate()
  const [chosen, setChosen] = useState<string | null>(null)
  const [topic, setTopic] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!dayKey) {
    return (
      <aside className="rounded-xl border border-line bg-raised p-7">
        <p className="t-body m-0 text-ink-muted">
          Alege o zi din calendar ca să vezi întâlnirile disponibile.
        </p>
      </aside>
    )
  }

  const free = slots.filter((s) => s.slot.isAvailable).length
  const chosenSlot = slots.find((s) => s.slot.id === chosen)

  async function book() {
    if (!chosenSlot) return
    setBusy(true)
    setError(null)
    try {
      const booking = await api.createBooking(chosenSlot.slot.id, topic)
      onBooked()
      navigate(`/rezervarile-mele?noua=${booking.id}`)
    } catch (err) {
      // A lost race is not really an error the student caused — refresh the
      // board underneath them so the slot they lost stops looking available.
      setError(bookingErrorMessage(err))
      setChosen(null)
      onBooked()
    } finally {
      setBusy(false)
    }
  }

  return (
    <aside className="flex flex-col gap-4 rounded-xl border border-line bg-raised p-7">
      <span className="t-tag text-ink-muted">{weekdayLongFromKey(dayKey)}</span>
      <h3 className="t-h1 m-0 text-ink">{dayMonthLabel(dayKey)}</h3>
      <p className="t-body m-0 text-ink-muted">
        {slots.length} {slots.length === 1 ? 'întâlnire' : 'întâlniri'} ·{' '}
        {free === 0 ? 'niciun loc liber' : free === 1 ? 'un loc liber' : `${free} locuri libere`}
      </p>

      {slots.map((entry) => {
        const state = entry.slot.isMine
          ? 'al-tau'
          : entry.slot.isAvailable
            ? 'liber'
            : 'ocupat'
        return (
          <div key={entry.slot.id} className="flex flex-col gap-3">
            <SlotRow
              time={zonedTime(entry.slot.startsAt, timeZone)}
              duration={`${entry.minutes} min`}
              title={entry.specialist.fullName}
              category={entry.category}
              tagTo={`/carti/${entry.specialist.specialistId}`}
              state={state}
              selected={chosen === entry.slot.id}
              onSelect={
                state === 'liber'
                  ? () => {
                      setChosen((c) => (c === entry.slot.id ? null : entry.slot.id))
                      setError(null)
                    }
                  : undefined
              }
            />

            {chosen === entry.slot.id && (
              <div className="flex flex-col gap-3 rounded-lg bg-sunken p-4">
                {entry.specialist.bio && (
                  <p className="t-body m-0 text-ink-soft">{entry.specialist.bio}</p>
                )}
                {entry.specialist.location && (
                  <p className="t-body-sm m-0 text-ink-muted">
                    {entry.specialist.location} · {entry.minutes} de minute
                  </p>
                )}

                <label className="flex flex-col gap-1.5">
                  <span className="t-label-sm text-ink-soft">
                    Despre ce ai vrea să vorbiți? (opțional)
                  </span>
                  <textarea
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    rows={2}
                    className="t-body resize-none rounded-md border border-line-mid bg-raised px-3 py-2 text-ink outline-none focus:border-line-strong"
                  />
                </label>

                <Button fullWidth disabled={busy} onClick={book}>
                  {busy
                    ? 'Se rezervă…'
                    : `Rezervă locul de la ${zonedTime(entry.slot.startsAt, timeZone)}`}
                </Button>
              </div>
            )}
          </div>
        )
      })}

      {slots.length === 0 && (
        <p className="t-body m-0 text-ink-muted">Nicio întâlnire în această zi.</p>
      )}

      {error && (
        <p className="t-body-sm m-0 text-danger" role="alert">
          {error}
        </p>
      )}

      <Link to="/carti" className="t-label text-ink no-underline">
        Vezi toate cărțile
      </Link>
    </aside>
  )
}
