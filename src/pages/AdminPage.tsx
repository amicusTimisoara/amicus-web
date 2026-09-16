import { useCallback, useEffect, useState } from 'react'
import { Button, ButtonLink } from '../components/Button'
import { ProfileTag } from '../components/ProfileTag'
import { Tag } from '../components/Tag'
import {
  ApiError,
  api,
  type AdminEventSummary,
  type AdminRosterEntry,
  type AdminSpecialist,
  type SpecialistApplication,
} from '../lib/api'
import { fromServerCategory } from '../lib/categories'
import { toProfile } from '../lib/profiles'
import { cx } from '../lib/cx'
import { FIELD_BASE, FIELD_IDLE } from '../lib/forms'
import { useSignedIn } from '../lib/useAuth'

/**
 * The committee's console: the applications waiting to be decided, and the
 * rosters that decide whether an approved „carte” can publish anything.
 *
 * Those two belong on one page because approving alone does nothing useful.
 * A „carte” who is not on a month's roster has every interval refused with
 * "you are not on the roster for any event covering that date", which looks
 * like a bug to them and is invisible to whoever approved them.
 *
 * There is no link to this page anywhere. Access is a server-side role, and the
 * page discovers it by asking: every admin endpoint 403s for a normal account,
 * so a failed first load IS the answer. That avoids putting an "Admin" entry in
 * a menu where it would only ever refuse most of the people who see it.
 */
export function AdminPage() {
  const signedIn = useSignedIn()
  const [state, setState] = useState<'loading' | 'denied' | 'error' | 'ready'>('loading')
  const [applications, setApplications] = useState<SpecialistApplication[]>([])
  const [events, setEvents] = useState<AdminEventSummary[]>([])
  const [specialists, setSpecialists] = useState<AdminSpecialist[]>([])

  const load = useCallback(() => {
    Promise.all([api.adminApplications(), api.adminEvents(), api.adminSpecialists()])
      .then(([apps, evs, sps]) => {
        setApplications(apps)
        setEvents(evs)
        setSpecialists(sps)
        setState('ready')
      })
      .catch((error: unknown) => {
        setState(error instanceof ApiError && error.status === 403 ? 'denied' : 'error')
      })
  }, [])

  useEffect(() => {
    if (!signedIn) return
    load()
  }, [signedIn, load])

  if (!signedIn) {
    return (
      <Shell>
        <p className="t-body mt-2 mb-4 text-ink-soft">Intră în cont ca să continui.</p>
        <ButtonLink to="/login">Intră în cont</ButtonLink>
      </Shell>
    )
  }

  if (state === 'loading') {
    return (
      <Shell>
        <p className="t-body mt-2 text-ink-soft">Se încarcă…</p>
      </Shell>
    )
  }

  if (state === 'denied') {
    return (
      <Shell>
        <p className="t-body mt-2 text-ink-soft">
          Pagina asta e pentru echipa AMiCUS. Contul tău nu are acces.
        </p>
      </Shell>
    )
  }

  if (state === 'error') {
    return (
      <Shell>
        <p className="t-body mt-2 text-danger">Nu am putut încărca consola.</p>
        <button
          type="button"
          onClick={load}
          className="t-body-sm mt-2 cursor-pointer bg-transparent p-0 text-ink underline"
        >
          Încearcă din nou
        </button>
      </Shell>
    )
  }

  const pending = applications.filter((a) => a.status === 'Pending')
  const decided = applications.filter((a) => a.status !== 'Pending')

  return (
    <section className="mx-auto max-w-2xl px-5 pt-6 pb-20">
      <p className="t-tag m-0 text-ink-muted">ADMIN</p>
      <h1 className="t-hero mt-2 mb-0 text-ink">Cereri de la „cărți”</h1>
      <p className="t-body-sm mt-2 text-ink-muted">
        {pending.length === 0
          ? 'Nicio cerere în așteptare.'
          : `${pending.length} ${pending.length === 1 ? 'cerere' : 'cereri'} în așteptare`}
      </p>

      <div className="mt-6 flex flex-col gap-4">
        {pending.map((a) => (
          <ApplicationCard key={a.id} application={a} onDecided={load} />
        ))}
      </div>

      {decided.length > 0 && (
        <details className="mt-8">
          <summary className="t-label cursor-pointer text-ink-soft">
            Cereri închise ({decided.length})
          </summary>
          <ul className="mt-3 flex list-none flex-col gap-2 p-0">
            {decided.map((a) => (
              <li key={a.id} className="t-body-sm text-ink-muted">
                {a.fullName} — {a.status === 'Approved' ? 'aprobată' : 'respinsă'}
                {a.reviewNote ? `: ${a.reviewNote}` : ''}
              </li>
            ))}
          </ul>
        </details>
      )}

      <h2 className="t-h1 mt-12 mb-0 text-ink">Cărțile lunii</h2>
      <p className="t-body-sm mt-2 text-ink-muted">
        O „carte” poate publica intervale doar în lunile în care e pe listă.
      </p>

      <div className="mt-6 flex flex-col gap-4">
        {events.length === 0 ? (
          <p className="t-body text-ink-soft">
            Niciun eveniment încă. Creează unul din API ca să poți adăuga „cărți”.
          </p>
        ) : (
          events.map((e) => (
            <EventCard key={e.id} event={e} specialists={specialists} onChanged={load} />
          ))
        )}
      </div>
    </section>
  )
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <section className="mx-auto max-w-2xl px-5 pt-6 pb-20">
      <p className="t-tag m-0 text-ink-muted">ADMIN</p>
      <h1 className="t-h1 mt-2 mb-0 text-ink">Consola echipei</h1>
      {children}
    </section>
  )
}

function ApplicationCard({
  application,
  onDecided,
}: {
  application: SpecialistApplication
  onDecided: () => void
}) {
  const [busy, setBusy] = useState(false)
  const [rejecting, setRejecting] = useState(false)
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)

  const category = fromServerCategory(application.category)
  const profile = toProfile(application.profile)

  async function decide(action: 'approve' | 'reject') {
    setBusy(true)
    setError(null)
    try {
      if (action === 'approve') await api.approveApplication(application.id)
      else await api.rejectApplication(application.id, note.trim() || null)
      onDecided()
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 409
          ? 'Cererea a fost deja decisă.'
          : 'Nu am putut salva decizia.',
      )
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-line bg-raised p-4">
      <div>
        <h3 className="t-h2 m-0 text-ink">{application.fullName}</h3>
        <p className="t-body-sm m-0 text-ink-muted">
          {application.specialty} · {application.phone}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {category && <Tag category={category} />}
        {profile && <ProfileTag profile={profile} />}
      </div>

      {/* The story is the whole substance of the decision, so it is shown in
          full rather than truncated behind a "read more". */}
      <p className="t-body m-0 whitespace-pre-wrap text-ink-soft">{application.story}</p>

      <p className="t-body-sm m-0 text-ink-muted">
        {application.format === 'Ambele'
          ? 'Fizic sau online'
          : application.format === 'Fizic'
            ? 'Doar fizic'
            : 'Doar online'}
        {application.speaksEnglish ? ' · și în engleză' : ''}
        {application.acceptsSmallGroups ? ' · acceptă grupuri mici' : ''}
      </p>

      {rejecting && (
        <label className="flex flex-col gap-1.5">
          <span className="t-label-sm text-ink-soft">De ce respingi? (se trimite persoanei)</span>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            maxLength={1000}
            placeholder="Ne-ar trebui mai multe detalii despre poveste."
            className={cx(FIELD_BASE, FIELD_IDLE, 'resize-y')}
          />
        </label>
      )}

      {error && (
        <p className="t-body-sm m-0 text-danger" role="alert">
          {error}
        </p>
      )}

      <div className="flex gap-2">
        {rejecting ? (
          <>
            <Button variant="secondary" fullWidth disabled={busy} onClick={() => decide('reject')}>
              {busy ? 'Se salvează…' : 'Confirmă respingerea'}
            </Button>
            <Button variant="ghost" fullWidth disabled={busy} onClick={() => setRejecting(false)}>
              Renunță
            </Button>
          </>
        ) : (
          <>
            <Button fullWidth disabled={busy} onClick={() => decide('approve')}>
              {busy ? 'Se salvează…' : 'Aprobă'}
            </Button>
            <Button variant="ghost" fullWidth disabled={busy} onClick={() => setRejecting(true)}>
              Respinge
            </Button>
          </>
        )}
      </div>
    </div>
  )
}

function EventCard({
  event,
  specialists,
  onChanged,
}: {
  event: AdminEventSummary
  specialists: AdminSpecialist[]
  onChanged: () => void
}) {
  const [roster, setRoster] = useState<AdminRosterEntry[] | null>(null)
  const [adding, setAdding] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadRoster = useCallback(() => {
    api
      .adminRoster(event.id)
      .then(setRoster)
      .catch(() => setError('Nu am putut încărca lista.'))
  }, [event.id])

  useEffect(loadRoster, [loadRoster])

  const onRoster = new Set((roster ?? []).map((r) => r.specialistId))
  const available = specialists.filter((s) => s.isActive && !onRoster.has(s.id))

  // Two people can genuinely share a name and a specialty — the same „carte”
  // recruited twice, or a namesake. Rendering both as "Levi Munteanu — Pastor"
  // leaves an admin picking blind and rostering the wrong one, so a collision
  // gets an id fragment to tell them apart.
  const labelCounts = new Map<string, number>()
  for (const s of available) {
    const key = `${s.fullName} — ${s.specialty}`
    labelCounts.set(key, (labelCounts.get(key) ?? 0) + 1)
  }
  const optionLabel = (s: AdminSpecialist) => {
    const base = `${s.fullName} — ${s.specialty}`
    return (labelCounts.get(base) ?? 0) > 1 ? `${base} · ${s.id.slice(0, 8)}` : base
  }

  async function add() {
    if (!adding) return
    setBusy(true)
    setError(null)
    try {
      await api.assignToEvent(event.id, adding, null)
      setAdding('')
      loadRoster()
      onChanged()
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 409
          ? 'E deja pe listă.'
          : 'Nu am putut adăuga.',
      )
    } finally {
      setBusy(false)
    }
  }

  async function publish() {
    setBusy(true)
    setError(null)
    try {
      await api.publishEvent(event.id)
      onChanged()
    } catch {
      setError('Nu am putut publica evenimentul.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-line bg-raised p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="t-h2 m-0 text-ink">{event.name}</h3>
        <span
          className={cx(
            't-tag rounded-full border px-2.5 py-1',
            event.isPublished ? 'border-line-mid text-ink-soft' : 'border-line text-ink-muted',
          )}
        >
          {event.isPublished ? 'PUBLICAT' : 'CIORNĂ'}
        </span>
      </div>

      <p className="t-body-sm m-0 text-ink-muted">
        {event.startsOn} – {event.endsOn} · {event.slotCount}{' '}
        {event.slotCount === 1 ? 'interval' : 'intervale'}
      </p>

      {roster === null ? (
        <p className="t-body-sm m-0 text-ink-muted">Se încarcă lista…</p>
      ) : roster.length === 0 ? (
        <p className="t-body-sm m-0 text-ink-muted">Nicio „carte” pe listă.</p>
      ) : (
        <ul className="flex list-none flex-col gap-1 p-0">
          {roster.map((r) => (
            <li key={r.eventSpecialistId} className="t-body-sm text-ink-soft">
              {r.fullName} — {r.slotCount} {r.slotCount === 1 ? 'interval' : 'intervale'}
              {r.bookedCount > 0 ? `, ${r.bookedCount} rezervate` : ''}
            </li>
          ))}
        </ul>
      )}

      {error && (
        <p className="t-body-sm m-0 text-danger" role="alert">
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <select
          value={adding}
          onChange={(e) => setAdding(e.target.value)}
          className={cx(FIELD_BASE, FIELD_IDLE, 'flex-1')}
          aria-label={`Adaugă o „carte” la ${event.name} (${event.startsOn})`}
        >
          <option value="">Alege o „carte”…</option>
          {available.map((s) => (
            <option key={s.id} value={s.id}>
              {optionLabel(s)}
            </option>
          ))}
        </select>
        <Button variant="secondary" disabled={busy || !adding} onClick={add}>
          Adaugă
        </Button>
      </div>

      {/* Until the event is published its board is invisible to students, so a
          „carte” can publish intervals nobody can book. */}
      {!event.isPublished && (
        <Button variant="ghost" fullWidth disabled={busy} onClick={publish}>
          Publică evenimentul
        </Button>
      )}
    </div>
  )
}
