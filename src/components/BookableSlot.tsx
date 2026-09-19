import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ApiError, api, bookingErrorMessage } from '../lib/api'
import { zonedTime } from '../lib/date'
import type { DaySlot } from '../lib/useMonthBoard'
import { Button } from './Button'
import { SlotRow } from './SlotRow'

interface BookableSlotProps {
  entry: DaySlot
  timeZone: string
  /** The row's main line — the book's name on the calendar, the date on its own page. */
  title: string
  tagTo?: string
  showTag?: boolean
  /** False where the bio already sits in the page header and would only repeat. */
  showBio?: boolean
  chosen: boolean
  onChoose: (slotId: string | null) => void
  /** Re-read the board — used on a lost race, not on success. */
  onBooked: () => void
}

/**
 * One slot, and the booking that opens underneath it when chosen.
 *
 * Lives here rather than inside the calendar page because the same slot appears
 * in two places — the day panel and a book's own page — and a student who can
 * book in one and not the other has found a dead end, not a design. Two copies
 * of a booking flow is also how the two drift apart.
 *
 * Only a free slot opens. A taken one still renders, so the day reads as busy
 * rather than empty, but there is nothing to press.
 */
export function BookableSlot({
  entry,
  timeZone,
  title,
  tagTo,
  showTag = true,
  showBio = true,
  chosen,
  onChoose,
  onBooked,
}: BookableSlotProps) {
  const navigate = useNavigate()
  const [topic, setTopic] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const state = entry.slot.isMine ? 'al-tau' : entry.slot.isAvailable ? 'liber' : 'ocupat'

  async function book() {
    setBusy(true)
    setError(null)
    try {
      const booking = await api.createBooking(entry.slot.id, topic)
      navigate(`/rezervarile-mele?noua=${booking.id}`)
    } catch (err) {
      // Losing a race is not a mistake the student made, so the board is
      // refreshed underneath them and the slot they lost stops looking free.
      setError(bookingErrorMessage(err))
      onChoose(null)
      if (err instanceof ApiError) onBooked()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <SlotRow
        time={zonedTime(entry.slot.startsAt, timeZone)}
        duration={`${entry.minutes} min`}
        title={title}
        category={entry.category}
        tagTo={tagTo}
        showTag={showTag}
        state={state}
        selected={chosen}
        onSelect={
          state === 'liber'
            ? () => {
                onChoose(chosen ? null : entry.slot.id)
                setError(null)
              }
            : undefined
        }
      />

      {chosen && (
        <div className="flex flex-col gap-3 rounded-lg bg-sunken p-4">
          {showBio && entry.specialist.bio && (
            <p className="t-body m-0 text-ink-soft">{entry.specialist.bio}</p>
          )}
          <p className="t-body-sm m-0 text-ink-muted">
            {entry.specialist.location
              ? `${entry.specialist.location} · ${entry.minutes} de minute`
              : `${entry.minutes} de minute`}
          </p>

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

          {error && (
            <p className="t-body-sm m-0 text-danger" role="alert">
              {error}
            </p>
          )}

          <Button fullWidth disabled={busy} onClick={book}>
            {busy
              ? 'Se rezervă…'
              : `Rezervă locul de la ${zonedTime(entry.slot.startsAt, timeZone)}`}
          </Button>
        </div>
      )}
    </div>
  )
}
