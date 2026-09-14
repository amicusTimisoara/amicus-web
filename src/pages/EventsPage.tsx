import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ApiError, api, type EventSummary } from '../lib/api'

type State =
  | { status: 'loading' }
  | { status: 'ready'; events: EventSummary[] }
  | { status: 'unauthenticated' }
  | { status: 'error'; message: string }

export function EventsPage() {
  const [state, setState] = useState<State>({ status: 'loading' })

  useEffect(() => {
    let live = true
    api
      .events()
      .then((events) => live && setState({ status: 'ready', events }))
      .catch((err) => {
        if (!live) return
        if (err instanceof ApiError && err.status === 401) {
          setState({ status: 'unauthenticated' })
        } else {
          setState({ status: 'error', message: String(err.message ?? err) })
        }
      })
    return () => {
      live = false
    }
  }, [])

  if (state.status === 'loading') {
    return <p className="text-neutral-500">Loading events…</p>
  }

  if (state.status === 'unauthenticated') {
    return (
      <div className="rounded-lg border border-neutral-200 bg-white p-6">
        <h1 className="text-xl font-semibold">Events</h1>
        <p className="mt-2 text-neutral-600">
          Sign in to see the events you can book an appointment at.
        </p>
        <Link
          to="/login"
          className="mt-4 inline-block rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800"
        >
          Sign in
        </Link>
      </div>
    )
  }

  if (state.status === 'error') {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-red-800">
        <h1 className="text-xl font-semibold">Something went wrong</h1>
        <p className="mt-2 text-sm">{state.message}</p>
      </div>
    )
  }

  if (state.events.length === 0) {
    return (
      <div>
        <h1 className="text-xl font-semibold">Events</h1>
        <p className="mt-2 text-neutral-600">No published events yet. Check back soon.</p>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-xl font-semibold">Events</h1>
      <ul className="mt-4 space-y-3">
        {state.events.map((event) => (
          <li
            key={event.id}
            className="rounded-lg border border-neutral-200 bg-white p-4 hover:border-emerald-300"
          >
            <div className="font-medium">{event.name}</div>
            <div className="mt-1 text-sm text-neutral-500">
              {event.startsOn} – {event.endsOn}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
