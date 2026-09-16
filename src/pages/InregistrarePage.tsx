import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../components/Button'
import { GoogleButton } from '../components/GoogleButton'
import { PASSWORD_MIN_LENGTH, api, auth, registerErrorMessage } from '../lib/api'
import { cx } from '../lib/cx'
import { FIELD_BASE, FIELD_IDLE } from '../lib/forms'

export function InregistrarePage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const tooShort = password.length > 0 && password.length < PASSWORD_MIN_LENGTH
  // Only complain once they have actually typed something in the second field.
  const mismatch = confirm.length > 0 && confirm !== password

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()

    // Checked here rather than server-side because the API never sees the
    // confirmation field — it only exists to catch a typo in a masked input.
    if (password !== confirm) {
      setError('Parolele nu se potrivesc.')
      return
    }

    setBusy(true)
    setError(null)
    try {
      await api.register(email, password)
      // Identity's register returns no token, so sign in straight away — making
      // someone type the same password twice more would be a poor welcome.
      const { accessToken } = await api.loginWithPassword(email, password)
      auth.set(accessToken)
      navigate('/')
    } catch (err) {
      setError(registerErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }


  return (
    <section className="mx-auto max-w-sm px-5 pt-6 pb-20">
      <h1 className="t-h1 m-0 text-ink">Creează-ți cont</h1>
      <p className="t-body mt-2 text-ink-soft">
        Ai nevoie de un cont ca să rezervi o întâlnire. Durează un minut.
      </p>

      <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-5">
        <label className="flex flex-col gap-1.5">
          <span className="t-label-sm text-ink-soft">Email</span>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={cx(FIELD_BASE, FIELD_IDLE)}
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="t-label-sm text-ink-soft">Parolă</span>
          <input
            id="parola"
            type="password"
            required
            autoComplete="new-password"
            minLength={PASSWORD_MIN_LENGTH}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-describedby="regula-parola"
            className={cx(FIELD_BASE, tooShort ? 'border-danger' : 'border-line-mid')}
          />
          <span
            id="regula-parola"
            className={cx('t-body-sm', tooShort ? 'text-danger' : 'text-ink-muted')}
          >
            Cel puțin {PASSWORD_MIN_LENGTH} caractere. Nu trebuie să conțină simboluri —
            o parolă lungă e mai sigură decât una complicată.
          </span>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="t-label-sm text-ink-soft">Confirmă parola</span>
          <input
            id="confirma-parola"
            type="password"
            required
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className={cx(FIELD_BASE, mismatch ? 'border-danger' : 'border-line-mid')}
          />
          {mismatch && (
            <span className="t-body-sm text-danger">Parolele nu se potrivesc.</span>
          )}
        </label>

        {error && (
          <p className="t-body-sm m-0 text-danger" role="alert">
            {error}
          </p>
        )}

        <Button type="submit" fullWidth disabled={busy || tooShort || mismatch}>
          {busy ? 'Se creează contul…' : 'Creează cont'}
        </Button>
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
        Ai deja cont?{' '}
        <Link to="/login" className="text-ink">
          Intră în cont
        </Link>
      </p>
    </section>
  )
}
