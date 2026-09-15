import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from '../components/Button'
import { ApiError, api, auth } from '../lib/api'

export function ResetareParolaPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const email = params.get('email') ?? ''
  const code = params.get('code') ?? ''

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const badLink = !email || !code

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) {
      setError('Parolele nu coincid.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      await api.resetPassword(email, code, password)
      // Reset done — sign in with the new password so the student lands logged in.
      const { accessToken } = await api.loginWithPassword(email, password)
      auth.set(accessToken)
      navigate('/')
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 400
          ? 'Linkul a expirat sau parola e prea scurtă (minim 10 caractere). Cere un link nou.'
          : 'Resetarea a eșuat. Încearcă din nou.',
      )
    } finally {
      setBusy(false)
    }
  }

  if (badLink) {
    return (
      <section className="mx-auto max-w-sm px-5 pt-6 pb-20">
        <h1 className="t-h1 m-0 text-ink">Link invalid</h1>
        <p className="t-body mt-2 text-ink-soft">
          Linkul de resetare e incomplet. Cere unul nou.
        </p>
        <Link to="/parola-uitata" className="t-body mt-6 inline-block text-ink underline">
          Cere un link nou
        </Link>
      </section>
    )
  }

  return (
    <section className="mx-auto max-w-sm px-5 pt-6 pb-20">
      <h1 className="t-h1 m-0 text-ink">Alege o parolă nouă</h1>
      <p className="t-body mt-2 text-ink-soft">Pentru {email}.</p>

      <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-5">
        <label className="flex flex-col gap-1.5">
          <span className="t-label-sm text-ink-soft">Parolă nouă</span>
          <input
            type="password"
            required
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-xl border border-line px-4 py-3 text-ink outline-none focus:border-primary"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="t-label-sm text-ink-soft">Confirmă parola</span>
          <input
            type="password"
            required
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="rounded-xl border border-line px-4 py-3 text-ink outline-none focus:border-primary"
          />
        </label>
        {error && <p className="t-body text-danger">{error}</p>}
        <Button type="submit" disabled={busy}>
          {busy ? 'Se salvează…' : 'Salvează parola'}
        </Button>
      </form>
    </section>
  )
}
