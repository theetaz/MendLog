import type { SupabaseClient } from '@supabase/supabase-js';
import { and, eq, inArray, isNotNull, isNull, or } from 'drizzle-orm';
import * as ImageManipulator from 'expo-image-manipulator';
import { Blurhash } from 'react-native-blurhash';
import { db } from '../db';
import { job_clips, job_photos } from '../schema';
import { now } from './time';

const MAX_ATTEMPTS = 5;

// Photo optimization budget. AI vision auto-downsizes to ~1024-1568px so
// 1600 keeps headroom for legibility (labels, dials) without wasting
// bandwidth or storage. Phone cameras emit ~4032×3024 by default.
const MAX_LONG_EDGE = 1600;
const JPEG_QUALITY = 0.7;
const BLURHASH_X = 4;
const BLURHASH_Y = 3;

type Bucket = 'job-photos' | 'job-audio';

interface OptimizedPhoto {
  uri: string;
  width: number;
  height: number;
  blurhash: string | null;
}

// Resize the captured image to MAX_LONG_EDGE, re-encode at JPEG_QUALITY,
// and compute a blurhash. Runs at upload time rather than capture time
// so the picker thumbnail appears instantly — both manipulator and
// blurhash round-trip the native bridge with full-resolution bitmaps,
// which can stall the picker for 30s+ on slower Android devices.
//
// Skips the manipulator when the source is already within budget so we
// don't introduce a pointless re-encode (which can compound JPEG artefacts).
async function optimizePhoto(
  localUri: string,
  knownWidth: number | null,
  knownHeight: number | null,
): Promise<OptimizedPhoto> {
  const w = knownWidth ?? 0;
  const h = knownHeight ?? 0;
  const long = Math.max(w, h);
  let outUri = localUri;
  let outW = w;
  let outH = h;
  if (long === 0 || long > MAX_LONG_EDGE) {
    const scale = long > MAX_LONG_EDGE ? MAX_LONG_EDGE / long : 1;
    const actions =
      scale < 1 && w > 0 && h > 0
        ? [{ resize: { width: Math.round(w * scale), height: Math.round(h * scale) } }]
        : [];
    const out = await ImageManipulator.manipulateAsync(localUri, actions, {
      compress: JPEG_QUALITY,
      format: ImageManipulator.SaveFormat.JPEG,
    });
    outUri = out.uri;
    outW = out.width;
    outH = out.height;
  }
  // Fail open: a missing hash just means no placeholder downstream, not
  // a failed upload. Capture-time errors used to cascade into Promise.all
  // and stall the entire batch; upload-time we just log and continue.
  let blurhash: string | null = null;
  try {
    blurhash = await Blurhash.encode(outUri, BLURHASH_X, BLURHASH_Y);
  } catch (e) {
    if (__DEV__) console.warn('blurhash encode failed', e);
  }
  return { uri: outUri, width: outW, height: outH, blurhash };
}

// Fetch the local file and upload its bytes to Supabase storage. RN's
// fetch() can read file:// URIs; arrayBuffer gives us bytes Supabase
// can accept.
async function uploadFile(
  client: SupabaseClient,
  bucket: Bucket,
  localUri: string,
  storagePath: string,
  contentType: string,
): Promise<void> {
  const res = await fetch(localUri);
  const bytes = await res.arrayBuffer();
  if (!bytes.byteLength) throw new Error('empty file');
  const { error } = await client.storage.from(bucket).upload(storagePath, bytes, {
    contentType,
    upsert: false,
  });
  if (error) throw new Error(error.message);
}

// Drain pending photo uploads. Path convention: `{user_id}/{local_id}.jpg` —
// flat rather than `{userId}/{jobId}/…` because the server-assigned jobId
// doesn't exist until the parent job row has pushed, and we don't want the
// upload blocked on that ordering.
export async function drainPhotoUploads(client: SupabaseClient): Promise<void> {
  const pending = await db
    .select()
    .from(job_photos)
    .where(
      and(
        isNotNull(job_photos.local_uri),
        isNull(job_photos.storage_path),
        or(eq(job_photos.upload_state, 'pending'), eq(job_photos.upload_state, 'failed')),
        isNull(job_photos.deleted_at),
      ),
    )
    .limit(25);

  for (const row of pending) {
    if (row.upload_attempts >= MAX_ATTEMPTS) continue;
    const path = `${row.user_id}/${row.id}.jpg`;
    await db
      .update(job_photos)
      .set({ upload_state: 'uploading', upload_attempts: row.upload_attempts + 1 })
      .where(eq(job_photos.id, row.id));
    try {
      const optimized = await optimizePhoto(row.local_uri!, row.width, row.height);
      await uploadFile(client, 'job-photos', optimized.uri, path, 'image/jpeg');
      await db
        .update(job_photos)
        .set({
          upload_state: 'uploaded',
          storage_path: path,
          width: optimized.width,
          height: optimized.height,
          blurhash: optimized.blurhash,
          mime_type: 'image/jpeg',
          upload_error: null,
          updated_at: now(),
          sync_state: row.sync_state === 'synced' ? 'pending_update' : row.sync_state,
        })
        .where(eq(job_photos.id, row.id));
    } catch (e) {
      await db
        .update(job_photos)
        .set({
          upload_state: 'failed',
          upload_error: e instanceof Error ? e.message : String(e),
        })
        .where(eq(job_photos.id, row.id));
    }
  }
}

// Drain pending clip uploads. Same convention; clips are M4A.
export async function drainClipUploads(client: SupabaseClient): Promise<void> {
  const pending = await db
    .select()
    .from(job_clips)
    .where(
      and(
        isNotNull(job_clips.local_uri),
        isNull(job_clips.audio_path),
        or(eq(job_clips.upload_state, 'pending'), eq(job_clips.upload_state, 'failed')),
        isNull(job_clips.deleted_at),
      ),
    )
    .limit(25);

  for (const row of pending) {
    if (row.upload_attempts >= MAX_ATTEMPTS) continue;
    const path = `${row.user_id}/${row.id}.m4a`;
    await db
      .update(job_clips)
      .set({ upload_state: 'uploading', upload_attempts: row.upload_attempts + 1 })
      .where(eq(job_clips.id, row.id));
    try {
      await uploadFile(client, 'job-audio', row.local_uri!, path, 'audio/m4a');
      await db
        .update(job_clips)
        .set({
          upload_state: 'uploaded',
          audio_path: path,
          upload_error: null,
          updated_at: now(),
          sync_state: row.sync_state === 'synced' ? 'pending_update' : row.sync_state,
        })
        .where(eq(job_clips.id, row.id));
    } catch (e) {
      await db
        .update(job_clips)
        .set({
          upload_state: 'failed',
          upload_error: e instanceof Error ? e.message : String(e),
        })
        .where(eq(job_clips.id, row.id));
    }
  }
}

// Count of rows waiting on a file upload — useful for the UI sync indicator.
// Tombstones (deleted_at set) are excluded; the drainers already skip them,
// but without this filter the counter stayed ≥1 after a job delete and the
// sync badge got stuck in "uploading" until pushJobDeletes ran and wiped
// the rows locally.
export async function pendingUploadCount(): Promise<number> {
  const photos = await db
    .select({ id: job_photos.id })
    .from(job_photos)
    .where(
      and(
        isNotNull(job_photos.local_uri),
        isNull(job_photos.storage_path),
        isNull(job_photos.deleted_at),
      ),
    );
  const clips = await db
    .select({ id: job_clips.id })
    .from(job_clips)
    .where(
      and(
        isNotNull(job_clips.local_uri),
        isNull(job_clips.audio_path),
        isNull(job_clips.deleted_at),
      ),
    );
  return photos.length + clips.length;
}

// Marked-synced helpers; exposed so tests / tooling can reset queues if needed.
export async function resetFailedUploads(): Promise<void> {
  await db
    .update(job_photos)
    .set({ upload_state: 'pending', upload_attempts: 0, upload_error: null })
    .where(inArray(job_photos.upload_state, ['failed', 'uploading']));
  await db
    .update(job_clips)
    .set({ upload_state: 'pending', upload_attempts: 0, upload_error: null })
    .where(inArray(job_clips.upload_state, ['failed', 'uploading']));
}
