import type { SupabaseClient } from '@supabase/supabase-js';
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
  status: PhotoStatus;
  error: string | null;
  created_at: string;
  updated_at: string;
}

function extensionFor(mime: string): string {
  if (mime.includes('png')) return 'png';
  if (mime.includes('webp')) return 'webp';
  if (mime.includes('heic')) return 'heic';
  if (mime.includes('heif')) return 'heif';
  return 'jpg';
}

export async function uploadAndInsertPhoto(params: {
  userId: string;
  jobId: number;
  photo: StagedPhoto;
  client?: SupabaseClient;
}): Promise<PhotoRow> {
  const client = params.client ?? getSupabaseClient();
  const ext = extensionFor(params.photo.mimeType);
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const storagePath = `${params.userId}/${params.jobId}/${filename}`;

  const fileRes = await fetch(params.photo.uri);
  const bytes = await fileRes.arrayBuffer();
  if (!bytes.byteLength) throw new Error('photo produced empty file');

  const { error: upErr } = await client.storage
    .from('job-photos')
    .upload(storagePath, bytes, {
      contentType: params.photo.mimeType,
      upsert: false,
    });
  if (upErr) throw new Error(`photo upload failed: ${upErr.message}`);

  const { data, error } = await client
    .from('job_photos')
    .insert({
      job_id: params.jobId,
      storage_path: storagePath,
      mime_type: params.photo.mimeType,
      width: params.photo.width || null,
      height: params.photo.height || null,
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
