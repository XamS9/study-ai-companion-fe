import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';

import * as schema from './schema';

/**
 * The on-device SQLite handle. expo-sqlite's sync API backs Drizzle's synchronous
 * query methods (`.all()`, `.get()`, `.run()`), which lets the read-through cache
 * hydrate React Query's `initialData` synchronously on first render. Migrations
 * are applied by `DbProvider` before anything reads from `db`.
 */
export const expoDb = openDatabaseSync('studyai.db', { enableChangeListener: false });

export const db = drizzle(expoDb, { schema });
