import type { SupabaseClient } from '@supabase/supabase-js';
import { and, eq, isNotNull, isNull, ne, or } from 'drizzle-orm';
import { db } from '../db';
import { notifyLocalDataChanged } from '../dataBus';
import { errorMessage } from '../errors';
import { job_clips, job_photos, jobs } from '../schema';
import { dispatchAllPendingAI } from './aiDispatch';
import { pullCatalog } from './catalog';
import {
  pullClips,
  pushClipDeletes,
  pushClips,
  reconcileStuckClipTranscripts,
} from './clips';
import { pullJobs, pushJobDeletes, pushJobs } from './jobs';
import { getMetaNumber } from './meta';
import {
  pullPhotos,
  pushPhotoDeletes,
  pushPhotos,
  reconcileStuckPhotoAnnotations,
} from './photos';
import { drainClipUploads, drainPhotoUploads, pendingUploadCount } from './uploadQueue';

export interface SyncCounts {
  pendingJobs: number;
  pendingPhotos: number;
  pendingClips: number;
  pendingUploads: number;
  // AI-workflow counts: rows that are fully pushed but still waiting on
  // annotate-photo / transcribe-clip. Broken out so the UI can say
  // "2 photos processing AI" distinct from "3 photos uploading".
  photosProcessing: number;
  photosError: number;
  clipsProcessing: number;
  clipsError: number;
}

export interface SyncResult {
  ok: boolean;
  error?: string;
  durationMs: number;
}

// Full data sync — user-generated rows (push) then server-side updates (pull).
// Order matters: children FK to jobs, so parent server_ids must exist first.
// `full: true` disables the 90-day pull window — used by the "Sync all
// history" button in the Me screen.
export async function runDataSync(
  client: SupabaseClient,
  userId: string,
  opts: { full?: boolean } = {},
): Promise<SyncResult> {
  const started = Date.now();
  try {
    await pushJobs(client);
    await drainPhotoUploads(client);
    await drainClipUploads(client);
    await pushPhotos(client);
    await pushClips(client);
    // Drain tombstones: children first so the parent-job delete doesn't
    // hit a foreign-key violation. Local hard-deletes happen inside each
    // push* function after the server side clears.
    await pushPhotoDeletes(client);
    await pushClipDeletes(client);
    await pushJobDeletes(client);
    await pullJobs(client, userId, { full: opts.full });
    // Pull the server-side-populated fields (AI descriptions/tags, clip
    // transcripts). Runs after push so any server work triggered during
    // push has a chance to complete before our cursor advances.
    await pullPhotos(client, userId);
    await pullClips(client, userId);
    // Reconcile rows stuck locally in `annotating` / `transcribing` for
    // longer than the stale threshold. The cursor-based pull above won't
    // catch them if their server `updated_at` already fell behind our
    // cursor (realtime previously merged, then a race overwrote the
    // status). Targeted refetch by server_id always re-merges.
    await reconcileStuckPhotoAnnotations(client);
    await reconcileStuckClipTranscripts(client);
    // Self-heal: any row whose `status` is still `pending` or `error`
    // after pull never had a successful edge-function invoke (or the
    // previous attempt failed). Re-dispatch, capped so a big offline
    // batch doesn't fan out hundreds of calls. Realtime picks up the
    // eventual status changes.
    await dispatchAllPendingAI(client);
    notifyLocalDataChanged();
    return { ok: true, durationMs: Date.now() - started };
  } catch (e) {
    return {
      ok: false,
      error: errorMessage(e),
      durationMs: Date.now() - started,
    };
  }
}

// Metadata sync — reference data only (departments, machines). Safe to run
// independently of the data sync; doesn't touch any dirty rows.
export async function runCatalogSync(client: SupabaseClient): Promise<SyncResult> {
  const started = Date.now();
  try {
    await pullCatalog(client);
    return { ok: true, durationMs: Date.now() - started };
  } catch (e) {
    return {
      ok: false,
      error: errorMessage(e),
      durationMs: Date.now() - started,
    };
  }
}

// Convenience orchestrator — used by the background manager; UI pieces can
// invoke the two halves separately if they want finer control.
export async function runFullSync(
  client: SupabaseClient,
  userId: string,
): Promise<{ data: SyncResult; catalog: SyncResult }> {
  const [catalog, data] = await Promise.all([
    runCatalogSync(client),
    runDataSync(client, userId),
  ]);
  return { data, catalog };
}

// Snapshot counts used by the sync UI. Cheap queries; call on-demand.
export async function getSyncCounts(): Promise<SyncCounts> {
  const pendingJobs = (
    await db.select({ id: jobs.id }).from(jobs).where(ne(jobs.sync_state, 'synced'))
  ).length;

  // Count rows that are ready to push: either a live row with its file
  // uploaded (insert/update path), or a tombstone ready to be drained.
  const pendingPhotos = (
    await db
      .select({ id: job_photos.id })
      .from(job_photos)
      .where(
        and(
          ne(job_photos.sync_state, 'synced'),
          or(
            and(isNotNull(job_photos.storage_path), isNull(job_photos.deleted_at)),
            eq(job_photos.sync_state, 'pending_delete'),
          ),
        ),
      )
  ).length;

  const pendingClips = (
    await db
      .select({ id: job_clips.id })
      .from(job_clips)
      .where(
        and(
          ne(job_clips.sync_state, 'synced'),
          or(
            and(isNotNull(job_clips.audio_path), isNull(job_clips.deleted_at)),
            eq(job_clips.sync_state, 'pending_delete'),
          ),
        ),
      )
  ).length;

  // Rows where the file + the row have made it to the server, but the
  // AI workflow hasn't finished yet. Split processing vs error so the UI
  // can show a retry affordance only when something actually failed.
  const photosProcessing = (
    await db
      .select({ id: job_photos.id })
      .from(job_photos)
      .where(
        and(
          eq(job_photos.sync_state, 'synced'),
          isNotNull(job_photos.storage_path),
          isNull(job_photos.deleted_at),
          or(
            eq(job_photos.status, 'pending'),
            eq(job_photos.status, 'annotating'),
          ),
        ),
      )
  ).length;

  const photosError = (
    await db
      .select({ id: job_photos.id })
      .from(job_photos)
      .where(
        and(
          eq(job_photos.sync_state, 'synced'),
          isNotNull(job_photos.storage_path),
          isNull(job_photos.deleted_at),
          eq(job_photos.status, 'error'),
        ),
      )
  ).length;

  const clipsProcessing = (
    await db
      .select({ id: job_clips.id })
      .from(job_clips)
      .where(
        and(
          eq(job_clips.sync_state, 'synced'),
          isNotNull(job_clips.audio_path),
          isNull(job_clips.deleted_at),
          or(
            eq(job_clips.status, 'pending'),
            eq(job_clips.status, 'transcribing'),
            eq(job_clips.status, 'post_processing'),
          ),
        ),
      )
  ).length;

  const clipsError = (
    await db
      .select({ id: job_clips.id })
      .from(job_clips)
      .where(
        and(
          eq(job_clips.sync_state, 'synced'),
          isNotNull(job_clips.audio_path),
          isNull(job_clips.deleted_at),
          eq(job_clips.status, 'error'),
        ),
      )
  ).length;

  return {
    pendingJobs,
    pendingPhotos,
    pendingClips,
    pendingUploads: await pendingUploadCount(),
    photosProcessing,
    photosError,
    clipsProcessing,
    clipsError,
  };
}

export async function getCatalogLastPulledAt(): Promise<number> {
  return getMetaNumber('catalog.last_pulled_at');
}

export async function getJobsLastPulledAt(): Promise<number> {
  return getMetaNumber('jobs.last_pulled_at');
}

// Back-compat for callers still importing the old name.
export const runSync = runFullSync;
export { pendingUploadCount };
