import { useCallback, useEffect, useState } from 'react'
import { ApiError, api, type SpecialistApplication } from './api'
import { useAuthToken } from './useAuth'

export type ApplicationState =
  | { status: 'loading' }
  | { status: 'anonymous' }
  /** Signed in, but never applied. The server says 204, which is not an error. */
  | { status: 'none' }
  | { status: 'ready'; application: SpecialistApplication }
  | { status: 'error' }

/**
 * The signed-in user's own „carte” application, if they have one.
 *
 * Not cached at module scope the way `useMe` is: unlike the profile, this
 * changes while you are looking at it — you submit one, and the committee
 * decides on it later — so callers get a `reload` rather than a value frozen at
 * first render.
 *
 * `anonymous` and `loading` are DERIVED during render rather than written from
 * an effect. Writing them in the effect meant a second render every time, and it
 * left a window where the previous account's application was still on screen
 * after a sign-in; keying the stored result to the token it was fetched for
 * closes both.
 */
export function useMyApplication(): { state: ApplicationState; reload: () => void } {
  const token = useAuthToken()
  const [result, setResult] = useState<{ token: string; state: ApplicationState } | null>(null)
  const [nonce, setNonce] = useState(0)

  const reload = useCallback(() => setNonce((n) => n + 1), [])

  useEffect(() => {
    if (!token) return

    let live = true

    api
      .myApplication()
      .then((application) => {
        if (!live) return
        // undefined is the 204: nothing to show, nothing wrong.
        setResult({
          token,
          state: application ? { status: 'ready', application } : { status: 'none' },
        })
      })
      .catch((error: unknown) => {
        if (!live) return
        // A dead session is handled by `useMe`, which clears the token and flips
        // the whole UI to signed out. Reporting it here too would race that.
        setResult({
          token,
          state:
            error instanceof ApiError && error.status === 401
              ? { status: 'anonymous' }
              : { status: 'error' },
        })
      })

    return () => {
      live = false
    }
  }, [token, nonce])

  const state: ApplicationState = !token
    ? { status: 'anonymous' }
    : result?.token === token
      ? result.state
      : { status: 'loading' }

  return { state, reload }
}
