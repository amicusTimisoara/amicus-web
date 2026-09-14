import { Link, Outlet, useNavigate } from 'react-router-dom'
import { auth } from './lib/api'

export function Layout() {
  const navigate = useNavigate()
  const signedIn = auth.token !== null

  return (
    <div className="min-h-dvh bg-neutral-50 text-neutral-900">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <Link to="/" className="text-lg font-semibold tracking-tight">
            AMiCUS <span className="text-emerald-700">Timișoara</span>
          </Link>
          {signedIn ? (
            <button
              type="button"
              onClick={() => {
                auth.clear()
                navigate('/login')
              }}
              className="rounded-md px-3 py-1.5 text-sm font-medium text-neutral-600 hover:bg-neutral-100"
            >
              Sign out
            </button>
          ) : (
            <Link
              to="/login"
              className="rounded-md bg-emerald-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-800"
            >
              Sign in
            </Link>
          )}
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}
