import { NativeModules, TurboModuleRegistry } from 'react-native';

/**
 * Guarded wrapper around `@react-native-clipboard/clipboard`.
 *
 * That package's entrypoint calls `TurboModuleRegistry.getEnforcing('RNCClipboard')`
 * at import time, which **throws** in any binary that doesn't contain the native
 * module — Expo Go, or a dev build compiled before the package was installed. So we
 * never import it statically: we first probe the native registry and only `require`
 * the module when it's actually present. Callers should feature-detect via
 * `isClipboardAvailable()` and degrade gracefully (see `useCopy` / `CopyButton`).
 *
 * `RNCClipboard` is a community RN module (TurboModule registry), not an Expo module,
 * so `requireOptionalNativeModule` from expo-modules-core does NOT detect it.
 */
type ClipboardModule = { setString: (text: string) => void };

let resolved = false;
let nativeClipboard: ClipboardModule | null = null;

function resolveClipboard(): ClipboardModule | null {
  if (resolved) return nativeClipboard;
  resolved = true;

  const present =
    TurboModuleRegistry.get('RNCClipboard') != null || NativeModules.RNCClipboard != null;
  if (present) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    nativeClipboard = require('@react-native-clipboard/clipboard').default as ClipboardModule;
  }
  return nativeClipboard;
}

/** True when the native clipboard module is in this binary (needs a dev/prod build). */
export const isClipboardAvailable = (): boolean => resolveClipboard() != null;

/** Copies text to the clipboard. Returns false when the native module is unavailable. */
export const copyToClipboard = (text: string): boolean => {
  const clipboard = resolveClipboard();
  if (!clipboard) return false;
  clipboard.setString(text);
  return true;
};
