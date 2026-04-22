import type { SupabaseClient } from '@supabase/supabase-js';
import type { StagedPhoto } from '../../components/form/PhotoGrid';
import { getSupabaseClient } from '../../lib/supabase';
import { rowToJob, type JobRow } from '../../repositories/rowToJob';
import type { Job, JobStatus } from '../../types/job';
import type { ClipRow } from './clipsApi';
import { invokeAnnotatePhoto, uploadAndInsertPhoto } from './photosApi';
import type { PhotoRow } from './photosApi';

export interface JobFormPayload {
  machine: string;
  dept: string;
  inv: string;
  reportedAt: Date;
  description: string;
  rootCause: string;
  correctiveAction: string;
  remarks: string;
  completedAt: Date | null;
  idleMinutes: number;
  status: JobStatus;
  clipIds: number[];
  photos: StagedPhoto[];
}

export interface SavedJob {
  id: string;
  photoCount: number;
  clipCount: number;
}

function toLocalDateOnly(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function toLocalTimeOnly(d: Date): string {
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${hh}:${mi}:${ss}`;
}

/**
 * Saves the job row + links voice clips synchronously (fast), then kicks off
 * photo uploads + AI annotations in the background so the UI doesn't block on
 * slow network operations. The caller gets `{ id }` back in ~200–400 ms.
 *
 * If the app is killed mid-upload, background photos may not persist. That's
 * an acceptable trade for v1 — user sees the saved job instantly and can come
 * back to add more photos via Edit.
 */
export async function saveJob(
  userId: string,
  payload: JobFormPayload,
  client?: SupabaseClient,
): Promise<SavedJob> {
  const c = client ?? getSupabaseClient();

  const { data: job, error: jobErr } = await c
    .from('jobs')
    .insert({
      machine: payload.machine.trim(),
      dept: payload.dept.trim(),
      inv: payload.inv.trim() || null,
      date: toLocalDateOnly(payload.reportedAt),
      reported_time: toLocalTimeOnly(payload.reportedAt),
      completed_at: payload.completedAt ? payload.completedAt.toISOString() : null,
      idle_minutes: payload.idleMinutes,
      status: payload.status,
      description: payload.description.trim(),
      root_cause: payload.rootCause.trim(),
      corrective_action: payload.correctiveAction.trim(),
      remarks: payload.remarks.trim(),
      photos: payload.photos.length,
      clips: payload.clipIds.length,
    })
    .select('id')
    .single();

  if (jobErr || !job) throw new Error(`save job failed: ${jobErr?.message ?? 'no row'}`);
  // Job.id is string across the app now; the DB returns a number, stringify
  // once at the boundary.
  const jobId = String(job.id);

  if (payload.clipIds.length > 0) {
    const { error: linkErr } = await c
      .from('job_clips')
      .update({ job_id: jobId })
      .in('id', payload.clipIds);
    if (linkErr) console.warn('clip link failed:', linkErr.message);
  }

  if (payload.photos.length > 0) {
    // Fire-and-forget; errors are logged but don't block the Save call.
    void (async () => {
      for (const photo of payload.photos) {
        try {
          const row = await uploadAndInsertPhoto({ userId, jobId, photo, client: c });
          invokeAnnotatePhoto(row.id, c).catch((e) =>
            console.warn('annotate invoke failed:', e),
          );
        } catch (e) {
          console.warn('photo upload failed:', e);
        }
      }
    })();
  }

  return {
    id: jobId,
    photoCount: payload.photos.length,
    clipCount: payload.clipIds.length,
  };
}

export interface PhotoWithUrl extends PhotoRow {
  signed_url: string | null;
}

export interface ClipWithUrl extends ClipRow {
  signed_url: string | null;
}

export interface JobDetail {
  job: Job;
  raw: JobRow;
  photos: PhotoWithUrl[];
  clips: ClipWithUrl[];
}

const SIGNED_URL_TTL_SECONDS = 60 * 60;

async function signPaths(
  client: SupabaseClient,
  bucket: string,
  paths: string[],
): Promise<Map<string, string>> {
  if (paths.length === 0) return new Map();
  const { data, error } = await client.storage.from(bucket).createSignedUrls(paths, SIGNED_URL_TTL_SECONDS);
  if (error) {
    console.warn(`sign ${bucket}:`, error.message);
    return new Map();
  }
  const out = new Map<string, string>();
  for (const entry of data ?? []) {
    if (entry.signedUrl && entry.path) out.set(entry.path, entry.signedUrl);
  }
  return out;
}

export async function deleteJob(
  jobId: string,
  client?: SupabaseClient,
): Promise<void> {
  const c = client ?? getSupabaseClient();

  // Collect storage paths for cascade cleanup before the row is gone.
  const [{ data: photos }, { data: clips }] = await Promise.all([
    c.from('job_photos').select('storage_path').eq('job_id', jobId),
    c.from('job_clips').select('audio_path').eq('job_id', jobId),
  ]);

  const photoPaths = (photos ?? [])
    .map((p: { storage_path: string }) => p.storage_path)
    .filter(Boolean);
  const clipPaths = (clips ?? [])
    .map((c2: { audio_path: string }) => c2.audio_path)
    .filter(Boolean);

  // Fire storage removals in parallel — best-effort; errors logged, not fatal.
  await Promise.all([
    photoPaths.length > 0
      ? c.storage
          .from('job-photos')
          .remove(photoPaths)
          .then((r) => {
            if (r.error) console.warn('photo storage remove:', r.error.message);
          })
      : Promise.resolve(),
    clipPaths.length > 0
      ? c.storage
          .from('job-audio')
          .remove(clipPaths)
          .then((r) => {
            if (r.error) console.warn('clip storage remove:', r.error.message);
          })
      : Promise.resolve(),
  ]);

  const { error } = await c.from('jobs').delete().eq('id', jobId);
  if (error) throw new Error(`delete job failed: ${error.message}`);
}

export async function deletePhoto(
  photoId: number,
  storagePath: string,
  client?: SupabaseClient,
): Promise<void> {
  const c = client ?? getSupabaseClient();
  const { error: storageErr } = await c.storage.from('job-photos').remove([storagePath]);
  if (storageErr) console.warn('photo storage remove:', storageErr.message);
  const { error } = await c.from('job_photos').delete().eq('id', photoId);
  if (error) throw new Error(`delete photo failed: ${error.message}`);
}

export async function deleteClip(
  clipId: number,
  audioPath: string,
  client?: SupabaseClient,
): Promise<void> {
  const c = client ?? getSupabaseClient();
  const { error: storageErr } = await c.storage.from('job-audio').remove([audioPath]);
  if (storageErr) console.warn('clip storage remove:', storageErr.message);
  const { error } = await c.from('job_clips').delete().eq('id', clipId);
  if (error) throw new Error(`delete clip failed: ${error.message}`);
}

export async function linkClipToJob(
  clipId: number,
  jobId: string,
  client?: SupabaseClient,
): Promise<void> {
  const c = client ?? getSupabaseClient();
  const { error } = await c.from('job_clips').update({ job_id: jobId }).eq('id', clipId);
  if (error) throw new Error(`link clip failed: ${error.message}`);
}

export interface JobUpdatePayload {
  machine: string;
  dept: string;
  inv: string;
  reportedAt: Date;
  description: string;
  rootCause: string;
  correctiveAction: string;
  remarks: string;
  completedAt: Date | null;
  idleMinutes: number;
  status: JobStatus;
}

export async function updateJob(
  jobId: string,
  payload: JobUpdatePayload,
  client?: SupabaseClient,
): Promise<void> {
  const c = client ?? getSupabaseClient();
  const { error } = await c
    .from('jobs')
    .update({
      machine: payload.machine.trim(),
      dept: payload.dept.trim(),
      inv: payload.inv.trim() || null,
      date: toLocalDateOnly(payload.reportedAt),
      reported_time: toLocalTimeOnly(payload.reportedAt),
      completed_at: payload.completedAt ? payload.completedAt.toISOString() : null,
      idle_minutes: payload.idleMinutes,
      status: payload.status,
      description: payload.description.trim(),
      root_cause: payload.rootCause.trim(),
      corrective_action: payload.correctiveAction.trim(),
      remarks: payload.remarks.trim(),
    })
    .eq('id', jobId);
  if (error) throw new Error(`update job failed: ${error.message}`);
}

export async function fetchJobDetail(
  id: string,
  client?: SupabaseClient,
): Promise<JobDetail | null> {
  const c = client ?? getSupabaseClient();
  const numericId = Number(id);
  if (!Number.isFinite(numericId)) return null; // local-only UUID not on server yet
  const { data, error } = await c
    .from('jobs')
    .select('*, job_photos(*), job_clips(*)')
    .eq('id', numericId)
    .maybeSingle();
  if (error) throw new Error(`job fetch: ${error.message}`);
  if (!data) return null;

  const raw = data as JobRow & { job_photos?: PhotoRow[]; job_clips?: ClipRow[] };
  const job = rowToJob(raw);
  const photos = (raw.job_photos ?? []).slice().sort((a, b) => a.id - b.id);
  const clips = (raw.job_clips ?? []).slice().sort((a, b) => a.id - b.id);

  const [photoUrls, clipUrls] = await Promise.all([
    signPaths(c, 'job-photos', photos.map((p) => p.storage_path)),
    signPaths(c, 'job-audio', clips.map((clip) => clip.audio_path)),
  ]);

  return {
    job,
    raw,
    photos: photos.map((p) => ({ ...p, signed_url: photoUrls.get(p.storage_path) ?? null })),
    clips: clips.map((c2) => ({ ...c2, signed_url: clipUrls.get(c2.audio_path) ?? null })),
  };
}
