import type { SupabaseClient } from '@supabase/supabase-js';
import { pushClips } from './clips';
import { pullJobs, pushJobs } from './jobs';
import { pushPhotos } from './photos';
import { drainClipUploads, drainPhotoUploads } from './uploadQueue';

export interface SyncResult {
  ok: boolean;
  error?: string;
  durationMs: number;
}

// Orchestrator. Order matters:
//   1. Push jobs — children FK to these, so they need server_ids first.
//   2. Drain file uploads — photos/clips can only push their rows once the
//      blob is in place.
//   3. Push photos + clips.
//   4. Pull jobs — fetch anything the server changed since our cursor.
// Pull for photos/clips (AI annotations, transcripts) is deferred — they
// flow back through `subscribeToClip` today; moving those to pull-based is
// a follow-up once the push path is verified on-device.
export async function runSync(
  client: SupabaseClient,
  userId: string,
): Promise<SyncResult> {
  const started = Date.now();
  try {
    await pushJobs(client);
    await drainPhotoUploads(client);
    await drainClipUploads(client);
    await pushPhotos(client);
    await pushClips(client);
    await pullJobs(client, userId);
    return { ok: true, durationMs: Date.now() - started };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : String(e),
      durationMs: Date.now() - started,
    };
  }
}

export { hasDirtyJobs } from './jobs';
export { pendingUploadCount } from './uploadQueue';
