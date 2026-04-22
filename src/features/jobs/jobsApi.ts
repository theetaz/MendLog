import NetInfo from '@react-native-community/netinfo';
import { and, eq, isNull } from 'drizzle-orm';
import type { StagedPhoto } from '../../components/form/PhotoGrid';
import { getSupabaseClient } from '../../lib/supabase';
import { db } from '../../offline/db';
import { notifyLocalDataChanged } from '../../offline/dataBus';
import { job_clips, job_photos, jobs as jobsTable } from '../../offline/schema';
import { newId } from '../../offline/uuid';
import type { Job, JobStatus } from '../../types/job';

// Offline-first data layer for jobs. All reads/writes hit the local SQLite
// mirror; the sync engine (src/offline/sync) eventually pushes to Supabase.
// Screens should not need to know where the data lives — they call these
// helpers exactly as before.

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
  clipIds: string[]; // local UUIDs from previously-recorded clips
  photos: StagedPhoto[];
}

export interface SavedJob {
  id: string;
  photoCount: number;
  clipCount: number;
}

function toDateOnly(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`;
}

function toTimeOnly(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(
    2,
    '0',
  )}:${String(d.getSeconds()).padStart(2, '0')}`;
}

// Save a job entirely to the local DB. Photos arrive as StagedPhoto from the
// form (local file URIs) and are inserted as pending upload_state rows;
// clip IDs are updated to link to the new job. Zero network calls.
export async function saveJob(userId: string, payload: JobFormPayload): Promise<SavedJob> {
  const jobId = newId();
  const nowMs = Date.now();

  await db.insert(jobsTable).values({
    id: jobId,
    user_id: userId,
    sync_state: 'pending_insert',
    created_at: nowMs,
    updated_at: nowMs,
    machine: payload.machine.trim(),
    dept: payload.dept.trim(),
    inv: payload.inv.trim() || null,
    date: toDateOnly(payload.reportedAt),
    reported_time: toTimeOnly(payload.reportedAt),
    completed_at: payload.completedAt ? payload.completedAt.toISOString() : null,
    idle_minutes: payload.idleMinutes,
    status: payload.status,
    lang: 'en',
    description: payload.description.trim(),
    root_cause: payload.rootCause.trim(),
    corrective_action: payload.correctiveAction.trim(),
    remarks: payload.remarks.trim(),
  });

  for (const clipId of payload.clipIds) {
    await db
      .update(job_clips)
      .set({ job_id: jobId, sync_state: 'pending_update', updated_at: nowMs })
      .where(eq(job_clips.id, clipId));
  }

  for (const photo of payload.photos) {
    await db.insert(job_photos).values({
      id: newId(),
      user_id: userId,
      job_id: jobId,
      sync_state: 'pending_insert',
      created_at: nowMs,
      updated_at: nowMs,
      local_uri: photo.uri,
      storage_path: null,
      mime_type: 'image/jpeg',
      width: photo.width ?? null,
      height: photo.height ?? null,
      status: 'pending',
      upload_state: 'pending',
    });
  }

  notifyLocalDataChanged();
  return {
    id: jobId,
    photoCount: payload.photos.length,
    clipCount: payload.clipIds.length,
  };
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

export async function updateJob(jobId: string, payload: JobUpdatePayload): Promise<void> {
  const nowMs = Date.now();
  const result = await db
    .update(jobsTable)
    .set({
      machine: payload.machine.trim(),
      dept: payload.dept.trim(),
      inv: payload.inv.trim() || null,
      date: toDateOnly(payload.reportedAt),
      reported_time: toTimeOnly(payload.reportedAt),
      completed_at: payload.completedAt ? payload.completedAt.toISOString() : null,
      idle_minutes: payload.idleMinutes,
      status: payload.status,
      description: payload.description.trim(),
      root_cause: payload.rootCause.trim(),
      corrective_action: payload.correctiveAction.trim(),
      remarks: payload.remarks.trim(),
      sync_state: 'pending_update',
      updated_at: nowMs,
    })
    .where(eq(jobsTable.id, jobId));
  void result;
  notifyLocalDataChanged();
}

// Soft delete — keeps the tombstone locally until sync drains it. The sync
// engine currently skips pending_delete (see sync/jobs.ts TODO); this still
// hides the job from every list query.
export async function deleteJob(jobId: string): Promise<void> {
  const nowMs = Date.now();
  await db
    .update(jobsTable)
    .set({ sync_state: 'pending_delete', deleted_at: nowMs, updated_at: nowMs })
    .where(eq(jobsTable.id, jobId));
  notifyLocalDataChanged();
}

export async function linkClipToJob(clipId: string, jobId: string): Promise<void> {
  await db
    .update(job_clips)
    .set({ job_id: jobId, sync_state: 'pending_update', updated_at: Date.now() })
    .where(eq(job_clips.id, clipId));
  notifyLocalDataChanged();
}

// Soft delete. The sync engine doesn't yet push pending_delete (TODO) but
// the rows are hidden from every list query via the deleted_at filter.
export async function deletePhoto(photoId: string): Promise<void> {
  const nowMs = Date.now();
  await db
    .update(job_photos)
    .set({ sync_state: 'pending_delete', deleted_at: nowMs, updated_at: nowMs })
    .where(eq(job_photos.id, photoId));
  notifyLocalDataChanged();
}

export async function deleteClip(clipId: string): Promise<void> {
  const nowMs = Date.now();
  await db
    .update(job_clips)
    .set({ sync_state: 'pending_delete', deleted_at: nowMs, updated_at: nowMs })
    .where(eq(job_clips.id, clipId));
  notifyLocalDataChanged();
}

// Stage a new photo during an edit. Same shape as the new-job staging path
// in `saveJob`: row is pending_insert with local_uri, upload_state pending.
export async function addPhotoToJob(
  userId: string,
  jobId: string,
  photo: StagedPhoto,
): Promise<void> {
  const nowMs = Date.now();
  await db.insert(job_photos).values({
    id: newId(),
    user_id: userId,
    job_id: jobId,
    sync_state: 'pending_insert',
    created_at: nowMs,
    updated_at: nowMs,
    local_uri: photo.uri,
    storage_path: null,
    mime_type: 'image/jpeg',
    width: photo.width ?? null,
    height: photo.height ?? null,
    status: 'pending',
    upload_state: 'pending',
  });
  notifyLocalDataChanged();
}

// --- Read path --- //

export interface PhotoWithUrl {
  id: string;
  signed_url: string | null; // cloud URL when uploaded, file:// when local-only
  mime_type: string;
  width: number | null;
  height: number | null;
  blurhash: string | null;
  ai_description: string | null;
  ai_tags: string[];
  status: string;
}

export interface ClipWithUrl {
  id: string;
  signed_url: string | null;
  duration_ms: number;
  transcript_raw: string | null;
  transcript_clean: string | null;
  transcript_en_raw: string | null;
  transcript_en_clean: string | null;
  status: string;
}

export interface JobDetail {
  job: Job;
  photos: PhotoWithUrl[];
  clips: ClipWithUrl[];
}

const SIGNED_URL_TTL = 60 * 60;

async function maybeSignPaths(bucket: string, paths: string[]): Promise<Map<string, string>> {
  if (paths.length === 0) return new Map();
  const net = await NetInfo.fetch().catch(() => null);
  if (!net?.isConnected) return new Map();
  const client = getSupabaseClient();
  const { data, error } = await client.storage.from(bucket).createSignedUrls(paths, SIGNED_URL_TTL);
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

export async function fetchJobDetail(id: string): Promise<JobDetail | null> {
  const jobRows = await db.select().from(jobsTable).where(eq(jobsTable.id, id)).limit(1);
  if (jobRows.length === 0) return null;
  const jobRow = jobRows[0];
  if (jobRow.deleted_at) return null;

  const photos = await db
    .select()
    .from(job_photos)
    .where(and(eq(job_photos.job_id, id), isNull(job_photos.deleted_at)));
  const clips = await db
    .select()
    .from(job_clips)
    .where(and(eq(job_clips.job_id, id), isNull(job_clips.deleted_at)));

  const photoPaths = photos.map((p) => p.storage_path).filter((p): p is string => !!p);
  const clipPaths = clips.map((c) => c.audio_path).filter((p): p is string => !!p);
  const [photoUrls, clipUrls] = await Promise.all([
    maybeSignPaths('job-photos', photoPaths),
    maybeSignPaths('job-audio', clipPaths),
  ]);

  const job: Job = {
    id: jobRow.id,
    machine: jobRow.machine,
    dept: jobRow.dept,
    inv: jobRow.inv ?? '',
    date: jobRow.date,
    time: jobRow.reported_time.slice(0, 5),
    completedAt: jobRow.completed_at,
    idleMinutes: jobRow.idle_minutes,
    status: jobRow.status as JobStatus,
    lang: jobRow.lang as Job['lang'],
    photos: photos.length,
    clips: clips.length,
    rootCause: jobRow.root_cause,
    desc: jobRow.description,
    action: jobRow.corrective_action,
    remarks: jobRow.remarks,
  };

  return {
    job,
    photos: photos.map<PhotoWithUrl>((p) => ({
      id: p.id,
      signed_url:
        (p.storage_path ? photoUrls.get(p.storage_path) : null) ?? p.local_uri ?? null,
      mime_type: p.mime_type,
      width: p.width,
      height: p.height,
      blurhash: p.blurhash,
      ai_description: p.ai_description,
      ai_tags: p.ai_tags ? safeJsonArray(p.ai_tags) : [],
      status: p.status,
    })),
    clips: clips.map<ClipWithUrl>((c) => ({
      id: c.id,
      signed_url: (c.audio_path ? clipUrls.get(c.audio_path) : null) ?? c.local_uri ?? null,
      duration_ms: c.duration_ms,
      transcript_raw: c.transcript_raw,
      transcript_clean: c.transcript_clean,
      transcript_en_raw: c.transcript_en_raw,
      transcript_en_clean: c.transcript_en_clean,
      status: c.status,
    })),
  };
}

function safeJsonArray(s: string): string[] {
  try {
    const parsed = JSON.parse(s);
    return Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch {
    return [];
  }
}
