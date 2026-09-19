import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ApiError, api, auth } from '../lib/api'

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined
const GSI_SRC = 'https://accounts.google.com/gsi/client'

// Google Identity Services, loaded once and shared across mounts.
interface GoogleId {
  accounts: {
    id: {
      initialize: (config: {
        client_id: string
        callback: (r: { credential: string }) => void
      }) => void
      renderButton: (el: HTMLElement, opts: Record<string, unknown>) => void
    }
  }
}
declare global {
  interface Window {
    google?: GoogleId
  }
}

let gsiPromise: Promise<void> | null = null
function loadGsi(): Promise<void> {
  if (window.google) return Promise.resolve()
  gsiPromise ??= new Promise<void>((resolve, reject) => {
    const s = document.createElement('script')
    s.src = GSI_SRC
    s.async = true
    s.defer = true
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('Could not load Google sign-in.'))
    document.head.appendChild(s)
  })
  return gsiPromise
}

/**
 * Renders Google's own sign-in button. Exchanges the ID token Google returns for
 * an Amicus session at POST /auth/google (the client-side ID-token flow the
 * backend expects). Renders nothing when no client id is configured, so preview
 * builds — whose origin isn't allow-listed on the OAuth client — simply omit it.
 */
export function GoogleButton() {
  const navigate = useNavigate()
  const ref = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!CLIENT_ID || !ref.current) return
    let cancelled = false

    loadGsi()
      .then(() => {
        if (cancelled || !window.google || !ref.current) return
        window.google.accounts.id.initialize({
          client_id: CLIENT_ID,
          callback: async ({ credential }) => {
            try {
              const { accessToken, refreshToken } = await api.loginWithGoogle(credential)
              auth.set(accessToken, refreshToken)
              navigate('/')
            } catch (err) {
              setError(
                err instanceof ApiError && err.status === 401
                  ? 'Contul Google nu este autorizat pentru această aplicație.'
                  : 'Autentificarea cu Google a eșuat.',
              )
            }
          },
        })
        window.google.accounts.id.renderButton(ref.current, {
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'pill',
          locale: 'ro',
          width: 320,
        })
      })
      .catch(() => setError('Nu am putut încărca autentificarea Google.'))

    return () => {
      cancelled = true
    }
  }, [navigate])

  if (!CLIENT_ID) return null

  return (
    <div className="flex flex-col items-center gap-2">
      <div ref={ref} />
      {error && <p className="t-body-sm text-danger">{error}</p>}
      {/*
        Google emails every student the first time they use this button — "Ai
        trimis unele date din Contul tău Google". It is a routine notice from
        Google, but arriving unannounced after signing up to a student project it
        reads like a breach. Saying what we receive, before they click, costs two
        lines and removes the surprise.
      */}
      <p className="t-body-sm m-0 max-w-80 text-center text-ink-muted">
        Primim doar numele, adresa de email și poza de profil. Google îți trimite un email
        de confirmare — e normal.{' '}
        <Link to="/confidentialitate" className="text-ink underline">
          Detalii
        </Link>
      </p>
    </div>
  )
}
