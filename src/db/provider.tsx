import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import type { ReactNode } from 'react';

import { Splash } from '@/components/ui/splash';

import { db } from './client';
import migrations from './migrations/migrations';

/**
 * Applies pending SQLite migrations on boot, then renders the app. The cache
 * layer assumes its tables exist, so children must not render until migrations
 * settle. A migration failure is non-fatal: we log it and render anyway, since
 * the cache helpers degrade to network-only (`@/db/cache` guards every query),
 * so a broken local DB should never block a user who has connectivity.
 */
export function DbProvider({ children }: { children: ReactNode }) {
  const { success, error } = useMigrations(db, migrations);

  if (error) {
    console.error('[db] migration failed; running network-only', error);
    return <>{children}</>;
  }

  if (!success) return <Splash />;

  return <>{children}</>;
}
