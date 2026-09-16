import { ButtonLink } from '../components/Button'

/**
 * Anything that matches no route.
 *
 * Without this the router matches nothing and renders an empty document — a
 * white page with no header, no explanation and no way back. A mistyped URL, a
 * stale bookmark or a link to a page that has since moved all landed there.
 */
export function NegasitPage() {
  return (
    <section className="mx-auto max-w-lg px-5 pt-12 pb-20 text-center">
      <p className="t-tag m-0 text-ink-muted">404</p>
      <h1 className="t-hero mt-2 mb-0 text-ink">Pagina nu există</h1>
      <p className="t-body mt-3 text-ink-soft">
        Linkul pe care l-ai urmat nu duce nicăieri. Poate s-a schimbat adresa sau a fost
        scris greșit.
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <ButtonLink to="/">Înapoi la calendar</ButtonLink>
        <ButtonLink to="/carti" variant="ghost">
          Vezi biblioteca
        </ButtonLink>
      </div>
    </section>
  )
}
