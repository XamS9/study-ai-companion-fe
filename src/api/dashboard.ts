import {
  readActivity,
  readDashboard,
  readStats,
  writeActivity,
  writeDashboard,
  writeStats,
} from '@/db/cache';
import { useCachedQuery } from '@/db/cached-query';
import { api } from '@/lib/api';
import type { Activity, Dashboard, Stats } from './types';

export const dashboardKeys = { all: ['dashboard'] as const };
export const statsKeys = { all: ['stats'] as const };
export const activityKeys = { all: ['activity'] as const };

export function useDashboard() {
  return useCachedQuery({
    queryKey: dashboardKeys.all,
    fetcher: () => api.get<Dashboard>('/api/dashboard'),
    readCache: readDashboard,
    writeCache: writeDashboard,
  });
}

export function useStats() {
  return useCachedQuery({
    queryKey: statsKeys.all,
    fetcher: () => api.get<Stats>('/api/dashboard/stats'),
    readCache: readStats,
    writeCache: writeStats,
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
