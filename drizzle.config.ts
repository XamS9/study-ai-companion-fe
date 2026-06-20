import type { Config } from 'drizzle-kit';

// Local offline database (expo-sqlite). Schema and migrations are added in a
// later session under src/db/. drizzle-kit generates SQL migrations from the
// schema file below; they are applied on-device at runtime.
export default {
  schema: './src/db/schema.ts',
  out: './src/db/migrations',
  dialect: 'sqlite',
  driver: 'expo',
} satisfies Config;
