import { useQuery, type QueryKey } from '@tanstack/react-query';

type CachedQueryArgs<T> = {
  queryKey: QueryKey;
  /** Network fetch — the source of truth when online. */
  fetcher: () => Promise<T>;
  /** Synchronous SQLite read; `undefined` when nothing is cached. */
  readCache: () => T | undefined;
  /** Persist a successful network response to SQLite. */
  writeCache: (data: T) => void;
  enabled?: boolean;
};

/**
 * A read-through `useQuery`: it seeds `initialData` from SQLite so a screen paints
 * cached data on first render, refetches from the network in the background and
 * writes the response back to SQLite, and — if the network fails — serves the
 * cached copy instead of erroring (offline read). Mutations are unchanged and
 * still require connectivity.
 */
export function useCachedQuery<T>({
  queryKey,
  fetcher,
  readCache,
  writeCache,
  enabled,
}: CachedQueryArgs<T>) {
  return useQuery<T>({
    queryKey,
    enabled,
    queryFn: async () => {
      try {
        const data = await fetcher();
        writeCache(data);
        return data;
      } catch (err) {
        const cached = readCache();
        if (cached !== undefined) return cached;
        throw err;
      }
    },
    initialData: () => readCache(),
    // Mark the seeded cache as stale so a background network refetch fires on
    // mount; otherwise `staleTime` would treat the cached data as fresh.
    initialDataUpdatedAt: 0,
  });
}
