import type { SupabaseClient } from '@supabase/supabase-js';
import { and, eq, isNotNull, isNull, or } from 'drizzle-orm';
import { db } from '../db';
import { job_clips, jobs } from '../schema';
import { newId } from '../uuid';
import { getMetaNumber, setMetaNumber } from './meta';
import { toMs } from './time';

// Push clip rows whose audio has uploaded. `job_id` is nullable on the server
// (clips can exist before a job is saved), so unlike photos we push even when
// the parent job hasn't synced yet — we just send `job_id: null` and let the
// linking happen later via the existing `linkClipToJob` path.
export async function pushClips(client: SupabaseClient): Promise<void> {
  const candidates = await db
    .select()
    .from(job_clips)
    .where(
      and(
        or(
          eq(job_clips.sync_state, 'pending_insert'),
          eq(job_clips.sync_state, 'pending_update'),
        ),
        isNotNull(job_clips.audio_path),
        isNull(job_clips.deleted_at),
      ),
    );

  for (const row of candidates) {
    // If the clip has a local parent, try to resolve the server_id.
    let parentServerId: number | null = null;
    if (row.job_id) {
      const parent = await db
        .select({ server_id: jobs.server_id })
        .from(jobs)
        .where(eq(jobs.id, row.job_id))
        .limit(1);
      parentServerId = parent[0]?.server_id ?? null;
      // If parent exists locally but hasn't pushed yet, defer the link but
      // still push the clip so its audio is safe in the cloud.
    }

    try {
      if (row.sync_state === 'pending_insert' || row.server_id == null) {
        let clipServerId: number;
        let serverUpdatedAt: string;
        const { data, error } = await client
          .from('job_clips')
          .insert({
            client_id: row.id,
            job_id: parentServerId,
            user_id: row.user_id,
            audio_path: row.audio_path,
            duration_ms: row.duration_ms,
          })
          .select('id, updated_at')
          .single();
        if (error) {
          const isDup = (error as { code?: string }).code === '23505';
          if (!isDup) throw new Error(error.message);
          const { data: existing, error: refetchErr } = await client
            .from('job_clips')
            .select('id, updated_at')
            .eq('client_id', row.id)
            .single();
          if (refetchErr || !existing) {
            throw new Error(refetchErr?.message ?? 'duplicate but row not found');
          }
          clipServerId = existing.id as number;
          serverUpdatedAt = existing.updated_at as string;
        } else {
          clipServerId = data.id as number;
          serverUpdatedAt = data.updated_at as string;
        }
        await db
          .update(job_clips)
          .set({
            server_id: clipServerId,
            sync_state: 'synced',
            updated_at: toMs(serverUpdatedAt),
          })
          .where(eq(job_clips.id, row.id));
        // Transcription kick-off lives in dispatchAllPendingAI so failed
        // invokes are retried on the next sync instead of silently lost.
      } else {
        const { data, error } = await client
          .from('job_clips')
          .update({
            job_id: parentServerId,
            audio_path: row.audio_path,
            duration_ms: row.duration_ms,
          })
          .eq('id', row.server_id)
          .select('updated_at')
          .single();
        if (error) throw new Error(error.message);
        await db
          .update(job_clips)
          .set({ sync_state: 'synced', updated_at: toMs(data.updated_at as string) })
          .where(eq(job_clips.id, row.id));
      }
    } catch (e) {
      console.warn('pushClips row failed', row.id, e);
    }
  }

}

// Merge a remote clip row into local. Mirrors applyRemotePhoto — reused by
// pullClips and the realtime listener. Inserts when no local row matches,
// so a clean install / secondary device can hydrate clips uploaded by the
// same account from a previous install.
export async function applyRemoteClip(remote: Record<string, unknown>): Promise<boolean> {
  const serverId = remote.id as number;
  const remoteMs = toMs(remote.updated_at as string);
  const clientId = (remote.client_id as string | null) ?? null;

  let local =
    clientId
      ? (
          await db
            .select()
            .from(job_clips)
            .where(eq(job_clips.id, clientId))
            .limit(1)
        )[0]
      : undefined;
  if (!local) {
    local = (
      await db
        .select()
        .from(job_clips)
        .where(eq(job_clips.server_id, serverId))
        .limit(1)
    )[0];
  }

  if (!local) {
    const remoteJobId = remote.job_id as number | null;
    let localJobId: string | null = null;
    if (remoteJobId != null) {
      const parent = await db
        .select({ id: jobs.id })
        .from(jobs)
        .where(eq(jobs.server_id, remoteJobId))
        .limit(1);
      localJobId = parent[0]?.id ?? null;
      if (!localJobId) return false; // parent not pulled yet
    }

    await db.insert(job_clips).values({
      id: clientId ?? newId(),
      server_id: serverId,
      user_id: remote.user_id as string,
      job_id: localJobId,
      sync_state: 'synced',
      created_at: toMs((remote.created_at as string) ?? (remote.updated_at as string)),
      updated_at: remoteMs,
      local_uri: null,
      audio_path: (remote.audio_path as string | null) ?? null,
      duration_ms: (remote.duration_ms as number) ?? 0,
      transcript_raw: (remote.transcript_raw as string | null) ?? null,
      transcript_clean: (remote.transcript_clean as string | null) ?? null,
      transcript_en_raw: (remote.transcript_en_raw as string | null) ?? null,
      transcript_en_clean: (remote.transcript_en_clean as string | null) ?? null,
      status: (remote.status as string) ?? 'pending',
      error: (remote.error as string | null) ?? null,
      upload_state: 'uploaded',
    });
    return true;
  }

  if (local.sync_state !== 'synced' && remoteMs <= local.updated_at) return false;

  await db
    .update(job_clips)
    .set({
      server_id: serverId,
      audio_path:
        typeof remote.audio_path === 'string' ? (remote.audio_path as string) : local.audio_path,
      transcript_raw: (remote.transcript_raw as string | null) ?? local.transcript_raw,
      transcript_clean: (remote.transcript_clean as string | null) ?? local.transcript_clean,
      transcript_en_raw:
        (remote.transcript_en_raw as string | null) ?? local.transcript_en_raw,
      transcript_en_clean:
        (remote.transcript_en_clean as string | null) ?? local.transcript_en_clean,
      status: (remote.status as string) ?? local.status,
      error: (remote.error as string | null) ?? local.error,
      updated_at: remoteMs,
      sync_state: local.sync_state === 'synced' ? 'synced' : local.sync_state,
    })
    .where(eq(job_clips.id, local.id));

  return true;
}

// Pull clip updates — primarily the transcripts written by the
// `transcribe-clip` edge function after the audio uploads. Also hydrates
// rows the device has never seen via applyRemoteClip's INSERT path.
//
// `full: true` ignores the persisted cursor and pulls from the start.
export async function pullClips(
  client: SupabaseClient,
  userId: string,
  opts: { full?: boolean } = {},
): Promise<void> {
  const cursorMs = opts.full ? 0 : await getMetaNumber('clips.last_pulled_at');
  const cursorIso = new Date(cursorMs).toISOString();

  const { data, error } = await client
    .from('job_clips')
    .select(
      'id, client_id, job_id, user_id, audio_path, duration_ms, transcript_raw, transcript_clean, transcript_en_raw, transcript_en_clean, status, error, created_at, updated_at',
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
    await applyRemoteClip(remote);
  }

  await setMetaNumber('clips.last_pulled_at', maxUpdated);
}

// Same stuck-row reconciliation as photos — targeted refetch for clips
// that have been in `transcribing` locally for longer than the threshold,
// in case a realtime UPDATE was missed or clobbered.
const STUCK_STALE_MS = 60_000;

export async function reconcileStuckClipTranscripts(
  client: SupabaseClient,
): Promise<void> {
  const cutoff = Date.now() - STUCK_STALE_MS;
  const stuck = await db
    .select({ server_id: job_clips.server_id, updated_at: job_clips.updated_at })
    .from(job_clips)
    .where(
      and(
        isNotNull(job_clips.server_id),
        isNull(job_clips.deleted_at),
        or(
          eq(job_clips.status, 'transcribing'),
          eq(job_clips.status, 'post_processing'),
        ),
      ),
    );
  const stale = stuck
    .filter((r) => r.updated_at < cutoff && r.server_id != null)
    .map((r) => r.server_id as number);
  if (stale.length === 0) return;

  const { data, error } = await client
    .from('job_clips')
    .select(
      'id, audio_path, transcript_raw, transcript_clean, transcript_en_raw, transcript_en_clean, status, error, updated_at',
    )
    .in('id', stale);
  if (error) {
    console.warn('reconcileStuckClipTranscripts query failed', error.message);
    return;
  }
  for (const remote of (data ?? []) as Record<string, unknown>[]) {
    await applyRemoteClip(remote);
  }
}

function isMissingResourceError(msg: string): boolean {
  const s = msg.toLowerCase();
  return s.includes('not found') || s.includes('does not exist') || s.includes('no rows');
}

// Drain clip tombstones. Same shape as pushPhotoDeletes — remove audio from
// storage, delete the server row, hard-delete locally.
export async function pushClipDeletes(client: SupabaseClient): Promise<void> {
  const tombstones = await db
    .select()
    .from(job_clips)
    .where(eq(job_clips.sync_state, 'pending_delete'));

  for (const row of tombstones) {
    try {
      if (row.audio_path) {
        const { error } = await client.storage.from('job-audio').remove([row.audio_path]);
        if (error && !isMissingResourceError(error.message)) {
          throw new Error(error.message);
        }
      }
      if (row.server_id != null) {
        const { error } = await client.from('job_clips').delete().eq('id', row.server_id);
        if (error && !isMissingResourceError(error.message)) {
          throw new Error(error.message);
        }
      }
      await db.delete(job_clips).where(eq(job_clips.id, row.id));
    } catch (e) {
      console.warn('pushClipDeletes row failed', row.id, e);
    }
  }
}
