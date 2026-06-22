/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

/**
 * Palette source of truth: `color schemas.md`. Brand colors are shared across
 * both themes; the `bg*` surface scale and text ramp differ per theme.
 * Existing semantic key names are preserved (consumers reference them by name);
 * the `bg*` tokens map onto them as noted inline.
 */
export const Colors = {
  light: {
    text: '#1A1A2E', //          textPrimary
    textSecondary: '#4A4A6A',
    textMuted: '#9999B8', //     placeholders, disabled
    background: '#F5F5FF', //    bg0 — base screen
    surface: '#EEEEFF', //       bg1 — nav bar, headers
    backgroundElement: '#FFFFFF', //   bg2 — cards, inputs, modals
    backgroundSelected: '#E0E0F5', //  bg3 — elevated, progress track
    inputBackground: '#FFFFFF', //     bg2
    border: '#E0E0F5', //        bg3
    divider: '#1A1A2E1A', //     separator line (10% opacity)
    primary: '#6166F0',
    primaryDim: '#484DCC', //    hover / pressed primary
    primaryText: '#FFFFFF',
    accent: '#61DEC7',
    error: '#F06161', //         danger
    warning: '#FAC543',
    success: '#4DD699',
  },
  dark: {
    text: '#F2F2FA', //          textPrimary
    textSecondary: '#9999B8',
    textMuted: '#616180', //     placeholders, disabled
    background: '#121220', //    bg0 — base screen
    surface: '#19192E', //       bg1 — nav bar, headers
    backgroundElement: '#23233D', //   bg2 — cards, inputs, modals
    backgroundSelected: '#333352', //  bg3 — elevated, progress track
    inputBackground: '#23233D', //     bg2
    border: '#333352', //        bg3
    divider: '#FFFFFF0D', //     separator line (7% opacity)
    primary: '#6166F0',
    primaryDim: '#484DCC', //    hover / pressed primary
    primaryText: '#FFFFFF',
    accent: '#61DEC7',
    error: '#F06161', //         danger
    warning: '#FAC543',
    success: '#4DD699',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
