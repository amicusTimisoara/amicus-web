import { useEffect, useState } from 'react'
import { ApiError, api, auth, type AccountInfo } from './api'
import { useAuthToken } from './useAuth'

/**
 * The signed-in account.
 *
 * Cached at module scope because several places want it (the header on every
 * page, the settings page) and it never changes during a session. Cleared on
 * sign-out so the next account doesn't inherit the previous one's identity.
 */
let cached: AccountInfo | null = null
let inFlight: Promise<AccountInfo> | null = null
const listeners = new Set<(v: AccountInfo | null) => void>()

export function clearMeCache() {
  cached = null
  inFlight = null
  listeners.forEach((fn) => fn(null))
}

/** Update the cached account (e.g. after a profile edit) and notify every mount. */
export function setMeCache(info: AccountInfo) {
  cached = info
  listeners.forEach((fn) => fn(info))
}

export function useMe(): AccountInfo | null {
  const [me, setMe] = useState<AccountInfo | null>(cached)
  // Bumped when the stored token turns out to be dead, so the caller re-renders
  // and sees `auth.token` as null.
  const [, forceRender] = useState(0)

  // Read during render and depend on it, so signing in mid-session actually
  // triggers the fetch. The header lives in Layout and never remounts, so an
  // effect that only ran on mount would keep showing an anonymous avatar until
  // a full page reload.
  const token = useAuthToken()

  useEffect(() => {
    listeners.add(setMe)
    return () => {
      listeners.delete(setMe)
    }
  }, [])

  useEffect(() => {
    if (!token || cached) return

    let live = true
    inFlight ??= api.me()

    inFlight
      .then((info) => {
        cached = info
        if (live) setMe(info)
      })
      .catch((error: unknown) => {
        inFlight = null

        // A 401 means the stored token is expired or revoked. Swallowing it left
        // the header on a blank avatar and the settings page saying "Se
        // încarcă…" forever — claiming to be loading something that had already
        // failed. Drop the dead token instead, so the UI honestly shows signed
        // out and offers a way back in.
        if (error instanceof ApiError && error.status === 401) {
          cached = null
          auth.clear()
          if (live) forceRender((n) => n + 1)
        }
        // Anything else (offline, server down) leaves the token alone: the
        // session is probably still good and the next request can retry.
      })

    return () => {
      live = false
    }
  }, [token])

  return me
}
