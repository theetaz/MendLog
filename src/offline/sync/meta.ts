import { eq } from 'drizzle-orm';
import { db } from '../db';
import { sync_meta } from '../schema';

// Thin K/V wrapper over the `sync_meta` table. Keys we use today:
//   jobs.last_pulled_at    — ms epoch of most recent `updated_at` we pulled
//   photos.last_pulled_at  — (reserved, not used yet)
//   clips.last_pulled_at   — (reserved, not used yet)

export async function getMetaNumber(key: string): Promise<number> {
  const rows = await db.select().from(sync_meta).where(eq(sync_meta.key, key));
  const row = rows[0];
  if (!row) return 0;
  const n = Number(row.value);
  return Number.isFinite(n) ? n : 0;
}

export async function setMetaNumber(key: string, value: number): Promise<void> {
  await db
    .insert(sync_meta)
    .values({ key, value: String(value) })
    .onConflictDoUpdate({ target: sync_meta.key, set: { value: String(value) } });
}

export async function getMetaString(key: string): Promise<string | null> {
  const rows = await db.select().from(sync_meta).where(eq(sync_meta.key, key));
  return rows[0]?.value ?? null;
}

export async function setMetaString(key: string, value: string): Promise<void> {
  await db
    .insert(sync_meta)
    .values({ key, value })
    .onConflictDoUpdate({ target: sync_meta.key, set: { value } });
}

export async function deleteMeta(key: string): Promise<void> {
  await db.delete(sync_meta).where(eq(sync_meta.key, key));
}
