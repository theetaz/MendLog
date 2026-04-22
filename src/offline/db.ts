import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';
import * as schema from './schema';

// Single shared SQLite connection for the app. `openDatabaseSync` is cheap;
// the name doubles as the file in the app's sandbox
// (iOS: Library/LocalDatabase, Android: database/).
const sqlite = openDatabaseSync('mendlog.db', { enableChangeListener: false });

// Enable FK constraints — sqlite turns them off by default, which would let
// an orphaned photo row survive a job delete and confuse the sync engine.
sqlite.execSync('PRAGMA foreign_keys = ON;');

export const db = drizzle(sqlite, { schema });
export { schema };
export type Db = typeof db;
