import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import migrations from './drizzle/migrations';
import { db } from './db';

// React hook — wrap the app root with this and gate render on the returned
// `success` flag so no query runs against an unmigrated DB. Errors surface
// via `error` so the splash / a fallback screen can show them.
export function useOfflineMigrations() {
  return useMigrations(db, migrations);
}
