import { useEffect, useState } from 'react';

import { getAvatarSignedUrl } from '@/lib/storage';

/** Resolves a private avatar object path into a short-lived signed URL. */
export function useAvatarUrl(path?: string | null): string | null {
  const [uri, setUri] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const url = path ? await getAvatarSignedUrl(path).catch(() => null) : null;
      if (active) setUri(url);
    })();
    return () => {
      active = false;
    };
  }, [path]);

  return uri;
}
