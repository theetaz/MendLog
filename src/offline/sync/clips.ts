import type { SupabaseClient } from '@supabase/supabase-js';
import { and, eq, isNotNull, isNull, or } from 'drizzle-orm';
import { db } from '../db';
import { job_clips, jobs } from '../schema';
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
        const { data, error } = await client
          .from('job_clips')
          .insert({
            job_id: parentServerId,
            user_id: row.user_id,
            audio_path: row.audio_path,
            duration_ms: row.duration_ms,
          })
          .select('id, updated_at')
          .single();
        if (error) throw new Error(error.message);
        const clipServerId = data.id as number;
        await db
          .update(job_clips)
          .set({
            server_id: clipServerId,
            sync_state: 'synced',
            updated_at: toMs(data.updated_at as string),
          })
          .where(eq(job_clips.id, row.id));
        // Kick off transcription server-side. Fire-and-forget — pullClips
        // picks up the eventual transcript fields regardless.
        client.functions
          .invoke('transcribe-clip', { body: { clip_id: clipServerId } })
          .catch((e) => console.warn('transcribe-clip invoke failed:', e));
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

// Pull clip updates — primarily the transcripts written by the
// `transcribe-clip` edge function after the audio uploads.
export async function pullClips(client: SupabaseClient, userId: string): Promise<void> {
  const cursorMs = await getMetaNumber('clips.last_pulled_at');
  const cursorIso = new Date(cursorMs).toISOString();

  const { data, error } = await client
    .from('job_clips')
    .select(
      'id, audio_path, transcript_raw, transcript_clean, transcript_en_raw, transcript_en_clean, status, error, updated_at',
    )
    .eq('user_id', userId)
    .gt('updated_at', cursorIso)
    .order('updated_at', { ascending: true })
    .limit(500);
  if (error) throw new Error(error.message);
  if (!data || data.length === 0) return;

  let maxUpdated = cursorMs;
  for (const remote of data as Record<string, unknown>[]) {
    const serverId = remote.id as number;
    const remoteMs = toMs(remote.updated_at as string);
    if (remoteMs > maxUpdated) maxUpdated = remoteMs;

    const existing = await db
      .select()
      .from(job_clips)
      .where(eq(job_clips.server_id, serverId))
      .limit(1);
    if (existing.length === 0) continue;

    const local = existing[0];
    if (local.sync_state !== 'synced' && remoteMs <= local.updated_at) continue;

    await db
      .update(job_clips)
      .set({
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
  }

  await setMetaNumber('clips.last_pulled_at', maxUpdated);
}
