import { useEffect, useState } from 'react';

import { getMaterialFileSignedUrl } from '@/lib/storage';

/** Resolves a private material file object path into a short-lived signed URL. */
export function useMaterialFileUrl(path?: string | null): string | null {
  const [uri, setUri] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const url = path ? await getMaterialFileSignedUrl(path).catch(() => null) : null;
      if (active) setUri(url);
    })();
    return () => {
      active = false;
    };
  }, [path]);

  return uri;
}
