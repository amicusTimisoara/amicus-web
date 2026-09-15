import { useSearchParams } from 'react-router-dom'
import { BookCard } from '../components/BookCard'
import { ButtonLink } from '../components/Button'
import { Tag } from '../components/Tag'
import { CATEGORIES, type Category } from '../lib/categories'
import { useBooks, type Book } from '../lib/useBooks'
import { useMonthBoard } from '../lib/useMonthBoard'

function thisMonth() {
  const now = new Date()
  return { year: now.getFullYear(), month: now.getMonth() + 1 }
}

export function CartiPage() {
  const [params, setParams] = useSearchParams()
  const books = useBooks()
  // Only used for the "N locuri libere" line; the catalogue itself lists every
  // book regardless of whether this particular month has openings.
  const board = useMonthBoard(thisMonth())

  const active = params.get('categorie') as Category | null

  function toggle(category: Category) {
    const next = new URLSearchParams(params)
    if (active === category) next.delete('categorie')
    else next.set('categorie', category)
    setParams(next, { replace: true })
  }

  const freeBySpecialist = new Map<string, number>()
  if (board.status === 'ready') {
    for (const slots of board.byDay.values()) {
      for (const entry of slots) {
        if (!entry.slot.isAvailable) continue
        const id = entry.specialist.specialistId
        freeBySpecialist.set(id, (freeBySpecialist.get(id) ?? 0) + 1)
      }
    }
  }

  return (
    <section className="px-5 pb-16 sm:px-12 lg:px-25">
      <h1 className="t-hero m-0 pt-2 text-ink">Cărțile noastre</h1>
      <p className="t-quote mt-4 mb-6 max-w-[42ch] text-ink-soft">
        „Fiecare om are o poveste care merită ascultată.”
      </p>

      <div className="mb-10 flex flex-wrap gap-2.5">
        {CATEGORIES.map((category) => (
          <Tag
            key={category}
            category={category}
            active={active === null || active === category}
            onClick={() => toggle(category)}
          />
        ))}
      </div>

      {books.status === 'loading' && (
        <p className="t-body text-ink-muted">Se încarcă cărțile…</p>
      )}

      {books.status === 'unauthenticated' && (
        <div className="rounded-lg border border-line bg-raised p-6">
          <h2 className="t-h2 m-0 text-ink">Intră în cont ca să vezi cărțile</h2>
          <p className="t-body mt-2 mb-4 text-ink-soft">
            Poveștile sunt vizibile doar studenților autentificați.
          </p>
          <ButtonLink to="/login">Intră în cont</ButtonLink>
        </div>
      )}

      {books.status === 'error' && (
        <p className="t-body text-ink-soft">
          Nu am putut încărca cărțile: {books.message}
        </p>
      )}

      {books.status === 'ready' && (
        <BookGrid
          books={books.books.filter((b) => !active || b.category === active)}
          freeBySpecialist={freeBySpecialist}
        />
      )}
    </section>
  )
}

function BookGrid({
  books,
  freeBySpecialist,
}: {
  books: Book[]
  freeBySpecialist: Map<string, number>
}) {
  if (books.length === 0) {
    return (
      <p className="t-body text-ink-muted">
        Nicio carte în această categorie deocamdată.
      </p>
    )
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {books.map((book) => (
        <BookCard
          key={book.specialistId}
          name={book.fullName}
          category={book.category}
          description={book.bio}
          freeCount={freeBySpecialist.get(book.specialistId) ?? 0}
          to={`/carti/${book.specialistId}`}
        />
      ))}
    </div>
  )
}
