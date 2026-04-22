import type { SupabaseClient } from '@supabase/supabase-js';
import { and, eq, isNotNull, isNull, or } from 'drizzle-orm';
import { db } from '../db';
import { job_clips, jobs } from '../schema';
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
        await db
          .update(job_clips)
          .set({
            server_id: data.id as number,
            sync_state: 'synced',
            updated_at: toMs(data.updated_at as string),
          })
          .where(eq(job_clips.id, row.id));
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

  // TODO(offline-first): pullClips — merge server-side transcripts back.
}
