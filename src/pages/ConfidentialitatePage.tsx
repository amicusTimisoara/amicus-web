import { Link } from 'react-router-dom'

const CONTACT = 'aamicustimisoara@gmail.com'

/**
 * Privacy policy. Kept plain and honest about what the app actually stores —
 * an account, an optional Google profile, and the appointments you book. Also
 * the URL Google's OAuth consent screen requires before "Sign in with Google"
 * can be published.
 */
export function ConfidentialitatePage() {
  return (
    <section className="mx-auto max-w-2xl px-5 pt-8 pb-24">
      <h1 className="t-h1 m-0 text-ink">Politica de confidențialitate</h1>
      <p className="t-body-sm mt-2 text-ink-muted">Ultima actualizare: 16 septembrie 2026</p>

      <p className="t-body mt-6 text-ink-soft">
        Biblioteca Vie („The Human Library”) este un proiect al AMiCUS Timișoara. Această pagină
        explică ce date personale colectăm atunci când îți faci cont și rezervi o întâlnire, de ce
        le folosim și ce drepturi ai asupra lor.
      </p>

      <Section title="Ce date colectăm">
        <ul className="t-body mt-2 flex list-disc flex-col gap-2 pl-5 text-ink-soft">
          <li>
            <strong className="text-ink">Contul tău:</strong> adresa de email și numele afișat.
            Dacă îți creezi cont cu parolă, aceasta este stocată criptat (nu o putem citi).
          </li>
          <li>
            <strong className="text-ink">Autentificarea cu Google (opțională):</strong> dacă alegi
            „Continuă cu Google”, primim de la Google doar numele, adresa de email și poza de
            profil. Nu accesăm nimic altceva din contul tău Google.
          </li>
          <li>
            <strong className="text-ink">Rezervările tale:</strong> specialistul ales, data și ora
            întâlnirii și starea de prezență (check-in).
          </li>
        </ul>
      </Section>

      <Section title="De ce le folosim">
        <p className="t-body mt-2 text-ink-soft">
          Folosim aceste date exclusiv pentru a-ți crea și securiza contul, pentru a-ți gestiona
          rezervările și pentru a-ți trimite mesaje legate de cont (confirmarea adresei, resetarea
          parolei). Nu îți trimitem materiale de marketing.
        </p>
      </Section>

      <Section title="Cu cine le partajăm">
        <p className="t-body mt-2 text-ink-soft">
          Nu vindem și nu partajăm datele tale în scopuri de marketing. Ne bazăm pe două servicii
          externe strict pentru funcționarea aplicației:
        </p>
        <ul className="t-body mt-2 flex list-disc flex-col gap-2 pl-5 text-ink-soft">
          <li>
            <strong className="text-ink">Google</strong> — doar dacă folosești autentificarea cu
            Google, pentru a verifica cine ești.
          </li>
          <li>
            <strong className="text-ink">Un serviciu de email</strong> — pentru a trimite mesajele
            de confirmare a adresei și de resetare a parolei.
          </li>
        </ul>
      </Section>

      <Section title="Emailul pe care ți-l trimite Google">
        <p className="t-body mt-2 text-ink-soft">
          Dacă intri în cont cu Google, Google îți trimite automat un email cu un titlu de
          forma „Ai trimis unele date din Contul tău Google”. Este o notificare standard,
          trimisă de Google — nu de noi — prima dată când folosești „Continuă cu Google”
          într-o aplicație. Nu înseamnă că s-a întâmplat ceva neobișnuit.
        </p>
        <p className="t-body mt-3 text-ink-soft">
          Ea confirmă exact ce scrie mai sus: am primit numele, adresa de email și poza ta de
          profil — nimic altceva. Nu avem acces la Gmail, la Drive, la contactele sau la
          calendarul tău și nu putem face nimic în numele tău. Poți vedea și retrage oricând
          accesul din{' '}
          <a
            href="https://myaccount.google.com/connections"
            target="_blank"
            rel="noreferrer"
            className="text-ink underline"
          >
            setările Contului tău Google
          </a>
          .
        </p>
      </Section>

      <Section title="Unde sunt stocate">
        <p className="t-body mt-2 text-ink-soft">
          Datele sunt păstrate pe serverul proiectului și sunt accesibile doar echipei AMiCUS
          Timișoara care administrează aplicația. În browserul tău păstrăm doar un jeton de
          autentificare (ca să rămâi conectat) și preferința de temă (luminos/întunecat).
        </p>
      </Section>

      <Section title="Cât timp le păstrăm">
        <p className="t-body mt-2 text-ink-soft">
          Îți păstrăm datele cât timp ai un cont activ. Poți cere oricând ștergerea contului și a
          datelor asociate, scriindu-ne la adresa de mai jos.
        </p>
      </Section>

      <Section title="Drepturile tale">
        <p className="t-body mt-2 text-ink-soft">
          Conform GDPR, ai dreptul să ceri accesul la datele tale, corectarea lor, ștergerea lor și
          retragerea consimțământului. Pentru oricare dintre acestea, scrie-ne la{' '}
          <a href={`mailto:${CONTACT}`} className="text-ink underline">
            {CONTACT}
          </a>
          .
        </p>
      </Section>

      <Section title="Contact">
        <p className="t-body mt-2 text-ink-soft">
          Pentru orice întrebare legată de confidențialitate, ne poți scrie la{' '}
          <a href={`mailto:${CONTACT}`} className="text-ink underline">
            {CONTACT}
          </a>
          .
        </p>
      </Section>

      <Link to="/" className="t-body mt-10 inline-block text-ink underline">
        Înapoi la aplicație
      </Link>
    </section>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-8">
      <h2 className="t-h2 m-0 text-ink">{title}</h2>
      {children}
    </div>
  )
}
