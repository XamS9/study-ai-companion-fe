import { useCallback, useEffect, useRef, useState } from 'react';

import { copyToClipboard, isClipboardAvailable } from '@/lib/clipboard';

type UseCopy = { copied: boolean; available: boolean; copy: (text: string) => void };

/**
 * Copies text to the clipboard and exposes a transient `copied` flag that resets
 * after `resetMs` so callers can show brief "Copied" feedback. The reset timer is
 * cleared on unmount. `available` is false when the native clipboard module isn't in
 * the binary (Expo Go / pre-build) — callers should hide the affordance then.
 */
export function useCopy(resetMs = 1500): UseCopy {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const copy = useCallback(
    (text: string) => {
      if (!text) return;
      if (!copyToClipboard(text)) return;
      setCopied(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), resetMs);
    },
    [resetMs],
  );

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  return { copied, available: isClipboardAvailable(), copy };
}
