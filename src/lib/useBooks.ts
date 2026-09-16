import { useEffect, useState } from 'react'
import { ApiError, api, type SpecialistSummary } from './api'
import { fromServerCategory, toCategory, type Category } from './categories'
import { toProfile, type Profile } from './profiles'

export interface Book extends SpecialistSummary {
  /** Narrowed to a slug: the server's value when it sent one, else guessed. */
  category: Category
  /** The story axis. Null until someone tags the book. */
  storyProfile: Profile | null
}

export type BooksState =
  | { status: 'loading' }
  | { status: 'unauthenticated' }
  | { status: 'error'; message: string }
  | { status: 'ready'; books: Book[] }

/**
 * Every human book across all published events.
 *
 * There is no "list all specialists" endpoint for students — the only student-
 * visible source is each event's roster — so this fans out over the published
 * events and dedupes by `specialistId`. A person appearing at three events is
 * one book, not three; `EventSpecialist` exists precisely so someone can return
 * without being re-created.
 *
 * The fan-out is N+1 requests. Fine while an association runs a handful of
 * events; if that stops being true, the backend needs a catalogue endpoint.
 */
export function useBooks(): BooksState {
  const [state, setState] = useState<BooksState>({ status: 'loading' })

  useEffect(() => {
    let live = true

    async function load(): Promise<BooksState> {
      const events = await api.events()
      const details = await Promise.all(events.map((e) => api.event(e.slug)))

      const seen = new Map<string, Book>()
      for (const detail of details) {
        for (const specialist of detail.specialists) {
          if (seen.has(specialist.specialistId)) continue
          seen.set(specialist.specialistId, {
            ...specialist,
            // The server's category wins. `toCategory` stays as the fallback for
            // rows predating the category migration, which still carry only the
            // free-text specialty — guessing from that is strictly worse than
            // being told, so it is second, not first.
            category:
              fromServerCategory(specialist.category) ?? toCategory(specialist.specialty),
            storyProfile: toProfile(specialist.profile),
          })
        }
      }

      const books = [...seen.values()].sort((a, b) =>
        a.fullName.localeCompare(b.fullName, 'ro-RO'),
      )
      return { status: 'ready', books }
    }

    load()
      .then((next) => live && setState(next))
      .catch((error: unknown) => {
        if (!live) return
        if (error instanceof ApiError && error.status === 401) {
          setState({ status: 'unauthenticated' })
        } else {
          setState({
            status: 'error',
            message: error instanceof Error ? error.message : String(error),
          })
        }
      })

    return () => {
      live = false
    }
  }, [])

  return state
}
