import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../components/Button'
import { api } from '../lib/api'
import { cx } from '../lib/cx'
import { FIELD_BASE, FIELD_IDLE } from '../lib/forms'

export function ParolaUitataPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    try {
      await api.forgotPassword(email)
    } finally {
      // Always the same message — the API answers 200 even for an unknown
      // address, so the page must not reveal whether an account exists.
      setSent(true)
      setBusy(false)
    }
  }

  if (sent) {
    return (
      <section className="mx-auto max-w-sm px-5 pt-6 pb-20">
        <h1 className="t-h1 m-0 text-ink">Verifică-ți emailul</h1>
        <p className="t-body mt-2 text-ink-soft">
          Dacă există un cont cu adresa <span className="text-ink">{email}</span>, ți-am
          trimis un link de resetare a parolei. Verifică și folderul spam.
        </p>
        <Link to="/login" className="t-body mt-6 inline-block text-ink underline">
          Înapoi la autentificare
        </Link>
      </section>
    )
  }

  return (
    <section className="mx-auto max-w-sm px-5 pt-6 pb-20">
      <h1 className="t-h1 m-0 text-ink">Ai uitat parola?</h1>
      <p className="t-body mt-2 text-ink-soft">
        Scrie-ți adresa de email și îți trimitem un link de resetare.
      </p>

      <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-5">
        <label className="flex flex-col gap-1.5">
          <span className="t-label-sm text-ink-soft">Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={cx(FIELD_BASE, FIELD_IDLE)}
          />
        </label>
        <Button type="submit" disabled={busy}>
          {busy ? 'Se trimite…' : 'Trimite linkul'}
        </Button>
      </form>
    </section>
  )
}
