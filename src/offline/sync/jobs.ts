import type { SupabaseClient } from '@supabase/supabase-js';
import { and, eq, isNull, ne, or } from 'drizzle-orm';
import { db } from '../db';
import { jobs } from '../schema';
import { newId } from '../uuid';
import { getMetaNumber, setMetaNumber } from './meta';
import { toMs } from './time';

// Columns sent to Supabase on update. `id` is owned by the server
// (bigserial) so we never send our local UUID. `created_at`/`updated_at`
// are server-managed via the trigger.
type ServerJobUpdatePayload = {
  user_id: string;
  machine: string;
  dept: string;
  inv: string | null;
  date: string;
  reported_time: string;
  completed_at: string | null;
  idle_minutes: number;
  status: string;
  lang: string;
  description: string;
  root_cause: string;
  corrective_action: string;
  remarks: string;
};

function rowToUpdatePayload(r: typeof jobs.$inferSelect): ServerJobUpdatePayload {
  return {
    user_id: r.user_id,
    machine: r.machine,
    dept: r.dept,
    inv: r.inv,
    date: r.date,
    reported_time: r.reported_time,
    completed_at: r.completed_at,
    idle_minutes: r.idle_minutes,
    status: r.status,
    lang: r.lang,
    description: r.description,
    root_cause: r.root_cause,
    corrective_action: r.corrective_action,
    remarks: r.remarks,
  };
}

// Push dirty local job rows to Supabase. Silently skips `pending_delete` for
// now (delete is a v2 feature). Runs sequentially to keep error handling
// simple; the queue is typically short.
export async function pushJobs(client: SupabaseClient): Promise<void> {
  const dirty = await db
    .select()
    .from(jobs)
    .where(
      and(
        or(eq(jobs.sync_state, 'pending_insert'), eq(jobs.sync_state, 'pending_update')),
        isNull(jobs.deleted_at),
      ),
    );

  for (const row of dirty) {
    try {
      if (row.sync_state === 'pending_insert' || row.server_id == null) {
        // Idempotent insert by client_id. Protects against a crash between
        // the server INSERT and the local sync_state='synced' write —
        // without this, the next launch would re-push and create a
        // duplicate job. Mirrors the pattern in pushPhotos / pushClips.
        let serverId: number;
        let serverUpdatedAt: string;
        const { data, error } = await client
          .from('jobs')
          .insert({ client_id: row.id, ...rowToUpdatePayload(row) })
          .select('id, updated_at')
          .single();
        if (error) {
          const isDup = (error as { code?: string }).code === '23505';
          if (!isDup) throw new Error(error.message);
          const { data: existing, error: refetchErr } = await client
            .from('jobs')
            .select('id, updated_at')
            .eq('client_id', row.id)
            .single();
          if (refetchErr || !existing) {
            throw new Error(refetchErr?.message ?? 'duplicate but row not found');
          }
          serverId = existing.id as number;
          serverUpdatedAt = existing.updated_at as string;
        } else {
          serverId = data.id as number;
          serverUpdatedAt = data.updated_at as string;
        }
        await db
          .update(jobs)
          .set({
            server_id: serverId,
            sync_state: 'synced',
            updated_at: toMs(serverUpdatedAt),
          })
          .where(eq(jobs.id, row.id));
      } else {
        const { data, error } = await client
          .from('jobs')
          .update(rowToUpdatePayload(row))
          .eq('id', row.server_id)
          .select('updated_at')
          .single();
        if (error) throw new Error(error.message);
        await db
          .update(jobs)
          .set({ sync_state: 'synced', updated_at: toMs(data.updated_at as string) })
          .where(eq(jobs.id, row.id));
      }
    } catch (e) {
      // Leave the row dirty so the next sync attempt retries. We don't have
      // a per-row error column on jobs yet; log for now.
      console.warn('pushJobs row failed', row.id, e);
    }
  }
}

// Default window: skip rows updated more than 90 days ago. Keeps the local DB
// trim on first install — users with years of history don't need every row
// on the device. Passing { full: true } pulls everything and is used by the
// "Sync all history" button in the Me screen.
const DEFAULT_PULL_WINDOW_MS = 90 * 24 * 60 * 60 * 1000;

// Pull jobs updated on the server since our last cursor. Last-write-wins by
// `updated_at` — if a remote update is newer than a locally pending change,
// the remote wins (we clobber our pending edit). This is acceptable for a
// single-author workflow; revisit when we support multi-tech collaboration.
export async function pullJobs(
  client: SupabaseClient,
  userId: string,
  opts: { full?: boolean } = {},
): Promise<void> {
  const stored = await getMetaNumber('jobs.last_pulled_at');
  const windowFloor = Date.now() - DEFAULT_PULL_WINDOW_MS;
  const cursorMs = opts.full ? stored : Math.max(stored, windowFloor);
  const cursorIso = new Date(cursorMs).toISOString();

  const { data, error } = await client
    .from('jobs')
    .select('*')
    .eq('user_id', userId)
    .gt('updated_at', cursorIso)
    .order('updated_at', { ascending: true })
    .limit(500);
  if (error) throw new Error(error.message);
  if (!data || data.length === 0) return;

  let maxUpdated = cursorMs;

  for (const remote of data as Record<string, unknown>[]) {
    const remoteUpdatedMs = toMs(remote.updated_at as string);
    if (remoteUpdatedMs > maxUpdated) maxUpdated = remoteUpdatedMs;

    const existing = await db
      .select()
      .from(jobs)
      .where(eq(jobs.server_id, remote.id as number))
      .limit(1);

    const values = {
      server_id: remote.id as number,
      user_id: remote.user_id as string,
      sync_state: 'synced' as const,
      updated_at: remoteUpdatedMs,
      created_at: toMs((remote.created_at as string) ?? (remote.updated_at as string)),
      machine: (remote.machine as string) ?? '',
      dept: (remote.dept as string) ?? '',
      inv: (remote.inv as string | null) ?? null,
      date: (remote.date as string) ?? '',
      reported_time: (remote.reported_time as string) ?? '',
      completed_at: (remote.completed_at as string | null) ?? null,
      idle_minutes: (remote.idle_minutes as number) ?? 0,
      status: (remote.status as string) ?? 'open',
      lang: (remote.lang as string) ?? 'en',
      description: (remote.description as string) ?? '',
      root_cause: (remote.root_cause as string) ?? '',
      corrective_action: (remote.corrective_action as string) ?? '',
      remarks: (remote.remarks as string) ?? '',
    };

    if (existing.length === 0) {
      await db.insert(jobs).values({ id: newId(), ...values });
    } else if (remoteUpdatedMs >= existing[0].updated_at) {
      await db.update(jobs).set(values).where(eq(jobs.id, existing[0].id));
    }
    // else: local is newer (pending local change) — leave it for push to handle.
  }

  await setMetaNumber('jobs.last_pulled_at', maxUpdated);
}

function isMissingResourceError(msg: string): boolean {
  const s = msg.toLowerCase();
  return s.includes('not found') || s.includes('does not exist') || s.includes('no rows');
}

// Drain job tombstones. Must run AFTER pushPhotoDeletes / pushClipDeletes
// so the FK constraints on `job_photos.job_id` / `job_clips.job_id` are
// clear. Rows that never made it to the server (server_id == null) just
// need a local hard-delete.
export async function pushJobDeletes(client: SupabaseClient): Promise<void> {
  const tombstones = await db
    .select()
    .from(jobs)
    .where(eq(jobs.sync_state, 'pending_delete'));

  for (const row of tombstones) {
    try {
      if (row.server_id != null) {
        const { error } = await client.from('jobs').delete().eq('id', row.server_id);
        if (error && !isMissingResourceError(error.message)) {
          throw new Error(error.message);
        }
      }
      await db.delete(jobs).where(eq(jobs.id, row.id));
    } catch (e) {
      console.warn('pushJobDeletes row failed', row.id, e);
    }
  }
}

// Exported for the orchestrator to probe whether there's anything to push.
export async function hasDirtyJobs(): Promise<boolean> {
  const rows = await db
    .select({ id: jobs.id })
    .from(jobs)
    .where(ne(jobs.sync_state, 'synced'))
    .limit(1);
  return rows.length > 0;
}
