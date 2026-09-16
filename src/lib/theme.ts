import { useSyncExternalStore } from 'react'

export type Theme = 'system' | 'light' | 'dark'

const KEY = 'amicus.theme'

/**
 * Theme choice, stored per browser.
 *
 * Three states, not two: "system" is the default and means *follow the device*,
 * which is different from having chosen light. A two-state toggle would silently
 * pin everyone to light the first time they opened the settings page.
 *
 * The CSS does the actual theming — `:root[data-theme]` and a
 * `prefers-color-scheme` query override the tokens, so nothing here touches a
 * component. This module only records the choice and stamps the attribute.
 */
export function readTheme(): Theme {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw === 'light' || raw === 'dark' || raw === 'system') return raw
  } catch {
    /* private mode or storage blocked — fall through to system */
  }
  return 'system'
}

/** `system` removes the attribute entirely, handing control back to the media query. */
export function applyTheme(theme: Theme) {
  const root = document.documentElement
  if (theme === 'system') root.removeAttribute('data-theme')
  else root.setAttribute('data-theme', theme)
}

const listeners = new Set<() => void>()

function emit() {
  for (const l of listeners) l()
}

export function setTheme(theme: Theme) {
  try {
    if (theme === 'system') localStorage.removeItem(KEY)
    else localStorage.setItem(KEY, theme)
  } catch {
    /* the choice still applies for this page, it just will not persist */
  }
  applyTheme(theme)
  emit()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  // Another tab changing the theme should move this one too.
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      applyTheme(readTheme())
      emit()
    }
  }
  window.addEventListener('storage', onStorage)
  return () => {
    listeners.delete(listener)
    window.removeEventListener('storage', onStorage)
  }
}

export function useTheme(): [Theme, (t: Theme) => void] {
  const theme = useSyncExternalStore(subscribe, readTheme, () => 'system' as Theme)
  return [theme, setTheme]
}

/** What the page is actually showing right now, resolving `system`. */
export function resolvedTheme(theme: Theme): 'light' | 'dark' {
  if (theme !== 'system') return theme
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}
