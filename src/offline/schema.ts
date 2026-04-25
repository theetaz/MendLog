import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

// Offline-first schema. Rows carry their own sync metadata so the sync engine
// can drain local mutations to Supabase and reconcile pulls without extra joins.
//
// IDs are client-generated UUIDs (via expo-crypto.randomUUID). The cloud
// retains its `bigserial` PKs; we store the integer returned from Supabase
// after first push in `server_id`. Reads key on the local UUID; sync keys on
// `server_id` once present.

export const SYNC_STATES = [
  'synced',
  'pending_insert',
  'pending_update',
  'pending_delete',
] as const;
export type SyncState = (typeof SYNC_STATES)[number];

// Columns every synced row carries. Spread these into each table definition.
const syncCols = {
  id: text('id').primaryKey(), // client UUID
  server_id: integer('server_id'), // null until first push succeeds
  user_id: text('user_id').notNull(), // Supabase auth uid
  sync_state: text('sync_state').notNull().$type<SyncState>().default('pending_insert'),
  updated_at: integer('updated_at').notNull(), // ms since epoch
  deleted_at: integer('deleted_at'), // tombstone, ms
  created_at: integer('created_at').notNull(),
} as const;

export const jobs = sqliteTable('jobs', {
  ...syncCols,
  machine: text('machine').notNull(),
  dept: text('dept').notNull(),
  inv: text('inv'),
  date: text('date').notNull(), // YYYY-MM-DD
  reported_time: text('reported_time').notNull(), // HH:MM[:SS]
  completed_at: text('completed_at'), // ISO datetime
  idle_minutes: integer('idle_minutes').notNull().default(0),
  status: text('status').notNull().default('open'), // job_status enum value
  lang: text('lang').notNull().default('en'), // job_lang enum value
  description: text('description').notNull().default(''),
  root_cause: text('root_cause').notNull().default(''),
  corrective_action: text('corrective_action').notNull().default(''),
  remarks: text('remarks').notNull().default(''),
});

export const job_photos = sqliteTable('job_photos', {
  ...syncCols,
  job_id: text('job_id').notNull(), // FK → jobs.id (local UUID)
  local_uri: text('local_uri'), // file:// on device; null after cleanup
  storage_path: text('storage_path'), // Supabase path; null until uploaded
  mime_type: text('mime_type').notNull(),
  width: integer('width'),
  height: integer('height'),
  blurhash: text('blurhash'),
  ai_description: text('ai_description'),
  ai_tags: text('ai_tags'), // JSON-encoded string[]
  status: text('status').notNull().default('pending'), // pending|annotating|done|error
  error: text('error'),
  upload_state: text('upload_state').notNull().default('pending'), // pending|uploading|uploaded|failed
  upload_attempts: integer('upload_attempts').notNull().default(0),
  upload_error: text('upload_error'),
  // ms epoch of the last upload attempt — drives the per-row backoff so a
  // burst of syncs while offline can't burn the attempt budget in seconds.
  last_attempt_at: integer('last_attempt_at').notNull().default(0),
});

export const job_clips = sqliteTable('job_clips', {
  ...syncCols,
  job_id: text('job_id'), // nullable — clips can be recorded before a job is saved
  local_uri: text('local_uri'),
  audio_path: text('audio_path'),
  duration_ms: integer('duration_ms').notNull().default(0),
  transcript_raw: text('transcript_raw'),
  transcript_clean: text('transcript_clean'),
  transcript_en_raw: text('transcript_en_raw'),
  transcript_en_clean: text('transcript_en_clean'),
  status: text('status').notNull().default('pending'),
  error: text('error'),
  upload_state: text('upload_state').notNull().default('pending'),
  upload_attempts: integer('upload_attempts').notNull().default(0),
  upload_error: text('upload_error'),
  last_attempt_at: integer('last_attempt_at').notNull().default(0),
});

// Catalog mirror — read-only reference data fetched from the server in bulk.
// No sync_state / deleted_at / server_id fields because the client never
// mutates these: a metadata sync just truncates the table and refills it.
export const departments = sqliteTable('departments', {
  id: integer('id').primaryKey(), // server id, mirrored 1:1
  name: text('name').notNull(),
  sort_order: integer('sort_order').notNull().default(0),
});

export const machines = sqliteTable('machines', {
  id: integer('id').primaryKey(),
  department_id: integer('department_id').notNull(),
  name: text('name').notNull(),
  sort_order: integer('sort_order').notNull().default(0),
  inventory_number: text('inventory_number'),
});

// Key/value store for sync cursors — e.g. `jobs.last_pulled_at: 1719427200000`.
export const sync_meta = sqliteTable('sync_meta', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
});

export type JobRow = typeof jobs.$inferSelect;
export type JobInsert = typeof jobs.$inferInsert;
export type PhotoRow = typeof job_photos.$inferSelect;
export type PhotoInsert = typeof job_photos.$inferInsert;
export type ClipRow = typeof job_clips.$inferSelect;
export type ClipInsert = typeof job_clips.$inferInsert;
export type DepartmentRow = typeof departments.$inferSelect;
export type MachineRow = typeof machines.$inferSelect;
