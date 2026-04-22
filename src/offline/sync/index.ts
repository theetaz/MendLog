import type { SupabaseClient } from '@supabase/supabase-js';
import { and, isNotNull, isNull, ne } from 'drizzle-orm';
import { db } from '../db';
import { notifyLocalDataChanged } from '../dataBus';
import { errorMessage } from '../errors';
import { job_clips, job_photos, jobs } from '../schema';
import { pullCatalog } from './catalog';
import { pushClips } from './clips';
import { pullJobs, pushJobs } from './jobs';
import { getMetaNumber } from './meta';
import { pushPhotos } from './photos';
import { drainClipUploads, drainPhotoUploads, pendingUploadCount } from './uploadQueue';

export interface SyncCounts {
  pendingJobs: number;
  pendingPhotos: number;
  pendingClips: number;
  pendingUploads: number;
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
    await pullJobs(client, userId, { full: opts.full });
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

  const pendingPhotos = (
    await db
      .select({ id: job_photos.id })
      .from(job_photos)
      .where(
        and(
          ne(job_photos.sync_state, 'synced'),
          isNotNull(job_photos.storage_path),
          isNull(job_photos.deleted_at),
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
          isNotNull(job_clips.audio_path),
          isNull(job_clips.deleted_at),
        ),
      )
  ).length;

  return {
    pendingJobs,
    pendingPhotos,
    pendingClips,
    pendingUploads: await pendingUploadCount(),
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
