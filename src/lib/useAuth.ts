import { useSyncExternalStore } from 'react'
import { auth } from './api'

/**
 * The access token, as reactive state.
 *
 * Reading `auth.token` directly during render looks equivalent and is not:
 * localStorage is not observable, so the component only picks up a change if
 * something else happens to re-render it.
 *
 * That bit the header. `TopBar` holds no state, takes no props, and consumes no
 * router context itself — only the `NavLink`s inside it do. So after signing in,
 * React re-rendered those links and never re-ran TopBar's body, leaving it
 * showing "Intră în cont" to a user who was already signed in, until a full page
 * reload. Subscribing fixes it at the source rather than forcing a re-render at
 * each call site.
 */
export function useAuthToken(): string | null {
  return useSyncExternalStore(
    auth.subscribe,
    () => auth.token,
    () => null, // server render has no session
  )
}

export function useSignedIn(): boolean {
  return useAuthToken() !== null
}
