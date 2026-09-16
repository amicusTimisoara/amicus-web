import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button, ButtonLink } from '../components/Button'
import { Switch } from '../components/Switch'
import { Tag } from '../components/Tag'
import { ProfileTag } from '../components/ProfileTag'
import { ApiError, api, type MeetingFormat, type ServerCategory } from '../lib/api'
import { CATEGORIES, type Category } from '../lib/categories'
import { PROFILES, type Profile } from '../lib/profiles'
import { cx } from '../lib/cx'
import { FIELD_BASE, FIELD_IDLE } from '../lib/forms'
import { useSignedIn } from '../lib/useAuth'
import { useMyApplication } from '../lib/useApplication'

/** Our lowercase slug back to the name the server's enum uses. */
const SERVER_CATEGORY: Record<Category, ServerCategory> = {
  spiritual: 'Spiritual',
  mentorat: 'Mentorat',
  medical: 'Medical',
  juridic: 'Juridic',
  cariera: 'Cariera',
  social: 'Social',
}

const FORMATS: { value: MeetingFormat; label: string }[] = [
  { value: 'Fizic', label: 'Fizic' },
  { value: 'Online', label: 'Online' },
  { value: 'Ambele', label: 'Ambele' },
]

/**
 * Applying to become a „carte”.
 *
 * Deliberately absent: how long a meeting lasts. A „carte” picks the start time
 * and the duration when publishing each interval, so it can differ week to week
 * — only format, language and small groups describe the person.
 *
 * Also absent: any code to type. Every application is read by someone on the
 * committee, which the page says up front so nobody waits for a secret that is
 * never coming.
 */
export function DevinoCartePage() {
  const signedIn = useSignedIn()
  const { state, reload } = useMyApplication()

  if (!signedIn) {
    return (
      <section className="mx-auto max-w-lg px-5 pt-6 pb-20">
        <h1 className="t-h1 m-0 text-ink">Devino o „carte”</h1>
        <p className="t-body mt-2 mb-4 text-ink-soft">
          Ai nevoie de un cont ca să trimiți o cerere.
        </p>
        <ButtonLink to="/login">Intră în cont</ButtonLink>
      </section>
    )
  }

  if (state.status === 'loading') {
    return (
      <section className="mx-auto max-w-lg px-5 pt-6 pb-20">
        <p className="t-body m-0 text-ink-soft">Se încarcă…</p>
      </section>
    )
  }

  if (state.status === 'error') {
    return (
      <section className="mx-auto max-w-lg px-5 pt-6 pb-20">
        <h1 className="t-h1 m-0 text-ink">Devino o „carte”</h1>
        <p className="t-body mt-2 text-danger">Nu am putut verifica dacă ai deja o cerere.</p>
        <button
          type="button"
          onClick={reload}
          className="t-body-sm mt-2 cursor-pointer bg-transparent p-0 text-ink underline"
        >
          Încearcă din nou
        </button>
      </section>
    )
  }

  // A decision already exists, or one is pending. Showing the form again would
  // invite a duplicate the server would only refuse.
  if (state.status === 'ready' && state.application.status !== 'Rejected') {
    return <AlreadyApplied status={state.application.status} />
  }

  return (
    <Form
      previousNote={state.status === 'ready' ? state.application.reviewNote : null}
      onSubmitted={reload}
    />
  )
}

function AlreadyApplied({ status }: { status: 'Pending' | 'Approved' }) {
  return (
    <section className="mx-auto max-w-lg px-5 pt-6 pb-20">
      <h1 className="t-hero m-0 text-ink">
        {status === 'Approved' ? 'Ești o „carte”' : 'Cererea ta a fost trimisă'}
      </h1>

      <span className="t-tag mt-4 inline-flex items-center rounded-full border border-line-mid px-3.5 py-1.5 text-ink-soft">
        {status === 'Approved' ? 'APROBATĂ' : 'ÎN ANALIZĂ'}
      </span>

      <p className="t-body mt-4 text-ink-soft">
        {status === 'Approved'
          ? 'Poți începe să publici intervalele în care ești disponibilă. Le găsești în contul tău.'
          : 'Echipa AMiCUS citește fiecare cerere și îți scrie pe email când e aprobată. Nu trebuie să faci nimic între timp.'}
      </p>

      <div className="mt-6">
        <ButtonLink to="/setari">Înapoi la setări</ButtonLink>
      </div>
    </section>
  )
}

function Form({
  previousNote,
  onSubmitted,
}: {
  previousNote: string | null
  onSubmitted: () => void
}) {
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [specialty, setSpecialty] = useState('')
  const [category, setCategory] = useState<Category>('social')
  const [profile, setProfile] = useState<Profile | null>(null)
  const [story, setStory] = useState('')
  const [format, setFormat] = useState<MeetingFormat>('Ambele')
  const [speaksEnglish, setSpeaksEnglish] = useState(false)
  const [acceptsSmallGroups, setAcceptsSmallGroups] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Mirrors the server's own check, so the button explains itself instead of
  // bouncing off a 400.
  const complete =
    fullName.trim() !== '' && phone.trim() !== '' && specialty.trim() !== '' && story.trim() !== ''

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!complete) return

    setBusy(true)
    setError(null)
    try {
      await api.applyAsCarte({
        fullName: fullName.trim(),
        phone: phone.trim(),
        specialty: specialty.trim(),
        category: SERVER_CATEGORY[category],
        profile,
        story: story.trim(),
        format,
        speaksEnglish,
        acceptsSmallGroups,
      })
      onSubmitted()
      navigate('/devino-carte')
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 409
          ? 'Ai deja o cerere trimisă sau ești deja o „carte”.'
          : 'Nu am putut trimite cererea. Încearcă din nou.',
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="mx-auto max-w-lg px-5 pt-6 pb-20">
      <Link to="/setari" className="t-tag text-ink-muted no-underline">
        ÎNAPOI LA SETĂRI
      </Link>

      <h1 className="t-hero mt-3 mb-0 text-ink">Devino o „carte”</h1>
      <p className="t-body mt-2 text-ink-soft">
        Spune-ne cine ești și ce poveste aduci. Echipa AMiCUS citește fiecare cerere și îți
        răspunde pe email. Nu e nevoie de niciun cod.
      </p>

      {previousNote && (
        <div className="mt-5 rounded-lg border border-line bg-raised p-4">
          <p className="t-label-sm m-0 text-ink-muted">Răspunsul la cererea anterioară</p>
          <p className="t-body m-0 mt-1 text-ink-soft">{previousNote}</p>
        </div>
      )}

      <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-8">
        <div className="flex flex-col gap-4">
          <Text label="Nume complet" value={fullName} onChange={setFullName} placeholder="Carolina Ilie" />
          <Text label="Telefon" value={phone} onChange={setPhone} placeholder="07xx xxx xxx" />
          <Text
            label="Cum te prezinți"
            value={specialty}
            onChange={setSpecialty}
            placeholder="Medic de familie"
          />
        </div>

        <Section title="Despre ce poți vorbi" hint="Alege domeniul în care studenții îți pot cere sfatul.">
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <Tag
                key={c}
                category={c}
                active={category === c}
                onClick={() => setCategory(c)}
              />
            ))}
          </div>
        </Section>

        <Section
          title="Ce poveste aduci"
          hint="Alege profilul care te descrie. Poți lăsa gol dacă niciunul nu ți se potrivește."
        >
          <div className="flex flex-wrap gap-2">
            {PROFILES.map((p) => (
              <ProfileTag
                key={p}
                profile={p}
                active={profile === p}
                onClick={() => setProfile(profile === p ? null : p)}
              />
            ))}
          </div>
        </Section>

        <label className="flex flex-col gap-1.5">
          <span className="t-label-sm text-ink-soft">Povestea ta</span>
          <textarea
            value={story}
            onChange={(e) => setStory(e.target.value)}
            rows={6}
            maxLength={4000}
            placeholder="Ce ai trăit și ce ai vrea să afle un student care stă o jumătate de oră cu tine?"
            className={cx(FIELD_BASE, FIELD_IDLE, 'resize-y')}
          />
        </label>

        <Section title="Cum te întâlnești" hint="Poți alege și ambele.">
          <div className="flex flex-wrap gap-2">
            {FORMATS.map((f) => (
              <Chip key={f.value} active={format === f.value} onClick={() => setFormat(f.value)}>
                {f.label}
              </Chip>
            ))}
          </div>
        </Section>

        <Toggle
          title="Pot vorbi și în engleză"
          hint="Pentru studenții internaționali."
          checked={speaksEnglish}
          onChange={setSpeaksEnglish}
        />
        <Toggle
          title="Accept și grupuri mici"
          hint="Un student poate veni cu unul sau doi prieteni."
          checked={acceptsSmallGroups}
          onChange={setAcceptsSmallGroups}
        />

        {error && (
          <p className="t-body-sm m-0 text-danger" role="alert">
            {error}
          </p>
        )}

        <div className="flex flex-col gap-2">
          <Button type="submit" fullWidth disabled={busy || !complete}>
            {busy ? 'Se trimite…' : 'Trimite cererea'}
          </Button>
          <p className="t-body-sm m-0 text-center text-ink-muted">
            Alegi ora de început și durata fiecărui interval mai târziu, când îl publici.
          </p>
        </div>
      </form>
    </section>
  )
}

function Section({
  title,
  hint,
  children,
}: {
  title: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-3">
      <div>
        <h2 className="t-h2 m-0 text-ink">{title}</h2>
        {hint && <p className="t-body-sm m-0 mt-1 text-ink-muted">{hint}</p>}
      </div>
      {children}
    </div>
  )
}

function Text({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder: string
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="t-label-sm text-ink-soft">{label}</span>
      <input
        type="text"
        value={value}
        maxLength={200}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={cx(FIELD_BASE, FIELD_IDLE)}
      />
    </label>
  )
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cx(
        't-label cursor-pointer rounded-full border px-3.5 py-2 transition-colors',
        active ? 'border-line-strong text-ink' : 'border-line text-ink-muted hover:text-ink-soft',
      )}
    >
      {children}
    </button>
  )
}

function Toggle({
  title,
  hint,
  checked,
  onChange,
}: {
  title: string
  hint: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center gap-4">
      <div className="min-w-0 flex-1">
        <p className="t-body m-0 text-ink">{title}</p>
        <p className="t-body-sm m-0 text-ink-muted">{hint}</p>
      </div>
      <Switch checked={checked} onChange={onChange} label={title} />
    </div>
  )
}
