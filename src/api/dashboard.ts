import { readActivity, readDashboard, writeActivity, writeDashboard } from '@/db/cache';
import { useCachedQuery } from '@/db/cached-query';
import { api } from '@/lib/api';
import type { Activity, Dashboard } from './types';

export const dashboardKeys = { all: ['dashboard'] as const };
export const activityKeys = { all: ['activity'] as const };

export function useDashboard() {
  return useCachedQuery({
    queryKey: dashboardKeys.all,
    fetcher: () => api.get<Dashboard>('/api/dashboard'),
    readCache: readDashboard,
    writeCache: writeDashboard,
  });
}

export function useActivity() {
  return useCachedQuery({
    queryKey: activityKeys.all,
    fetcher: () => api.get<Activity[]>('/api/dashboard/activity'),
    readCache: readActivity,
    writeCache: writeActivity,
  });
}
