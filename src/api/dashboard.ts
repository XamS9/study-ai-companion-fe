import { readDashboard, writeDashboard } from '@/db/cache';
import { useCachedQuery } from '@/db/cached-query';
import { api } from '@/lib/api';
import type { Dashboard } from './types';

export const dashboardKeys = { all: ['dashboard'] as const };

export function useDashboard() {
  return useCachedQuery({
    queryKey: dashboardKeys.all,
    fetcher: () => api.get<Dashboard>('/api/dashboard'),
    readCache: readDashboard,
    writeCache: writeDashboard,
  });
}
