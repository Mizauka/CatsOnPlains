import { ref, onMounted, onBeforeUnmount } from 'vue'

export type ThemePreference = 'system' | 'light' | 'dark'
export type ResolvedTheme = 'light' | 'dark'
export type AccentScheme = 'default' | 'swapped'

const THEME_STORAGE_KEY = 'cop-theme-preference'
const ACCENT_STORAGE_KEY = 'cop-accent-scheme'

const themePreference = ref<ThemePreference>('system')
const resolvedTheme = ref<ResolvedTheme>('light')
const accentScheme = ref<AccentScheme>('default')

let mediaQuery: MediaQueryList | null = null
let listenerCount = 0

function computeResolved(pref: ThemePreference): ResolvedTheme {
  if (pref === 'light' || pref === 'dark') return pref
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return 'light'
}

function commitPreference(pref: ThemePreference, save = true) {
  themePreference.value = pref
  const nextResolved = computeResolved(pref)
  resolvedTheme.value = nextResolved

  if (typeof document !== 'undefined') {
    document.documentElement.dataset.theme = nextResolved
  }
  if (save && typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, pref)
    } catch {
      // ignore storage errors
    }
  }
}

function commitAccent(scheme: AccentScheme, save = true) {
  accentScheme.value = scheme
  if (typeof document !== 'undefined') {
    document.documentElement.dataset.accent = scheme
  }
  if (save && typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(ACCENT_STORAGE_KEY, scheme)
    } catch {
      // ignore storage errors
    }
  }
}

function runRippleTransition(updateDom: () => void, event?: MouseEvent) {
  const canTransition =
    typeof document !== 'undefined' && typeof document.startViewTransition === 'function'
  const reducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  if (!canTransition || reducedMotion) {
    updateDom()
    return
  }

  const w = window.innerWidth || document.documentElement.clientWidth
  const h = window.innerHeight || document.documentElement.clientHeight

  const hasPointer = Boolean(event && (event.clientX > 0 || event.clientY > 0))
  const x = hasPointer && event ? event.clientX : w / 2
  const y = hasPointer && event ? event.clientY : h / 2

  // Express center as exact viewport percentages so snapshot scaling / DPI never shifts the origin
  const xPct = `${((x / w) * 100).toFixed(4)}%`
  const yPct = `${((y / h) * 100).toFixed(4)}%`
  const endRadius = `${Math.ceil(Math.hypot(Math.max(x, w - x), Math.max(y, h - y))) + 24}px`

  const root = document.documentElement
  root.style.setProperty('--ripple-x', xPct)
  root.style.setProperty('--ripple-y', yPct)
  root.style.setProperty('--ripple-r', endRadius)
  root.dataset.vtKind = 'ripple'

  const transition = document.startViewTransition(() => {
    updateDom()
  })

  transition.finished.finally(() => {
    if (root.dataset.vtKind === 'ripple') {
      delete root.dataset.vtKind
    }
  })
}

function handleSystemChange() {
  if (themePreference.value === 'system') {
    commitPreference('system', false)
  }
}

export function useThemeMode() {
  onMounted(() => {
    let initialTheme: ThemePreference = 'system'
    let initialAccent: AccentScheme = 'default'
    try {
      const savedTheme = localStorage.getItem(THEME_STORAGE_KEY)
      if (savedTheme === 'system' || savedTheme === 'light' || savedTheme === 'dark') {
        initialTheme = savedTheme
      }
      const savedAccent = localStorage.getItem(ACCENT_STORAGE_KEY)
      if (savedAccent === 'default' || savedAccent === 'swapped') {
        initialAccent = savedAccent
      }
    } catch {
      // ignore storage errors
    }
    commitPreference(initialTheme, false)
    commitAccent(initialAccent, false)

    if (typeof window !== 'undefined' && window.matchMedia) {
      if (!mediaQuery) {
        mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      }
      if (listenerCount === 0) {
        mediaQuery.addEventListener('change', handleSystemChange)
      }
      listenerCount++
    }
  })

  onBeforeUnmount(() => {
    if (listenerCount > 0) {
      listenerCount--
      if (listenerCount === 0 && mediaQuery) {
        mediaQuery.removeEventListener('change', handleSystemChange)
      }
    }
  })

  function setThemePreference(pref: ThemePreference, event?: MouseEvent) {
    const prevResolved = resolvedTheme.value
    const nextResolved = computeResolved(pref)

    if (prevResolved === nextResolved) {
      commitPreference(pref, true)
      return
    }

    runRippleTransition(() => {
      commitPreference(pref, true)
    }, event)
  }

  function setAccentScheme(scheme: AccentScheme, event?: MouseEvent) {
    if (accentScheme.value === scheme) return
    runRippleTransition(() => {
      commitAccent(scheme, true)
    }, event)
  }

  return {
    themePreference,
    resolvedTheme,
    accentScheme,
    setThemePreference,
    setAccentScheme,
  }
}
