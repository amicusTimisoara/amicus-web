import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { initialsOf } from '../lib/initials'
import { SlotRow } from '../components/SlotRow'
import { ProfileTag } from '../components/ProfileTag'
import { Tag } from '../components/Tag'
import { addMonths, zonedTime, type YearMonth } from '../lib/date'
import { dayMonthLabel, zonedDayKey, weekdayLongFromKey } from '../lib/date'
import { useBooks } from '../lib/useBooks'
import { useMonthBoard, type DaySlot } from '../lib/useMonthBoard'

function thisMonth(): YearMonth {
  const now = new Date()
  return { year: now.getFullYear(), month: now.getMonth() + 1 }
}

export function CartePage() {
  const { specialistId = '' } = useParams()
  const books = useBooks()
  // Pinned once per mount. Reading the clock during render makes "upcoming"
  // shift under the user on every unrelated re-render.
  const [now] = useState(() => Date.now())

  // Two months, because "următoarele întâlniri" is useless on the 29th if it can
  // only ever look at the current month.
  const current = useMonthBoard(thisMonth())
  const next = useMonthBoard(addMonths(thisMonth(), 1))

  if (books.status === 'loading') {
    return <Shell><p className="t-body text-ink-muted">Se încarcă…</p></Shell>
  }
  if (books.status !== 'ready') {
    return (
      <Shell>
        <p className="t-body text-ink-soft">
          Nu am putut încărca pagina. <Link to="/carti" className="text-ink">Înapoi la cărți</Link>
        </p>
      </Shell>
    )
  }

  const book = books.books.find((b) => b.specialistId === specialistId)
  if (!book) {
    return (
      <Shell>
        <h1 className="t-h1 m-0 text-ink">Cartea nu a fost găsită</h1>
        <p className="t-body mt-2 text-ink-soft">
          Poate nu mai participă la niciun eveniment publicat.{' '}
          <Link to="/carti" className="text-ink">Vezi toate cărțile</Link>
        </p>
      </Shell>
    )
  }

  const upcoming: Array<{ entry: DaySlot; timeZone: string }> = []
  for (const board of [current, next]) {
    if (board.status !== 'ready') continue
    for (const slots of board.byDay.values()) {
      for (const entry of slots) {
        if (entry.specialist.specialistId !== specialistId) continue
        if (new Date(entry.slot.startsAt).getTime() < now) continue
        upcoming.push({ entry, timeZone: board.event.timeZoneId })
      }
    }
  }
  upcoming.sort((a, b) => a.entry.slot.startsAt.localeCompare(b.entry.slot.startsAt))

  return (
    <Shell>
      <div className="grid gap-12 lg:grid-cols-[1fr_440px] lg:items-start lg:gap-20">
        <article className="flex flex-col items-start gap-6">
          <span
            aria-hidden="true"
            className="t-h2 flex size-24 items-center justify-center rounded-full bg-sunken text-ink-soft"
          >
            {initialsOf(book.fullName)}
          </span>

          <h1 className="t-hero m-0 text-ink">{book.fullName}</h1>
          <div className="flex flex-wrap items-center gap-2">
            <Tag category={book.category} />
            {book.storyProfile && <ProfileTag profile={book.storyProfile} />}
          </div>

          {book.bio && <p className="t-body-lg m-0 max-w-[62ch] text-ink-soft">{book.bio}</p>}

          {book.location && (
            <p className="t-body-sm m-0 text-ink-muted">Ne vedem la {book.location}.</p>
          )}

          <p className="t-body-sm m-0 text-ink-muted">
            Specialitate declarată: {book.specialty}
          </p>
        </article>

        <aside className="flex w-full flex-col gap-4 rounded-xl border border-line bg-raised p-7">
          <h2 className="t-h2 m-0 text-ink">Următoarele întâlniri</h2>

          {upcoming.length === 0 ? (
            <p className="t-body m-0 text-ink-muted">
              Nicio întâlnire programată în perioada următoare.
            </p>
          ) : (
            upcoming.slice(0, 6).map(({ entry, timeZone }) => {
              const key = zonedDayKey(entry.slot.startsAt, timeZone)
              return (
                <SlotRow
                  key={entry.slot.id}
                  time={zonedTime(entry.slot.startsAt, timeZone)}
                  duration={`${entry.minutes} min`}
                  // On a book's own page the name and tag are already in the
                  // header above, so the row shows the date instead.
                  title={`${weekdayLongFromKey(key)}, ${dayMonthLabel(key)}`}
                  category={entry.category}
                  showTag={false}
                  state={
                    entry.slot.isMine ? 'al-tau' : entry.slot.isAvailable ? 'liber' : 'ocupat'
                  }
                />
              )
            })
          )}

          <Link to="/" className="t-label text-ink no-underline">
            Rezervă din calendar
          </Link>
        </aside>
      </div>
    </Shell>
  )
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <section className="px-5 pt-2 pb-20 sm:px-12 lg:px-25">
      <Link to="/carti" className="t-tag text-ink-muted no-underline">
        Înapoi la cărți
      </Link>
      <div className="mt-6">{children}</div>
    </section>
  )
}
