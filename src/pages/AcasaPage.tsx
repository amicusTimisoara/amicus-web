import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Button, ButtonLink } from '../components/Button'
import { DayCell, type DayMark } from '../components/DayCell'
import { Dot } from '../components/Dot'
import { BookableSlot } from '../components/BookableSlot'
import { CATEGORIES, CATEGORY_LABEL } from '../lib/categories'
import {
  addMonths,
  dayMonthLabel,
  monthGrid,
  monthLabel,
  todayKey,
  weekdayLongFromKey,
  WEEKDAYS_SHORT_RO,
  type YearMonth,
} from '../lib/date'
import { useMonthBoard, type DaySlot } from '../lib/useMonthBoard'

function thisMonth(): YearMonth {
  const now = new Date()
  return { year: now.getFullYear(), month: now.getMonth() + 1 }
}

/** Stable identity, so an empty month doesn't hand MonthGrid a new Map each render. */
const NO_SLOTS: ReadonlyMap<string, DaySlot[]> = new Map()

/**
 * Used to mark "today" while no event is loaded. Matches `Event.TimeZoneId`'s
 * own default, so the highlighted day doesn't jump once the board arrives.
 */
const DEFAULT_TIME_ZONE = 'Europe/Bucharest'

export function AcasaPage() {
  const [month, setMonth] = useState<YearMonth>(thisMonth)
  const [params, setParams] = useSearchParams()
  const board = useMonthBoard(month)

  const selectedDay = params.get('zi')

  // The grid draws from the month, not from the API, so these fall back rather
  // than gating it — that is what keeps the calendar usable while loading, in a
  // month with no event, and when the board request fails.
  const byDay = board.status === 'ready' ? board.byDay : NO_SLOTS
  const timeZone = board.status === 'ready' ? board.event.timeZoneId : DEFAULT_TIME_ZONE

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

            {/*
              Signed out is the only state with no calendar — the board is
              auth-gated server-side, so there is nothing to draw. Every other
              state still renders the grid: the month itself needs no API data,
              and a plain month calendar is useful even in a month with no
              meetings booked yet.
            */}
            {board.status === 'unauthenticated' ? (
              <SignInPrompt />
            ) : (
              <>
                <MonthGrid
                  month={month}
                  byDay={byDay}
                  timeZone={timeZone}
                  selectedDay={selectedDay}
                  onSelect={selectDay}
                />

                {board.status === 'loading' && (
                  <p className="t-body-sm mt-4 text-ink-muted">Se încarcă întâlnirile…</p>
                )}

                {board.status === 'empty' && (
                  <p className="t-body-sm mt-4 text-ink-muted">
                    Nicio întâlnire programată în{' '}
                    {monthLabel(month).toLocaleLowerCase('ro-RO')}.
                  </p>
                )}

                {board.status === 'error' && (
                  <div className="mt-4 flex flex-wrap items-center gap-3 rounded-lg border border-line bg-raised p-4">
                    <p className="t-body-sm m-0 flex-1 text-ink-muted">
                      Nu am putut încărca întâlnirile: {board.message}
                    </p>
                    <Button variant="secondary" onClick={board.refresh}>
                      Încearcă din nou
                    </Button>
                  </div>
                )}

                <Legend />
              </>
            )}
          </div>

          {board.status !== 'unauthenticated' && (
            <DayPanel
              dayKey={selectedDay}
              slots={selectedDay ? (byDay.get(selectedDay) ?? []) : []}
              timeZone={timeZone}
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
        <h1 className="t-hero m-0 text-ink">The Human Library</h1>
        <p className="t-quote m-0 max-w-[36ch] text-ink-soft lg:hidden">
          „Cărți vii, povești reale.”
        </p>
        <p className="t-body-lg m-0 max-w-[48ch] text-ink-soft">
          Aici „cărțile” sunt oameni. Alegi o poveste, rezervi o jumătate de oră și stai de
          vorbă. Fără etichete, fără grabă — ascultarea e singura regulă.
        </p>
        <ButtonLink to="/carti">Vezi cărțile</ButtonLink>
      </div>

      <div className="hidden flex-col gap-6 rounded-xl bg-sunken px-10 py-12 lg:flex">
        <p className="t-h1 m-0 text-ink">„Cărți vii, povești reale.”</p>
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
  byDay: ReadonlyMap<string, DaySlot[]>
  timeZone: string
  selectedDay: string | null
  /** Null clears the selection — tapping the chosen day again puts it back. */
  onSelect: (key: string | null) => void
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
              // Tapping the chosen day again clears it. Without this a day
              // could be picked but never put back, so the only way out of the
              // panel was to change month and come back.
              onSelect={() => onSelect(cell.key === selectedDay ? null : cell.key)}
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
  // Which slot is open, and nothing else — booking itself lives in BookableSlot.
  const [chosen, setChosen] = useState<string | null>(null)

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

  return (
    <aside className="flex flex-col gap-4 rounded-xl border border-line bg-raised p-7">
      <span className="t-tag text-ink-muted">{weekdayLongFromKey(dayKey)}</span>
      <h3 className="t-h1 m-0 text-ink">{dayMonthLabel(dayKey)}</h3>
      <p className="t-body m-0 text-ink-muted">
        {slots.length} {slots.length === 1 ? 'întâlnire' : 'întâlniri'} ·{' '}
        {free === 0 ? 'niciun loc liber' : free === 1 ? 'un loc liber' : `${free} locuri libere`}
      </p>

      {slots.map((entry) => (
        <BookableSlot
          key={entry.slot.id}
          entry={entry}
          timeZone={timeZone}
          title={entry.specialist.fullName}
          tagTo={`/carti/${entry.specialist.specialistId}`}
          chosen={chosen === entry.slot.id}
          onChoose={setChosen}
          onBooked={onBooked}
        />
      ))}

      {slots.length === 0 && (
        <p className="t-body m-0 text-ink-muted">Nicio întâlnire în această zi.</p>
      )}

      <Link to="/carti" className="t-label text-ink no-underline">
        Vezi toate cărțile
      </Link>
    </aside>
  )
}
