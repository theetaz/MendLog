import type { SupabaseClient } from '@supabase/supabase-js';
import { and, eq, isNotNull, isNull, or } from 'drizzle-orm';
import { db } from '../db';
import { job_photos, jobs } from '../schema';
import { toMs } from './time';

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
        await db
          .update(job_photos)
          .set({
            server_id: data.id as number,
            sync_state: 'synced',
            updated_at: toMs(data.updated_at as string),
          })
          .where(eq(job_photos.id, row.id));
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

  // TODO(offline-first): pullPhotos — fetch server-side AI annotations,
  // merge into local row. Deferred until we flip sync on for real.
}
