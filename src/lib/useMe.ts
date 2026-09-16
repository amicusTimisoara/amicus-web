import { useCallback, useEffect, useSyncExternalStore } from 'react'
import { ApiError, api, auth, type AccountInfo } from './api'
import { useAuthToken } from './useAuth'

/**
 * `anonymous` — nobody is signed in, or the session was just dropped.
 * `loading`   — the profile request is in flight.
 * `ready`     — `me` holds the account.
 * `error`     — the request failed for a reason that is NOT a dead session.
 */
export type MeStatus = 'anonymous' | 'loading' | 'ready' | 'error'

export interface MeState {
  /** The account, once it has loaded. Null in every other status. */
  me: AccountInfo | null
  status: MeStatus
  /** Re-run a failed fetch. A no-op unless `status` is `error`. */
  retry: () => void
}

/**
 * The signed-in account.
 *
 * Held at module scope because several places want it (the header on every page,
 * the settings page) and it does not change during a session. Kept in one
 * snapshot object rather than loose variables so `useSyncExternalStore` can hand
 * every mount the same value — the pattern `useAuthToken` already uses for the
 * token, for the same reason: neither localStorage nor a module variable is
 * observable on its own.
 */
type Snapshot = { me: AccountInfo | null; status: MeStatus }

const ANONYMOUS: Snapshot = { me: null, status: 'anonymous' }

let snapshot: Snapshot = ANONYMOUS
let inFlight: Promise<AccountInfo> | null = null
/**
 * The token `snapshot` describes.
 *
 * Keying on it is what stops one account's identity being shown to the next.
 * Signing in does not clear this cache — `LoginPage` only calls `auth.set` — so
 * a second sign-in without a sign-out in between (straight to /login, or the
 * Google button over a live session) would otherwise leave the previous
 * student's name and photo in the header.
 */
let loadedFor: string | null = null
const listeners = new Set<() => void>()

function publish(next: Snapshot) {
  snapshot = next
  listeners.forEach((fn) => fn())
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/** Forget the account, so the next sign-in doesn't inherit this one's identity. */
export function clearMeCache() {
  inFlight = null
  loadedFor = null
  publish(ANONYMOUS)
}

/** Update the cached account (e.g. after a profile edit) and notify every mount. */
export function setMeCache(info: AccountInfo) {
  publish({ me: info, status: 'ready' })
}

function load() {
  const token = auth.token
  if (!token || inFlight) return

  loadedFor = token
  publish({ me: null, status: 'loading' })

  const request = api.me()
  inFlight = request

  // The token can change while this is in flight (a second sign-in). Landing a
  // response against the wrong session would put one account's profile on
  // another's header, so a stale reply is dropped — and the fetch restarted for
  // whoever is signed in now, because the effect that would have done it has
  // already run. `load` re-reads the token, and stops on its own if there is
  // none because the change was a sign-out.
  const superseded = () => {
    if (auth.token === token) return false
    load()
    return true
  }

  request
    .then((info) => {
      inFlight = null
      if (superseded()) return
      publish({ me: info, status: 'ready' })
    })
    .catch((error: unknown) => {
      inFlight = null
      if (superseded()) return

      // A 401 means the stored token is expired or revoked. Drop it, so the UI
      // honestly shows signed out and offers a way back in. Clearing the token
      // also flips `useAuthToken`, which re-renders every consumer.
      if (error instanceof ApiError && error.status === 401) {
        publish(ANONYMOUS)
        auth.clear()
        return
      }

      // Anything else — the server is down, the browser is offline, or the
      // endpoint simply isn't there — is not evidence that the session is bad,
      // so the token stays. But it is not a reason to keep claiming we are
      // loading either: swallowing it left the header on "…" and the settings
      // page on "Se încarcă…" forever, describing a request that had already
      // failed. Say so instead, and let the caller offer a retry.
      //
      // Not hypothetical: production web once shipped ahead of the API, so
      // /account/me answered 404 for every signed-in user and the UI just sat
      // there.
      publish({ me: null, status: 'error' })
    })
}

export function useMe(): MeState {
  // Read during render and depend on it, so signing in mid-session actually
  // triggers the fetch. The header lives in Layout and never remounts, so an
  // effect that only ran on mount would keep showing an anonymous avatar until
  // a full page reload.
  const token = useAuthToken()
  const current = useSyncExternalStore(subscribe, () => snapshot, () => ANONYMOUS)

  useEffect(() => {
    if (!token) return
    // A token we have not loaded for starts a fetch — including a DIFFERENT
    // token, which is a second sign-in. Once loaded, `error` deliberately does
    // not retry here: a failing endpoint would otherwise be hit again on every
    // mount and every re-render that follows one. Retrying is the reader's
    // call, via `retry`.
    if (token !== loadedFor) load()
  }, [token])

  const retry = useCallback(() => {
    if (snapshot.status === 'error') load()
  }, [])

  return { me: current.me, status: current.status, retry }
}
