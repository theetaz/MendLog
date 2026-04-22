import type { SupabaseClient } from '@supabase/supabase-js';
import { and, eq, isNull, ne, or } from 'drizzle-orm';
import { db } from '../db';
import { jobs } from '../schema';
import { newId } from '../uuid';
import { getMetaNumber, setMetaNumber } from './meta';
import { toMs } from './time';

// Columns sent to Supabase on insert/update. `id` is owned by the server
// (bigserial) so we never send our local UUID. `created_at`/`updated_at`
// are server-managed via the trigger.
type ServerJobPayload = {
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

function rowToPayload(r: typeof jobs.$inferSelect): ServerJobPayload {
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
        const { data, error } = await client
          .from('jobs')
          .insert(rowToPayload(row))
          .select('id, updated_at')
          .single();
        if (error) throw new Error(error.message);
        await db
          .update(jobs)
          .set({
            server_id: data.id as number,
            sync_state: 'synced',
            updated_at: toMs(data.updated_at as string),
          })
          .where(eq(jobs.id, row.id));
      } else {
        const { data, error } = await client
          .from('jobs')
          .update(rowToPayload(row))
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

// Pull jobs updated on the server since our last cursor. Last-write-wins by
// `updated_at` — if a remote update is newer than a locally pending change,
// the remote wins (we clobber our pending edit). This is acceptable for a
// single-author workflow; revisit when we support multi-tech collaboration.
export async function pullJobs(client: SupabaseClient, userId: string): Promise<void> {
  const cursorMs = await getMetaNumber('jobs.last_pulled_at');
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

// Exported for the orchestrator to probe whether there's anything to push.
export async function hasDirtyJobs(): Promise<boolean> {
  const rows = await db
    .select({ id: jobs.id })
    .from(jobs)
    .where(ne(jobs.sync_state, 'synced'))
    .limit(1);
  return rows.length > 0;
}
