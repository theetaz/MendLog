import type { SupabaseClient } from '@supabase/supabase-js';
import { and, eq, gt, isNotNull, isNull, or } from 'drizzle-orm';
import { db } from '../db';
import { job_photos, jobs } from '../schema';
import { getMetaNumber, setMetaNumber } from './meta';
import { toMs } from './time';

// "Not found" errors from Supabase when deleting something that's already
// gone — safe to ignore so we can still hard-delete the local tombstone.
function isMissingResourceError(msg: string): boolean {
  const s = msg.toLowerCase();
  return s.includes('not found') || s.includes('does not exist') || s.includes('no rows');
}

// Push photo rows whose file has already been uploaded AND whose parent job
// has a `server_id`. Rows violating either precondition stay dirty and get
// picked up on the next sync pass after the dependency resolves.
export async function pushPhotos(client: SupabaseClient): Promise<void> {
  const candidates = await db
    .select()
    .from(job_photos)
    .where(
      and(
        or(
          eq(job_photos.sync_state, 'pending_insert'),
          eq(job_photos.sync_state, 'pending_update'),
        ),
        isNotNull(job_photos.storage_path),
        isNull(job_photos.deleted_at),
      ),
    );

  for (const row of candidates) {
    // Resolve parent job's server_id — bail if parent hasn't pushed yet.
    const parent = await db
      .select({ server_id: jobs.server_id })
      .from(jobs)
      .where(eq(jobs.id, row.job_id))
      .limit(1);
    const parentServerId = parent[0]?.server_id;
    if (parentServerId == null) continue;

    try {
      if (row.sync_state === 'pending_insert' || row.server_id == null) {
        const { data, error } = await client
          .from('job_photos')
          .insert({
            job_id: parentServerId,
            user_id: row.user_id,
            storage_path: row.storage_path,
            mime_type: row.mime_type,
            width: row.width,
            height: row.height,
          })
          .select('id, updated_at')
          .single();
        if (error) throw new Error(error.message);
        const photoServerId = data.id as number;
        await db
          .update(job_photos)
          .set({
            server_id: photoServerId,
            sync_state: 'synced',
            updated_at: toMs(data.updated_at as string),
          })
          .where(eq(job_photos.id, row.id));
        // Annotation is kicked off by dispatchAllPendingAI at the end of
        // runDataSync — centralising it there gives us retry on failure
        // for free instead of fire-and-forget-and-hope.
      } else {
        // Updates only mutate what the mobile client owns. AI fields
        // (ai_description/ai_tags/status) flow back via pull after the
        // `annotate-photo` edge function runs server-side.
        const { data, error } = await client
          .from('job_photos')
          .update({
            storage_path: row.storage_path,
            mime_type: row.mime_type,
            width: row.width,
            height: row.height,
          })
          .eq('id', row.server_id)
          .select('updated_at')
          .single();
        if (error) throw new Error(error.message);
        await db
          .update(job_photos)
          .set({ sync_state: 'synced', updated_at: toMs(data.updated_at as string) })
          .where(eq(job_photos.id, row.id));
      }
    } catch (e) {
      console.warn('pushPhotos row failed', row.id, e);
    }
  }

}

// Merge a remote photo row into local. Returns `true` if something changed
// (caller can use this to notify the data bus). Shared by the pull loop and
// the realtime listener so both paths behave identically.
export async function applyRemotePhoto(remote: Record<string, unknown>): Promise<boolean> {
  const serverId = remote.id as number;
  const remoteMs = toMs(remote.updated_at as string);

  const existing = await db
    .select()
    .from(job_photos)
    .where(eq(job_photos.server_id, serverId))
    .limit(1);
  if (existing.length === 0) return false;

  const local = existing[0];
  if (local.sync_state !== 'synced' && remoteMs <= local.updated_at) return false;

  const tagsJson = Array.isArray(remote.ai_tags)
    ? JSON.stringify(remote.ai_tags as string[])
    : local.ai_tags;

  await db
    .update(job_photos)
    .set({
      ai_description:
        typeof remote.ai_description === 'string' ? remote.ai_description : local.ai_description,
      ai_tags: tagsJson,
      blurhash:
        typeof remote.blurhash === 'string' ? (remote.blurhash as string) : local.blurhash,
      status: (remote.status as string) ?? local.status,
      error: (remote.error as string | null) ?? local.error,
      storage_path:
        typeof remote.storage_path === 'string'
          ? (remote.storage_path as string)
          : local.storage_path,
      updated_at: remoteMs,
      sync_state: local.sync_state === 'synced' ? 'synced' : local.sync_state,
    })
    .where(eq(job_photos.id, local.id));

  return true;
}

// Pull photo updates from the server — primarily to bring back the AI
// description / tags / status fields populated by the `annotate-photo`
// edge function. Matches on `server_id`; silently ignores remote rows
// we never pushed (shouldn't happen — photos always originate on device).
export async function pullPhotos(client: SupabaseClient, userId: string): Promise<void> {
  const cursorMs = await getMetaNumber('photos.last_pulled_at');
  const cursorIso = new Date(cursorMs).toISOString();

  const { data, error } = await client
    .from('job_photos')
    .select('id, ai_description, ai_tags, blurhash, status, error, storage_path, updated_at')
    .eq('user_id', userId)
    .gt('updated_at', cursorIso)
    .order('updated_at', { ascending: true })
    .limit(500);
  if (error) throw new Error(error.message);
  if (!data || data.length === 0) return;

  let maxUpdated = cursorMs;
  for (const remote of data as Record<string, unknown>[]) {
    const remoteMs = toMs(remote.updated_at as string);
    if (remoteMs > maxUpdated) maxUpdated = remoteMs;
    await applyRemotePhoto(remote);
  }

  await setMetaNumber('photos.last_pulled_at', maxUpdated);
}

// Recover rows that got stuck locally in `annotating` after the realtime
// merge was clobbered by a now-fixed post-invoke write (or any future race
// that leaves local and server out of sync). Targets only long-stale rows
// so we don't re-fetch anything that's genuinely mid-processing.
const STUCK_STALE_MS = 60_000;

export async function reconcileStuckPhotoAnnotations(
  client: SupabaseClient,
): Promise<void> {
  const cutoff = Date.now() - STUCK_STALE_MS;
  const stuck = await db
    .select({ server_id: job_photos.server_id, updated_at: job_photos.updated_at })
    .from(job_photos)
    .where(
      and(
        isNotNull(job_photos.server_id),
        isNull(job_photos.deleted_at),
        eq(job_photos.status, 'annotating'),
      ),
    );
  const stale = stuck
    .filter((r) => r.updated_at < cutoff && r.server_id != null)
    .map((r) => r.server_id as number);
  if (stale.length === 0) return;

  const { data, error } = await client
    .from('job_photos')
    .select('id, ai_description, ai_tags, blurhash, status, error, storage_path, updated_at')
    .in('id', stale);
  if (error) {
    console.warn('reconcileStuckPhotoAnnotations query failed', error.message);
    return;
  }
  for (const remote of (data ?? []) as Record<string, unknown>[]) {
    await applyRemotePhoto(remote);
  }
}

// Drain photo tombstones — delete the storage file and the server row, then
// hard-delete the local row. Runs AFTER pushPhotos (inserts/updates) so a
// newly-inserted-then-deleted row still produces a no-op delete instead of
// an orphan, and BEFORE pushJobDeletes so the FK on `job_photos.job_id` is
// clear when the parent job is deleted next.
export async function pushPhotoDeletes(client: SupabaseClient): Promise<void> {
  const tombstones = await db
    .select()
    .from(job_photos)
    .where(eq(job_photos.sync_state, 'pending_delete'));

  for (const row of tombstones) {
    try {
      if (row.storage_path) {
        const { error } = await client.storage.from('job-photos').remove([row.storage_path]);
        if (error && !isMissingResourceError(error.message)) {
          throw new Error(error.message);
        }
      }
      if (row.server_id != null) {
        const { error } = await client.from('job_photos').delete().eq('id', row.server_id);
        if (error && !isMissingResourceError(error.message)) {
          throw new Error(error.message);
        }
      }
      await db.delete(job_photos).where(eq(job_photos.id, row.id));
    } catch (e) {
      console.warn('pushPhotoDeletes row failed', row.id, e);
    }
  }
}

// Silences unused-import warning when `gt` isn't referenced directly (it's
// used indirectly via Supabase query above — kept imported for future
// delete-tombstone push pathways).
void gt;
