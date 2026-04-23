import type { SupabaseClient } from '@supabase/supabase-js';
import { and, eq, inArray, isNotNull, isNull, or } from 'drizzle-orm';
import { db } from '../db';
import { job_clips, job_photos } from '../schema';

// Cap per-sync so a big offline batch doesn't fan out hundreds of edge
// function calls in one shot. Anything beyond the cap gets picked up on
// the next sync pass.
const MAX_DISPATCH_PER_SYNC = 10;

// Re-invoke `annotate-photo` for rows that made it to the server but whose
// AI status is still pending or errored. This is the self-healing path:
// fire-and-forget invokes during push can be dropped silently (network
// flap, cold start, rate limit) — this re-kicks them every sync so the
// workflow eventually completes for every uploaded photo.
//
// Scoped to photos with `server_id` and `storage_path`: the edge function
// needs both to load the image.
export async function dispatchPendingPhotoAnnotations(
  client: SupabaseClient,
  opts: { photoIds?: string[] } = {},
): Promise<number> {
  const stuck = await db
    .select({ id: job_photos.id, server_id: job_photos.server_id })
    .from(job_photos)
    .where(
      and(
        isNotNull(job_photos.server_id),
        isNotNull(job_photos.storage_path),
        isNull(job_photos.deleted_at),
        or(eq(job_photos.status, 'pending'), eq(job_photos.status, 'error')),
        opts.photoIds && opts.photoIds.length > 0
          ? inArray(job_photos.id, opts.photoIds)
          : undefined,
      ),
    )
    .limit(MAX_DISPATCH_PER_SYNC);

  let fired = 0;
  for (const row of stuck) {
    if (row.server_id == null) continue;
    // Flip BEFORE invoke so the UI shows "processing" immediately, and so
    // the realtime UPDATE that lands while invoke is still in flight isn't
    // clobbered by a post-invoke write. `client.functions.invoke` waits
    // for the edge function to complete — by the time it returns, the
    // server row is already `done` and realtime has likely merged that
    // state. Writing anything here after would overwrite it.
    await db
      .update(job_photos)
      .set({ status: 'annotating' })
      .where(eq(job_photos.id, row.id));
    try {
      const { error } = await client.functions.invoke('annotate-photo', {
        body: { photo_id: row.server_id },
      });
      if (error) throw new Error(error.message);
      fired += 1;
    } catch (e) {
      // Roll back to `error` so the next sync's self-heal picks it up and
      // the UI shows a retry affordance. Do NOT touch `status` on success.
      await db
        .update(job_photos)
        .set({ status: 'error' })
        .where(eq(job_photos.id, row.id));
      console.warn('dispatch annotate-photo failed', row.id, e);
    }
  }
  return fired;
}

// Same self-healing logic for `transcribe-clip`.
export async function dispatchPendingClipTranscripts(
  client: SupabaseClient,
  opts: { clipIds?: string[] } = {},
): Promise<number> {
  const stuck = await db
    .select({ id: job_clips.id, server_id: job_clips.server_id })
    .from(job_clips)
    .where(
      and(
        isNotNull(job_clips.server_id),
        isNotNull(job_clips.audio_path),
        isNull(job_clips.deleted_at),
        or(eq(job_clips.status, 'pending'), eq(job_clips.status, 'error')),
        opts.clipIds && opts.clipIds.length > 0
          ? inArray(job_clips.id, opts.clipIds)
          : undefined,
      ),
    )
    .limit(MAX_DISPATCH_PER_SYNC);

  let fired = 0;
  for (const row of stuck) {
    if (row.server_id == null) continue;
    // Same pre-invoke flip pattern as photos — see the comment there for
    // the realtime/invoke race this avoids.
    await db
      .update(job_clips)
      .set({ status: 'transcribing' })
      .where(eq(job_clips.id, row.id));
    try {
      const { error } = await client.functions.invoke('transcribe-clip', {
        body: { clip_id: row.server_id },
      });
      if (error) throw new Error(error.message);
      fired += 1;
    } catch (e) {
      await db
        .update(job_clips)
        .set({ status: 'error' })
        .where(eq(job_clips.id, row.id));
      console.warn('dispatch transcribe-clip failed', row.id, e);
    }
  }
  return fired;
}

// Convenience — used by the orchestrator after pull so we always converge.
export async function dispatchAllPendingAI(client: SupabaseClient): Promise<void> {
  await dispatchPendingPhotoAnnotations(client);
  await dispatchPendingClipTranscripts(client);
}
