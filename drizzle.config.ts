import type { Config } from 'drizzle-kit';

// Config consumed by `npx drizzle-kit generate` to emit SQL migrations into
// src/offline/drizzle/. Runtime migration (applying those SQL files inside
// the app) is wired separately in src/offline/migrations.ts.
export default {
  schema: './src/offline/schema.ts',
  out: './src/offline/drizzle',
  dialect: 'sqlite',
  driver: 'expo',
} satisfies Config;
