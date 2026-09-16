import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../components/Button'
import { GoogleButton } from '../components/GoogleButton'
import { ApiError, api, auth } from '../lib/api'
import { cx } from '../lib/cx'
import { FIELD_BASE, FIELD_IDLE } from '../lib/forms'

export function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const { accessToken } = await api.loginWithPassword(email, password)
      auth.set(accessToken)
      navigate('/')
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 401
          ? 'Email sau parolă greșite.'
          : 'Autentificarea a eșuat. Încearcă din nou.',
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="mx-auto max-w-sm px-5 pt-6 pb-20">
      <h1 className="t-h1 m-0 text-ink">Intră în cont</h1>
      <p className="t-body mt-2 text-ink-soft">
        Ca să vezi calendarul și să rezervi o întâlnire.
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

        <label className="flex flex-col gap-1.5">
          <span className="t-label-sm text-ink-soft">Parolă</span>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={cx(FIELD_BASE, FIELD_IDLE)}
          />
        </label>

        {error && (
          <p className="t-body-sm m-0 text-danger" role="alert">
            {error}
          </p>
        )}

        <Button type="submit" fullWidth disabled={busy}>
          {busy ? 'Se conectează…' : 'Intră în cont'}
        </Button>
        <Link to="/parola-uitata" className="t-body -mt-2 text-ink-soft underline">
          Ai uitat parola?
        </Link>
      </form>

      <div className="mt-6 flex items-center gap-3">
        <span className="h-px flex-1 bg-line" />
        <span className="t-body-sm text-ink-muted">sau</span>
        <span className="h-px flex-1 bg-line" />
      </div>
      <div className="mt-6">
        <GoogleButton />
      </div>


      <p className="t-body-sm mt-8 border-t border-line pt-6 text-center text-ink-muted">
        Nu ai cont?{' '}
        <Link to="/inregistrare" className="text-ink">
          Creează-ți unul
        </Link>
      </p>
    </section>
  )
}
