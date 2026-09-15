# amicus-web

Web client for AMiCUS Timișoara — the **Biblioteca Vie** (Human Library) booking
app. Students sign in, browse a month calendar of visiting "human books"
(specialists), and book a short appointment. Talks to
[`amicus-api`](https://github.com/amicusTimisoara/amicus-api). Live at
**`app.thorsp.net`**.

- **Stack:** React 19 · Vite · TypeScript · Tailwind CSS v4 · React Router
- **Package manager:** Bun

## Running it

```bash
bun install
bun dev            # http://localhost:5173
```

In dev, `/api/*` is proxied to the **stage** backend (`https://stage.thorsp.net`)
by `vite.config.ts`, so the client uses same-origin relative URLs, never touches
prod, and needs no CORS. Point it at a local backend with
`AMICUS_API_PROXY=http://localhost:5080 bun dev`. The deployed builds set
`VITE_API_BASE` directly (prod → `api.thorsp.net`, staging/preview → `stage.thorsp.net`).

```bash
bun run build      # tsc -b && vite build  -> dist/
bun run preview    # serve the production build locally
bun run lint       # oxlint
```

## Layout

```
src/lib/api.ts     one typed client: base URL, bearer token, error shape.
                   Contract types mirror the backend's Contracts.cs.
src/lib/          categories, date/timezone helpers, useBooks / useMonthBoard hooks.
src/components/    Button, GoogleButton, DayCell, SlotRow, BookCard, Tag, Dot, TopBar.
src/pages/         Acasa (calendar + day panel), Carti, Carte, Rezervarile mele,
                   Login, Inregistrare, ResetareParola (/reset), Confirmare (/confirm),
                   ParolaUitata (/parola-uitata).
src/main.tsx       routes.
```

The access token is kept in `localStorage` under `amicus.accessToken` and attached
as `Authorization: Bearer` by `src/lib/api.ts` — the single place that knows how a
request is authenticated. A 401 surfaces as a typed `ApiError` so a page can send
the user back to sign in rather than showing a raw failure.

## Auth

- **Email + password** (`/auth/login`, `/auth/register`). Register auto-signs-in.
- **Google sign-in** (`GoogleButton`, live on production) — Google Identity Services
  gives an ID token, exchanged at `POST /auth/google`. Shown only where the origin
  is OAuth-allow-listed, so `VITE_GOOGLE_CLIENT_ID` is set on the **production build
  only**; staging/preview render email+password.
- **Password reset** — "Ai uitat parola?" → `/parola-uitata` sends an email; its link
  lands on `/reset`. Email confirmation links land on `/confirm`. These routes are
  named to match the backend's `Email:WebResetUrl` / `WebConfirmUrl` exactly.

The access token lives in `localStorage` (`amicus.accessToken`), attached as a
bearer by `src/lib/api.ts`.

## Deployment (Cloudflare Pages)

Symmetric with the API — **main → staging, Release → production** — via
`.github/workflows/deploy.yml`:

| env | trigger | URL | talks to |
|---|---|---|---|
| **production** | a published GitHub **Release** (or manual) | `app.thorsp.net` | `api.thorsp.net` |
| **staging** | push to `main` (or manual) | `staging.amicus-web.pages.dev` | `stage.thorsp.net` |
| **preview** | every PR | `<branch>.amicus-web.pages.dev` | `stage.thorsp.net` |

So a merged PR lands on **staging** (against the stage API); when it looks good,
cut a **Release** to promote to **production**. The Google button ships on
production only (only its origins are allow-listed on the OAuth client). Needs the
`CLOUDFLARE_API_TOKEN` (user-scoped, Pages Edit) + `CLOUDFLARE_ACCOUNT_ID` secrets.

## Contributing

`main` is protected: open a PR, get one approval, merge with **squash** (the only
method enabled). CI runs lint + build (type-check included) on every PR.
