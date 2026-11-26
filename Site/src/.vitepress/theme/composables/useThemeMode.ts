import {
  useThemeMode as useBaseThemeMode,
  type ThemePreference,
  type ResolvedTheme,
  type AccentScheme,
} from '@valance-ui/vue'

export type { ThemePreference, ResolvedTheme, AccentScheme }

export function useThemeMode() {
  return useBaseThemeMode({
    themeStorageKey: 'cop-theme-preference',
    accentStorageKey: 'cop-accent-scheme',
    syncMetaThemeColor: false,
  })
}
