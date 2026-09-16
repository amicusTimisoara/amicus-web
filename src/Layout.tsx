import { Link, Outlet } from 'react-router-dom'
import { TopBar } from './components/TopBar'

export function Layout() {
  return (
    <div className="flex min-h-dvh flex-col bg-page text-ink">
      <TopBar />

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-line px-5 py-8 sm:px-12 lg:px-25">
        <p className="t-quote m-0 text-ink-soft">„Dincolo de etichete, există o poveste.”</p>
        <p className="t-body-sm mt-2 mb-0 text-ink-muted">
          The Human Library · un proiect AMiCUS Timișoara
        </p>
        <Link to="/confidentialitate" className="t-body-sm mt-2 inline-block text-ink-muted underline">
          Politica de confidențialitate
        </Link>
      </footer>
    </div>
  )
}
