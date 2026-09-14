# amicus-web

Web client for AMiCUS Timișoara — students browse events and book advice
appointments with visiting specialists. Talks to
[`amicus-api`](https://github.com/amicusTimisoara/amicus-api).

- **Stack:** React 19 · Vite · TypeScript · Tailwind CSS v4 · React Router
- **Package manager:** Bun

## Running it

```bash
bun install
bun dev            # http://localhost:5173
```

In dev, `/api/*` is proxied to the live backend (`https://thorsp.ddns.net/amicus`)
by `vite.config.ts`, so the client uses same-origin relative URLs and there is no
CORS to configure. Point it elsewhere by setting `VITE_API_BASE`.

```bash
bun run build      # tsc -b && vite build  -> dist/
bun run preview    # serve the production build locally
bun run lint       # oxlint
```

## Layout

```
src/lib/api.ts     one typed client: base URL, bearer token, error shape.
                   Contract types mirror the backend's Contracts.cs.
src/Layout.tsx     shell + header + sign-in/out.
src/pages/         EventsPage (lists published events), LoginPage (email+password).
src/main.tsx       routes.
```

The access token is kept in `localStorage` under `amicus.accessToken` and attached
as `Authorization: Bearer` by `src/lib/api.ts` — the single place that knows how a
request is authenticated. A 401 surfaces as a typed `ApiError` so a page can send
the user back to sign in rather than showing a raw failure.

## Auth

Email + password works today (`POST /auth/login`). **Google sign-in is not wired
yet** — the backend already verifies a Google ID token at `POST /auth/google`, but
the button needs the Google Identity Services SDK plus the web origin allow-listed
on the OAuth client in Google Cloud. The API client method (`api.loginWithGoogle`)
is in place; the UI is a placeholder.

## Contributing

`main` is protected: open a PR, get one approval, merge with **squash** (the only
method enabled). CI runs lint + build (type-check included) on every PR.

## Deploying

Not set up yet. It is a static `dist/` — any static host works, and the natural
home is behind the same nginx as the API (a `location /` serving the build, with
`try_files … /index.html` so client-side routes resolve).
