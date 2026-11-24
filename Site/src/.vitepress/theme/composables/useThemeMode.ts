import { ref, onMounted, onBeforeUnmount } from 'vue'

export type ThemePreference = 'system' | 'light' | 'dark'
export type ResolvedTheme = 'light' | 'dark'

const STORAGE_KEY = 'cop-theme-preference'
const themePreference = ref<ThemePreference>('system')
const resolvedTheme = ref<ResolvedTheme>('light')

let mediaQuery: MediaQueryList | null = null
let listenerCount = 0

function computeResolved(pref: ThemePreference): ResolvedTheme {
  if (pref === 'light' || pref === 'dark') return pref
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return 'light'
}

function applyPreference(pref: ThemePreference, save = true) {
  themePreference.value = pref
  const nextResolved = computeResolved(pref)
  resolvedTheme.value = nextResolved

  if (typeof document !== 'undefined') {
    document.documentElement.dataset.theme = nextResolved
  }
  if (save && typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, pref)
    } catch {
      // ignore storage errors
    }
  }
}

function handleSystemChange() {
  if (themePreference.value === 'system') {
    applyPreference('system', false)
  }
}

export function useThemeMode() {
  onMounted(() => {
    let initial: ThemePreference = 'system'
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved === 'system' || saved === 'light' || saved === 'dark') {
        initial = saved
      }
    } catch {
      // default system
    }
    applyPreference(initial, false)

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

  function setThemePreference(pref: ThemePreference) {
    applyPreference(pref, true)
  }

  return {
    themePreference,
    resolvedTheme,
    setThemePreference,
  }
}
