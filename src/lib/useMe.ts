import { useEffect, useState } from 'react'
import { api, auth, type AccountInfo } from './api'

/**
 * The signed-in account.
 *
 * Cached at module scope because several places want it (the header on every
 * page, the settings page) and it never changes during a session. Cleared on
 * sign-out so the next account doesn't inherit the previous one's identity.
 */
let cached: AccountInfo | null = null
let inFlight: Promise<AccountInfo> | null = null

export function clearMeCache() {
  cached = null
  inFlight = null
}

export function useMe(): AccountInfo | null {
  const [me, setMe] = useState<AccountInfo | null>(cached)

  // Read during render and depend on it, so signing in mid-session actually
  // triggers the fetch. The header lives in Layout and never remounts, so an
  // effect that only ran on mount would keep showing an anonymous avatar until
  // a full page reload.
  const token = auth.token

  useEffect(() => {
    if (!token || cached) return

    let live = true
    inFlight ??= api.me()

    inFlight
      .then((info) => {
        cached = info
        if (live) setMe(info)
      })
      .catch(() => {
        // A failure here is not worth surfacing: the header falls back to a
        // neutral avatar, and anything that actually needs the account will
        // report its own 401.
        inFlight = null
      })

    return () => {
      live = false
    }
  }, [token])

  return me
}
