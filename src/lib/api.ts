// One place that knows where the backend is and how a bearer token is attached.
//
// Dev: VITE_API_BASE is unset, so requests go to "/api/..." and Vite's proxy
// (vite.config.ts) forwards them to the live backend — same-origin, no CORS.
// Prod: set VITE_API_BASE to the deployed API root, e.g.
//   VITE_API_BASE=https://thorsp.ddns.net/amicus
// and requests go straight there.
const API_BASE = import.meta.env.VITE_API_BASE ?? '/api'

const TOKEN_KEY = 'amicus.accessToken'

export const auth = {
  get token(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY)
    } catch {
      return null
    }
  },
  set(token: string) {
    try {
      localStorage.setItem(TOKEN_KEY, token)
    } catch {
      /* private mode / storage disabled — the session just won't persist */
    }
  },
  clear() {
    try {
      localStorage.removeItem(TOKEN_KEY)
    } catch {
      /* ignore */
    }
  },
}

export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers)
  const token = auth.token
  if (token) headers.set('Authorization', `Bearer ${token}`)
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const res = await fetch(`${API_BASE}${path}`, { ...init, headers })

  if (!res.ok) {
    // Bubble up a typed error so callers can branch on 401 (re-auth) vs the rest.
    let detail = res.statusText
    try {
      const body = await res.json()
      detail = body.error ?? body.title ?? detail
    } catch {
      /* non-JSON error body */
    }
    throw new ApiError(res.status, detail)
  }

  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

// --- shapes mirrored from the backend's Contracts.cs (kept deliberately small;
// grow them as endpoints are consumed) ---
export interface EventSummary {
  id: string
  slug: string
  name: string
  startsOn: string
  endsOn: string
  timeZoneId: string
}

export interface AccessTokenResponse {
  accessToken: string
  refreshToken: string
  expiresIn: number
}

export const api = {
  health: () => request<string>('/health'),
  events: () => request<EventSummary[]>('/events'),

  loginWithPassword: (email: string, password: string) =>
    request<AccessTokenResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  loginWithGoogle: (idToken: string) =>
    request<AccessTokenResponse>('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ idToken }),
    }),

  me: () => request<{ email: string; isEmailConfirmed: boolean }>('/auth/manage/info'),
}
