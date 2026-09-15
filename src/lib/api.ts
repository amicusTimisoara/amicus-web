// One place that knows where the backend is and how a bearer token is attached.
//
// Dev: VITE_API_BASE is unset, so requests go to "/api/..." and Vite's proxy
// (vite.config.ts) forwards them to the live backend — same-origin, no CORS.
// Prod: set VITE_API_BASE to the deployed API root, e.g.
//   VITE_API_BASE=https://thorsp.net/amicus
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

export interface SpecialistSummary {
  eventSpecialistId: string
  specialistId: string
  fullName: string
  specialty: string
  bio: string | null
  location: string | null
}

export interface EventDetail {
  event: EventSummary
  specialists: SpecialistSummary[]
}

/**
 * One cell of the shared board. Note what is absent: there is no field for WHO
 * holds a slot. The board is visible to every student and some books are
 * physicians or lawyers, so the server only ever reveals that a slot is taken —
 * and `isMine`, which the caller is entitled to know. Don't add a holder field
 * to this type hoping the server will fill it; it won't.
 */
export interface BoardSlot {
  id: string
  startsAt: string
  endsAt: string
  isAvailable: boolean
  isMine: boolean
}

export interface SpecialistBoard {
  specialist: SpecialistSummary
  slots: BoardSlot[]
}

export type BookingStatus = 'Booked' | 'Cancelled' | 'CheckedIn' | 'Completed' | 'NoShow'

export interface BookingDetail {
  id: string
  slotId: string
  startsAt: string
  endsAt: string
  status: BookingStatus
  topic: string | null
  /** Crockford base32, 10 chars — safe to read aloud when a camera fails. */
  checkInCode: string
  eventSlug: string
  eventName: string
  specialistName: string
  specialty: string
  location: string | null
}

export const api = {
  health: () => request<string>('/health'),
  events: () => request<EventSummary[]>('/events'),
  event: (slug: string) => request<EventDetail>(`/events/${encodeURIComponent(slug)}`),

  /**
   * The shared slot board. `from`/`to` are inclusive `YYYY-MM-DD` days.
   *
   * Always pass a range. A whole multi-week event is a genuinely large response
   * — the backend measured 2016 slots at a 305 MB peak versus 252 MB for a
   * single week — and the endpoint's own docs ask clients to narrow it.
   */
  board: (slug: string, from: string, to: string) => {
    const query = new URLSearchParams({ from, to })
    return request<SpecialistBoard[]>(
      `/events/${encodeURIComponent(slug)}/board?${query}`,
    )
  },

  createBooking: (slotId: string, topic?: string) =>
    request<BookingDetail>('/bookings', {
      method: 'POST',
      body: JSON.stringify({ slotId, topic: topic?.trim() || null }),
    }),

  myBookings: () => request<BookingDetail[]>('/bookings/mine'),

  cancelBooking: (id: string) =>
    request<void>(`/bookings/${encodeURIComponent(id)}/cancel`, { method: 'POST' }),

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

/**
 * Turns a failed booking into something a student can act on.
 *
 * The server distinguishes four ways a booking can fail and says which in the
 * error body; collapsing them into one "ceva n-a mers" would throw away the only
 * part that tells the student what to do next.
 */
export function bookingErrorMessage(error: unknown): string {
  if (!(error instanceof ApiError)) {
    return 'Nu am putut face rezervarea. Verifică legătura la internet și încearcă din nou.'
  }

  const detail = error.message.toLowerCase()

  if (error.status === 409 && detail.includes('just took')) {
    return 'Cineva tocmai a luat locul acesta. Alege altul.'
  }
  if (error.status === 409 && detail.includes('overlap')) {
    return 'Ai deja o rezervare care se suprapune cu acest interval.'
  }
  if (error.status === 400 && detail.includes('already started')) {
    return 'Întâlnirea a început deja. Alege un alt interval.'
  }
  if (error.status === 409) {
    return 'Locul acesta nu mai este disponibil.'
  }
  if (error.status === 401) {
    return 'Trebuie să fii autentificat ca să rezervi un loc.'
  }
  if (error.status === 404) {
    return 'Locul acesta nu mai există.'
  }
  return 'Nu am putut face rezervarea. Încearcă din nou.'
}
