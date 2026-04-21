import type { SupabaseClient } from '@supabase/supabase-js';
import {
  manipulateAsync,
  SaveFormat,
  type ImageResult,
} from 'expo-image-manipulator';
import { getSupabaseClient } from '../../lib/supabase';
import type { StagedPhoto } from '../../components/form/PhotoGrid';

export type PhotoStatus = 'pending' | 'annotating' | 'done' | 'error';

export interface PhotoRow {
  id: number;
  job_id: number | null;
  user_id: string;
  storage_path: string;
  mime_type: string;
  width: number | null;
  height: number | null;
  ai_description: string | null;
  ai_tags: string[];
  blurhash: string | null;
  status: PhotoStatus;
  error: string | null;
  created_at: string;
  updated_at: string;
}

// Upload-time resize — caps the longest side and re-encodes as JPEG so any
// HEIC from iOS also becomes a universal JPEG on the server.
const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.8;

async function resizeForUpload(photo: StagedPhoto): Promise<ImageResult> {
  const w = photo.width || 0;
  const h = photo.height || 0;
  const longest = Math.max(w, h);
  const actions =
    longest > MAX_DIMENSION
      ? [
          {
            resize:
              w >= h ? { width: MAX_DIMENSION } : { height: MAX_DIMENSION },
          },
        ]
      : [];
  return manipulateAsync(photo.uri, actions, {
    compress: JPEG_QUALITY,
    format: SaveFormat.JPEG,
  });
}

export async function uploadAndInsertPhoto(params: {
  userId: string;
  jobId: number;
  photo: StagedPhoto;
  client?: SupabaseClient;
}): Promise<PhotoRow> {
  const client = params.client ?? getSupabaseClient();
  const processed = await resizeForUpload(params.photo);
  const mimeType = 'image/jpeg';
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
  const storagePath = `${params.userId}/${params.jobId}/${filename}`;

  const fileRes = await fetch(processed.uri);
  const bytes = await fileRes.arrayBuffer();
  if (!bytes.byteLength) throw new Error('photo produced empty file');

  const { error: upErr } = await client.storage
    .from('job-photos')
    .upload(storagePath, bytes, {
      contentType: mimeType,
      upsert: false,
    });
  if (upErr) throw new Error(`photo upload failed: ${upErr.message}`);

  const { data, error } = await client
    .from('job_photos')
    .insert({
      job_id: params.jobId,
      storage_path: storagePath,
      mime_type: mimeType,
      width: processed.width || params.photo.width || null,
      height: processed.height || params.photo.height || null,
    })
    .select('*')
    .single();

  if (error || !data) {
    await client.storage.from('job-photos').remove([storagePath]).catch(() => {});
    throw new Error(`photo insert failed: ${error?.message ?? 'no row returned'}`);
  }
  return data as PhotoRow;
}

export async function invokeAnnotatePhoto(
  photoId: number,
  client?: SupabaseClient,
): Promise<void> {
  const c = client ?? getSupabaseClient();
  const { error } = await c.functions.invoke('annotate-photo', {
    body: { photo_id: photoId },
  });
  if (error) throw new Error(`annotate invoke failed: ${error.message}`);
}

export interface PhotoThumb {
  url: string;
  blurhash: string | null;
}

/**
 * Returns a map of `job_id → up to `perJobLimit` photo thumbnails`
 * (signed URL + blurhash), oldest first. Used by list views to
 * populate JobAvatar collages without an N+1 request per card.
 */
export async function fetchPhotoThumbsForJobs(
  jobIds: number[],
  perJobLimit = 4,
  client?: SupabaseClient,
): Promise<Map<number, PhotoThumb[]>> {
  if (jobIds.length === 0) return new Map();
  const c = client ?? getSupabaseClient();

  const { data, error } = await c
    .from('job_photos')
    .select('job_id, storage_path, blurhash, created_at')
    .in('job_id', jobIds)
    .order('created_at', { ascending: true });
  if (error) throw new Error(`photo thumbs fetch: ${error.message}`);

  interface Row {
    job_id: number;
    storage_path: string;
    blurhash: string | null;
  }
  const rowsByJob = new Map<number, Row[]>();
  for (const row of (data ?? []) as Row[]) {
    const list = rowsByJob.get(row.job_id) ?? [];
    if (list.length < perJobLimit) {
      list.push(row);
      rowsByJob.set(row.job_id, list);
    }
  }

  const allPaths = Array.from(rowsByJob.values())
    .flat()
    .map((r) => r.storage_path);
  if (allPaths.length === 0) return new Map();

  const { data: signed, error: signErr } = await c.storage
    .from('job-photos')
    .createSignedUrls(allPaths, 3600);
  if (signErr) {
    console.warn('photo thumbs sign:', signErr.message);
    return new Map();
  }

  const urlByPath = new Map<string, string>();
  for (const entry of signed ?? []) {
    if (entry.path && entry.signedUrl) urlByPath.set(entry.path, entry.signedUrl);
  }

  const result = new Map<number, PhotoThumb[]>();
  for (const [jobId, rows] of rowsByJob) {
    const thumbs: PhotoThumb[] = rows
      .map((r) => {
        const url = urlByPath.get(r.storage_path);
        return url ? { url, blurhash: r.blurhash } : null;
      })
      .filter((t): t is PhotoThumb => !!t);
    if (thumbs.length > 0) result.set(jobId, thumbs);
  }
  return result;
}
