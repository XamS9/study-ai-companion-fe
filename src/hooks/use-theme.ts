/**
 * Theme resolution. The user's preference (system/light/dark) lives in the
 * theme store; when it is 'system' we fall back to the OS color scheme.
 *
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeStore } from '@/store/theme';

/** Resolves the active 'light' | 'dark' scheme from preference + system. */
export function useResolvedScheme(): 'light' | 'dark' {
  const mode = useThemeStore((s) => s.mode);
  const system = useColorScheme();
  if (mode === 'system') {
    return system === 'dark' ? 'dark' : 'light';
  }
  return mode;
}

export function useTheme() {
  const scheme = useResolvedScheme();
  return Colors[scheme];
}
