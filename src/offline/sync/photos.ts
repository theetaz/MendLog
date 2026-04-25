import type { SupabaseClient } from '@supabase/supabase-js';
import { and, eq, gt, isNotNull, isNull, or } from 'drizzle-orm';
import { db } from '../db';
import { job_photos, jobs } from '../schema';
import { newId } from '../uuid';
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
        // Idempotent insert: client_id (= local UUID) is UNIQUE on the server,
        // so a duplicate push collapses to no-op + re-fetch instead of orphan.
        let photoServerId: number;
        let serverUpdatedAt: string;
        const { data, error } = await client
          .from('job_photos')
          .insert({
            client_id: row.id,
            job_id: parentServerId,
            user_id: row.user_id,
            storage_path: row.storage_path,
            mime_type: row.mime_type,
            width: row.width,
            height: row.height,
            blurhash: row.blurhash,
          })
          .select('id, updated_at')
          .single();
        if (error) {
          // 23505 = unique_violation. The previous push must have already
          // landed; recover its server id by client_id.
          const isDup = (error as { code?: string }).code === '23505';
          if (!isDup) throw new Error(error.message);
          const { data: existing, error: refetchErr } = await client
            .from('job_photos')
            .select('id, updated_at')
            .eq('client_id', row.id)
            .single();
          if (refetchErr || !existing) {
            throw new Error(refetchErr?.message ?? 'duplicate but row not found');
          }
          photoServerId = existing.id as number;
          serverUpdatedAt = existing.updated_at as string;
        } else {
          photoServerId = data.id as number;
          serverUpdatedAt = data.updated_at as string;
        }
        await db
          .update(job_photos)
          .set({
            server_id: photoServerId,
            sync_state: 'synced',
            updated_at: toMs(serverUpdatedAt),
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
//
// When no local row matches by server_id or client_id, INSERTs a fresh row
// — this is the path that hydrates a clean install, a reinstall, or a
// secondary device. Without it, photos taken on another install of the
// same account silently fail to render even though the server has them.
export async function applyRemotePhoto(remote: Record<string, unknown>): Promise<boolean> {
  const serverId = remote.id as number;
  const remoteMs = toMs(remote.updated_at as string);
  const clientId = (remote.client_id as string | null) ?? null;

  // Prefer client_id match (survives across installs that share the same
  // local UUID — rare in practice, but cheap belt-and-braces). Fall back
  // to server_id, which is what's been used historically.
  let local =
    clientId
      ? (
          await db
            .select()
            .from(job_photos)
            .where(eq(job_photos.id, clientId))
            .limit(1)
        )[0]
      : undefined;
  if (!local) {
    local = (
      await db
        .select()
        .from(job_photos)
        .where(eq(job_photos.server_id, serverId))
        .limit(1)
    )[0];
  }

  const tagsJson = Array.isArray(remote.ai_tags)
    ? JSON.stringify(remote.ai_tags as string[])
    : null;

  if (!local) {
    // INSERT path: the server has a row this device has never seen. Map
    // the remote.job_id (server bigint) to the local jobs.id (UUID). If
    // the parent job hasn't been pulled yet we drop the row; the next
    // pull will retry.
    const remoteJobId = remote.job_id as number | null;
    if (remoteJobId == null) return false;
    const parent = await db
      .select({ id: jobs.id })
      .from(jobs)
      .where(eq(jobs.server_id, remoteJobId))
      .limit(1);
    const localJobId = parent[0]?.id;
    if (!localJobId) return false;

    await db.insert(job_photos).values({
      id: clientId ?? newId(),
      server_id: serverId,
      user_id: remote.user_id as string,
      job_id: localJobId,
      sync_state: 'synced',
      created_at: toMs((remote.created_at as string) ?? (remote.updated_at as string)),
      updated_at: remoteMs,
      local_uri: null,
      storage_path: (remote.storage_path as string | null) ?? null,
      mime_type: (remote.mime_type as string) ?? 'image/jpeg',
      width: (remote.width as number | null) ?? null,
      height: (remote.height as number | null) ?? null,
      blurhash: (remote.blurhash as string | null) ?? null,
      ai_description: (remote.ai_description as string | null) ?? null,
      ai_tags: tagsJson ?? '[]',
      status: (remote.status as string) ?? 'pending',
      error: (remote.error as string | null) ?? null,
      upload_state: 'uploaded',
    });
    return true;
  }

  if (local.sync_state !== 'synced' && remoteMs <= local.updated_at) return false;

  await db
    .update(job_photos)
    .set({
      server_id: serverId,
      ai_description:
        typeof remote.ai_description === 'string' ? remote.ai_description : local.ai_description,
      ai_tags: tagsJson ?? local.ai_tags,
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

// Pull photo updates from the server — brings back the AI description /
// tags / status populated by the `annotate-photo` edge function, and
// hydrates rows the device has never seen (clean install / secondary
// device) via the INSERT path in applyRemotePhoto.
//
// `full: true` ignores the persisted cursor and pulls from the start —
// used by the "Sync all history" recovery button when the cursor and
// local DB drift apart.
export async function pullPhotos(
  client: SupabaseClient,
  userId: string,
  opts: { full?: boolean } = {},
): Promise<void> {
  const cursorMs = opts.full ? 0 : await getMetaNumber('photos.last_pulled_at');
  const cursorIso = new Date(cursorMs).toISOString();

  const { data, error } = await client
    .from('job_photos')
    .select(
      'id, client_id, job_id, user_id, ai_description, ai_tags, blurhash, status, error, storage_path, mime_type, width, height, created_at, updated_at',
    )
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
