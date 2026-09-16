import { Link } from 'react-router-dom'
import type { Category } from '../lib/categories'
import type { Profile } from '../lib/profiles'
import { initialsOf } from '../lib/initials'
import { ProfileTag } from './ProfileTag'
import { Tag } from './Tag'

interface BookCardProps {
  name: string
  category: Category
  /** The story axis, when the book has been tagged on it. */
  storyProfile?: Profile | null
  description: string | null
  freeCount: number
  to: string
}

function availability(count: number): { label: string; className: string } {
  if (count === 0) return { label: 'Niciun loc liber', className: 'text-ink-muted' }
  if (count === 1) return { label: 'Un loc liber', className: 'text-liber' }
  return { label: `${count} locuri libere`, className: 'text-liber' }
}

/**
 * A human book in the catalogue.
 *
 * A fully booked book keeps its full visual weight and only mutes the
 * availability line — students should still see who exists and read their story,
 * even when there is nothing to reserve this month.
 */
export function BookCard({
  name,
  category,
  storyProfile,
  description,
  freeCount,
  to,
}: BookCardProps) {
  const free = availability(freeCount)

  return (
    <Link
      to={to}
      className="flex flex-col gap-3 rounded-lg border border-line bg-raised p-4 transition-colors hover:border-line-mid"
    >
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="t-label flex size-14 shrink-0 items-center justify-center rounded-full bg-sunken text-ink-soft"
        >
          {initialsOf(name)}
        </span>
        <div className="flex min-w-0 flex-col gap-2">
          <span className="t-h2 truncate text-ink">{name}</span>
          {/* Both axes, wrapping rather than truncating: on a phone the profile
              drops to its own line instead of being cut in half. */}
          <span className="flex flex-wrap items-center gap-1.5">
            <Tag category={category} />
            {storyProfile && <ProfileTag profile={storyProfile} />}
          </span>
        </div>
      </div>

      {description && <p className="t-body m-0 text-ink-soft">{description}</p>}

      <div className="flex items-center justify-between gap-3">
        <span className={`t-label-sm ${free.className}`}>{free.label}</span>
        <span className="t-label text-ink">Vezi povestea</span>
      </div>
    </Link>
  )
}
