import { useCallback, useEffect, useState } from 'react'
import {
  ApiError,
  api,
  type BoardSlot,
  type EventSummary,
  type SpecialistSummary,
} from './api'
import { fromServerCategory, toCategory, type Category } from './categories'
import { dateKey, daysInMonth, minutesBetween, zonedDayKey, type YearMonth } from './date'

export interface DaySlot {
  slot: BoardSlot
  specialist: SpecialistSummary
  category: Category
  minutes: number
}

export type BoardState =
  | { status: 'loading' }
  | { status: 'unauthenticated' }
  | { status: 'empty' }
  | { status: 'error'; message: string }
  | {
      status: 'ready'
      event: EventSummary
      specialists: SpecialistSummary[]
      byDay: Map<string, DaySlot[]>
    }

/**
 * Loads one month of the shared slot board.
 *
 * Which event a month belongs to is resolved by date overlap rather than by a
 * slug convention. The backend scopes every slot to an Event with fixed start
 * and end dates, while this app presents a rolling month-by-month calendar —
 * matching on the range means organisers can name events however they like
 * ("Congres 2026", "Biblioteca Vie — octombrie") without the client caring.
 *
 * If a month is covered by more than one event, the earliest-starting one wins.
 * That is a real limitation: overlapping events would need a picker.
 */
export function useMonthBoard(month: YearMonth): BoardState & { refresh: () => void } {
  const [nonce, setNonce] = useState(0)
  const refresh = useCallback(() => setNonce((n) => n + 1), [])

  const { year, month: monthNumber } = month
  const requestKey = `${year}-${monthNumber}-${nonce}`

  // Results are stamped with the request that produced them. Anything stamped
  // with a stale key reads as loading, so switching months never shows the
  // previous month's slots for a frame — and nothing has to setState during the
  // effect to achieve it.
  const [result, setResult] = useState<{ key: string; state: BoardState } | null>(null)

  useEffect(() => {
    let live = true

    const from = dateKey(year, monthNumber, 1)
    const to = dateKey(year, monthNumber, daysInMonth(year, monthNumber))

    async function load() {
      const events = await api.events()
      // Overlap test: the event starts on or before the month ends, and ends on
      // or after the month begins. String comparison is safe on ISO dates.
      const covering = events
        .filter((e) => e.startsOn <= to && e.endsOn >= from)
        .sort((a, b) => a.startsOn.localeCompare(b.startsOn))[0]

      if (!covering) return { status: 'empty' } as const

      const [detail, boards] = await Promise.all([
        api.event(covering.slug),
        api.board(covering.slug, from, to),
      ])

      const byDay = new Map<string, DaySlot[]>()
      for (const board of boards) {
        for (const slot of board.slots) {
          const key = zonedDayKey(slot.startsAt, covering.timeZoneId)
          const entry: DaySlot = {
            slot,
            specialist: board.specialist,
            // The server's category wins, exactly as in `useBooks`. Guessing
            // from the free-text specialty was left here when that was fixed,
            // so one book could be SOCIAL in the catalogue and MENTORAT on the
            // calendar — "Consilier antidrog" trips the `consilier` keyword.
            category:
              fromServerCategory(board.specialist.category) ??
              toCategory(board.specialist.specialty),
            minutes: minutesBetween(slot.startsAt, slot.endsAt),
          }
          const existing = byDay.get(key)
          if (existing) existing.push(entry)
          else byDay.set(key, [entry])
        }
      }
      for (const slots of byDay.values()) {
        slots.sort((a, b) => a.slot.startsAt.localeCompare(b.slot.startsAt))
      }

      return {
        status: 'ready',
        event: covering,
        specialists: detail.specialists,
        byDay,
      } as const
    }

    load()
      .then((next) => {
        if (live) setResult({ key: requestKey, state: next })
      })
      .catch((error: unknown) => {
        if (!live) return
        const state: BoardState =
          error instanceof ApiError && error.status === 401
            ? { status: 'unauthenticated' }
            : {
                status: 'error',
                message: error instanceof Error ? error.message : String(error),
              }
        setResult({ key: requestKey, state })
      })

    return () => {
      live = false
    }
  }, [year, monthNumber, requestKey])

  const state: BoardState =
    result && result.key === requestKey ? result.state : { status: 'loading' }

  return { ...state, refresh }
}
