// One place that knows where the backend is and how a bearer token is attached.
//
// Dev: VITE_API_BASE is unset, so requests go to "/api/..." and Vite's proxy
// (vite.config.ts) forwards them to the live backend — same-origin, no CORS.
// Prod: set VITE_API_BASE to the deployed API root, e.g.
//   VITE_API_BASE=https://api.thorsp.net (prod) / https://stage.thorsp.net (stage)
// and requests go straight there.
const API_BASE = import.meta.env.VITE_API_BASE ?? '/api'

const TOKEN_KEY = 'amicus.accessToken'
const REFRESH_KEY = 'amicus.refreshToken'

/**
 * Anything that wants to re-render when the session changes.
 *
 * localStorage is not observable, so a component reading `auth.token` during
 * render has no way to learn that it changed — see `useAuthToken`.
 */
const authListeners = new Set<() => void>()

export const auth = {
  get token(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY)
    } catch {
      return null
    }
  },
  /**
   * The long-lived half of the session.
   *
   * Access tokens from MapIdentityApi last an hour. Storing only that one meant
   * a student who signed in at 10:00 was silently signed out by 11:00 — and
   * worse, only half signed out: the header still saw a string in localStorage
   * and drew the avatar, while every actual request 401'd. This is what lets the
   * hour be renewed instead.
   *
   * In localStorage, like the access token, and exposed to XSS in exactly the
   * same way — no worse than before, but no better either. A cookie-based
   * session would be the real answer if that ever matters.
   */
  get refreshToken(): string | null {
    try {
      return localStorage.getItem(REFRESH_KEY)
    } catch {
      return null
    }
  },
  set(token: string, refreshToken?: string | null) {
    try {
      localStorage.setItem(TOKEN_KEY, token)
      if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken)
    } catch {
      /* private mode / storage disabled — the session just won't persist */
    }
    authListeners.forEach((fn) => fn())
  },
  clear() {
    try {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(REFRESH_KEY)
    } catch {
      /* ignore */
    }
    authListeners.forEach((fn) => fn())
  },
  /** Used by `useAuthToken`; returns an unsubscribe. */
  subscribe(listener: () => void): () => void {
    authListeners.add(listener)
    // A sign-in or sign-out in another tab should move this one too.
    const onStorage = (e: StorageEvent) => {
      if (e.key === TOKEN_KEY) listener()
    }
    window.addEventListener('storage', onStorage)
    return () => {
      authListeners.delete(listener)
      window.removeEventListener('storage', onStorage)
    }
  },
}

export class ApiError extends Error {
  readonly status: number

  /**
   * Identity's validation codes, when the response carried an `errors` map —
   * e.g. `["PasswordTooShort"]`, `["DuplicateEmail"]`. The human-readable
   * strings beside them are English and aimed at developers, so we key our own
   * Romanian wording off these codes instead of showing the server's text.
   */
  readonly codes: readonly string[]

  constructor(status: number, message: string, codes: readonly string[] = []) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.codes = codes
  }
}

/**
 * One renewal at a time.
 *
 * A page load fires several requests at once — the profile, the board, the
 * catalogue. If the hour has just run out they all 401 together, and without
 * this each would start its own refresh, so a single expiry would cost three or
 * four round trips and three or four rotations of the refresh token.
 *
 * Measured against the real API rather than assumed: Identity does rotate the
 * refresh token on every use, but the previous one KEEPS working — the tokens
 * are stateless encrypted tickets, valid until they expire, with nothing to
 * revoke them. So a concurrent double refresh would not break the session. This
 * is about not making four requests where one will do, not about correctness.
 */
let refreshing: Promise<boolean> | null = null

async function renewSession(): Promise<boolean> {
  const refreshToken = auth.refreshToken
  if (!refreshToken) return false

  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    })

    if (!res.ok) {
      // The refresh token itself is expired or revoked. This is the one place
      // that decides a session is genuinely over, so every caller agrees.
      auth.clear()
      return false
    }

    const body = (await res.json()) as AccessTokenResponse
    auth.set(body.accessToken, body.refreshToken)
    return true
  } catch {
    // Offline, or the server is down. Not evidence the session is dead, so the
    // tokens stay and the next attempt can succeed.
    return false
  }
}

async function request<T>(path: string, init: RequestInit = {}, retried = false): Promise<T> {
  const headers = new Headers(init.headers)
  const token = auth.token
  if (token) headers.set('Authorization', `Bearer ${token}`)
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const res = await fetch(`${API_BASE}${path}`, { ...init, headers })

  // An expired hour should be invisible: renew and run the request again.
  //
  // Only when a token was actually sent — a 401 on a request that carried none
  // just means "sign in", and there is nothing to renew or clear. And never for
  // /auth/refresh itself, which would recurse.
  if (res.status === 401 && token && !retried && path !== '/auth/refresh') {
    // Someone else already renewed while this request was in flight, so the
    // token it was sent with is simply stale. Retry with the new one rather than
    // paying for a second refresh that would return an equivalent token.
    if (auth.token !== token) {
      return request<T>(path, init, true)
    }

    refreshing ??= renewSession().finally(() => {
      refreshing = null
    })

    if (await refreshing) {
      return request<T>(path, init, true)
    }

    // Couldn't renew, and `renewSession` has already cleared the session if the
    // refresh token was the problem. If there was no refresh token at all — a
    // session stored before this existed — clear it here, so the header stops
    // claiming someone is signed in while every page says otherwise.
    if (!auth.refreshToken) auth.clear()
  }

  if (!res.ok) {
    // Bubble up a typed error so callers can branch on 401 (re-auth) vs the rest.
    let detail = res.statusText
    let codes: string[] = []
    try {
      const body = await res.json()
      detail = body.error ?? body.title ?? detail
      if (body.errors && typeof body.errors === 'object' && !Array.isArray(body.errors)) {
        codes = Object.keys(body.errors)
      }
    } catch {
      /* non-JSON error body */
    }
    throw new ApiError(res.status, detail, codes)
  }

  // Not every success carries a body: 204 from cancel, but ALSO 200 with an
  // empty body from Identity's /register. Calling res.json() on those throws a
  // SyntaxError that looks nothing like an API failure, so read the text first
  // and only parse when there is something to parse.
  if (res.status === 204) return undefined as T
  const text = await res.text()
  return (text ? JSON.parse(text) : undefined) as T
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
  /**
   * The advice domain, first-class on the server since the category migration.
   * A `SpecialistCategory` name ("Medical", "Juridic", ...) — PascalCase, unlike
   * our lowercase slugs, so it is narrowed in `categories.ts` rather than used raw.
   */
  category: string | null
  /** A `StoryProfile` name ("Pastor", "Tragedie", ...), or null if untagged. */
  profile: string | null
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

  /**
   * Creates an account. Identity answers 200 with an EMPTY body — no token — so
   * a caller that wants the student signed in has to log in straight after.
   */
  register: (email: string, password: string) =>
    request<void>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  /** Sends a password-reset email. Always 200, even for an unknown address. */
  forgotPassword: (email: string) =>
    request<void>('/auth/forgotPassword', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  /** Completes a reset with the code from the email link. */
  resetPassword: (email: string, resetCode: string, newPassword: string) =>
    request<void>('/auth/resetPassword', {
      method: 'POST',
      body: JSON.stringify({ email, resetCode, newPassword }),
    }),

  /** Confirms an email address from the link's userId + code (a GET endpoint). */
  confirmEmail: (userId: string, code: string) => {
    const query = new URLSearchParams({ userId, code })
    return request<string>(`/auth/confirmEmail?${query}`)
  },

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

  me: () => request<AccountInfo>('/account/me'),

  /**
   * The signed-in user's own application. Resolves to undefined when they have
   * never applied — the server answers 204, not 404, because having no
   * application is a normal state rather than a missing resource.
   */
  myApplication: () =>
    request<SpecialistApplication | undefined>('/account/specialist-application'),

  /** The intervals this „carte” has published, inclusive YYYY-MM-DD days. */
  carteSlots: (from: string, to: string) => {
    const query = new URLSearchParams({ from, to })
    return request<CarteSlot[]>(`/account/carte/slots?${query}`)
  },

  /**
   * Publish one interval. Length is per interval, not a property of the person,
   * so it is chosen here rather than once on the application.
   *
   * `day` is YYYY-MM-DD and `startTime` is HH:mm, both WALL-CLOCK in the event's
   * own zone. Deliberately not an instant: turning "the 21st at 16:00" into UTC
   * here made the result depend on the device's clock, so a „carte” publishing
   * from abroad would have booked a student at the wrong hour. The server knows
   * the event's zone and does the conversion.
   */
  publishSlot: (day: string, startTime: string, durationMinutes: number) =>
    request<CarteSlot>('/account/carte/slots', {
      method: 'POST',
      body: JSON.stringify({ day, startTime, durationMinutes }),
    }),

  /** Only works while nobody has booked it; the server answers 409 if they have. */
  withdrawSlot: (id: string) =>
    request<void>(`/account/carte/slots/${encodeURIComponent(id)}`, { method: 'DELETE' }),

  // --- admin console. Every one of these 403s for a normal account, which is
  // how the page decides whether to render itself at all. ---

  adminApplications: (status?: string) => {
    const query = status ? `?${new URLSearchParams({ status })}` : ''
    return request<SpecialistApplication[]>(`/admin/specialist-applications${query}`)
  },

  approveApplication: (id: string) =>
    request<SpecialistApplication>(
      `/admin/specialist-applications/${encodeURIComponent(id)}/approve`,
      { method: 'POST' },
    ),

  rejectApplication: (id: string, note: string | null) =>
    request<SpecialistApplication>(
      `/admin/specialist-applications/${encodeURIComponent(id)}/reject`,
      { method: 'POST', body: JSON.stringify({ note }) },
    ),

  adminEvents: () => request<AdminEventSummary[]>('/admin/events'),

  adminSpecialists: () => request<AdminSpecialist[]>('/admin/specialists'),

  adminRoster: (eventId: string) =>
    request<AdminRosterEntry[]>(`/admin/events/${encodeURIComponent(eventId)}/specialists`),

  /** Puts a „carte” on a month's roster — without this they cannot publish anything. */
  assignToEvent: (eventId: string, specialistId: string, location: string | null) =>
    request<string>(`/admin/events/${encodeURIComponent(eventId)}/specialists`, {
      method: 'POST',
      body: JSON.stringify({ specialistId, location }),
    }),

  publishEvent: (eventId: string) =>
    request<void>(`/admin/events/${encodeURIComponent(eventId)}/publish`, { method: 'POST' }),

  applyAsCarte: (body: SubmitApplication) =>
    request<SpecialistApplication>('/account/specialist-application', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  /** Update the signed-in user's own profile (display name; empty clears it). */
  updateAccount: (displayName: string) =>
    request<AccountInfo>('/account/me', {
      method: 'PATCH',
      body: JSON.stringify({ displayName }),
    }),

  /**
   * Identity's manage endpoint takes the old password alongside the new one —
   * changing a password from an already-signed-in session still requires proving
   * you know the current one, so a borrowed laptop can't lock the owner out.
   */
  changePassword: (oldPassword: string, newPassword: string) =>
    request<AccountInfo>('/auth/manage/info', {
      method: 'POST',
      body: JSON.stringify({ oldPassword, newPassword }),
    }),
}

export interface AccountInfo {
  email: string
  displayName: string | null
  photoUrl: string | null
  isEmailConfirmed: boolean
  /**
   * True once an approved application has linked this account to a Specialist.
   * Travels with the profile rather than being a second request, because the
   * header needs it on every page to mark the avatar.
   */
  isCarte: boolean
}

/** The six advice domains, as the server names them. */
export type ServerCategory =
  | 'Spiritual' | 'Mentorat' | 'Medical' | 'Juridic' | 'Cariera' | 'Social'

/** How a carte is willing to meet. Length is NOT here — that belongs to the slot. */
export type MeetingFormat = 'Fizic' | 'Online' | 'Ambele'

export type ApplicationStatus = 'Pending' | 'Approved' | 'Rejected'

export interface SpecialistApplication {
  id: string
  fullName: string
  phone: string
  specialty: string
  category: string
  profile: string | null
  story: string
  format: MeetingFormat
  speaksEnglish: boolean
  acceptsSmallGroups: boolean
  status: ApplicationStatus
  /** Why it was refused, in the committee's words. Null unless rejected. */
  reviewNote: string | null
  createdAt: string
  reviewedAt: string | null
  specialistId: string | null
}

/**
 * One interval a „carte” has published, on their own calendar.
 *
 * `isBooked` is all they get about a booking — never who took it. They need to
 * know the slot is spoken for so they turn up; the student's identity reaches
 * them at check-in, not from a calendar they might be scrolling in public.
 */
export interface CarteSlot {
  id: string
  startsAt: string
  endsAt: string
  isBooked: boolean
  isBlocked: boolean
  eventSlug: string
  eventName: string
}

export interface AdminEventSummary {
  id: string
  slug: string
  name: string
  startsOn: string
  endsOn: string
  timeZoneId: string
  isPublished: boolean
  specialistCount: number
  slotCount: number
}

export interface AdminRosterEntry {
  eventSpecialistId: string
  specialistId: string
  fullName: string
  specialty: string
  location: string | null
  patternCount: number
  slotCount: number
  bookedCount: number
}

export interface AdminSpecialist {
  id: string
  fullName: string
  specialty: string
  category: string
  profile: string | null
  bio: string | null
  isActive: boolean
}

export interface SubmitApplication {
  fullName: string
  phone: string
  specialty: string
  category: ServerCategory
  profile: string | null
  story: string
  format: MeetingFormat
  speaksEnglish: boolean
  acceptsSmallGroups: boolean
}

/** Minimum password length, mirroring `IdentitySetup.cs`. */
export const PASSWORD_MIN_LENGTH = 10

/**
 * Turns a failed registration into Romanian a student can act on.
 *
 * Keyed off Identity's stable error codes rather than its English messages, and
 * deliberately says which field is wrong — "datele sunt greșite" would leave
 * someone re-typing a perfectly good email because their password was short.
 */
export function registerErrorMessage(error: unknown): string {
  if (!(error instanceof ApiError)) {
    return 'Nu am putut crea contul. Verifică legătura la internet și încearcă din nou.'
  }

  const has = (code: string) => error.codes.some((c) => c.startsWith(code))

  if (has('DuplicateUserName') || has('DuplicateEmail')) {
    return 'Există deja un cont cu acest email. Încearcă să intri în cont.'
  }
  if (has('InvalidEmail')) {
    return 'Adresa de email nu pare validă.'
  }
  if (has('PasswordTooShort')) {
    return `Parola trebuie să aibă cel puțin ${PASSWORD_MIN_LENGTH} caractere.`
  }
  if (has('PasswordRequiresLower')) {
    return 'Parola trebuie să conțină și litere mici.'
  }
  if (has('PasswordRequiresUniqueChars')) {
    return 'Parola trebuie să conțină caractere diferite.'
  }
  if (has('Password')) {
    return 'Parola nu îndeplinește cerințele.'
  }
  return 'Nu am putut crea contul. Încearcă din nou.'
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
