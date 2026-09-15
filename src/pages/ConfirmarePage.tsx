import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api } from '../lib/api'

type State = 'working' | 'done' | 'failed' | 'bad-link'

export function ConfirmarePage() {
  const [params] = useSearchParams()
  const userId = params.get('userId') ?? ''
  const code = params.get('code') ?? ''
  const [state, setState] = useState<State>(userId && code ? 'working' : 'bad-link')

  useEffect(() => {
    if (state !== 'working') return
    let live = true
    api
      .confirmEmail(userId, code)
      .then(() => live && setState('done'))
      .catch(() => live && setState('failed'))
    return () => {
      live = false
    }
  }, [state, userId, code])

  const { title, body } = {
    working: { title: 'Se confirmă…', body: 'Un moment.' },
    done: { title: 'Adresă confirmată', body: 'Mulțumim! Contul tău este verificat.' },
    failed: {
      title: 'Nu am putut confirma',
      body: 'Linkul a expirat sau a fost deja folosit. Contul tău funcționează oricum.',
    },
    'bad-link': { title: 'Link invalid', body: 'Linkul de confirmare e incomplet.' },
  }[state]

  return (
    <section className="mx-auto max-w-sm px-5 pt-6 pb-20">
      <h1 className="t-h1 m-0 text-ink">{title}</h1>
      <p className="t-body mt-2 text-ink-soft">{body}</p>
      <Link to="/" className="t-body mt-6 inline-block text-ink underline">
        Mergi la aplicație
      </Link>
    </section>
  )
}
