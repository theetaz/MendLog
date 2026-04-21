import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseClient } from '../../lib/supabase';

export type ClipStatus =
  | 'pending'
  | 'transcribing'
  | 'post_processing'
  | 'done'
  | 'error';

export interface ClipRow {
  id: number;
  job_id: number | null;
  user_id: string;
  audio_path: string;
  duration_ms: number;
  transcript_raw: string | null;
  transcript_clean: string | null;
  transcript_en_raw: string | null;
  transcript_en_clean: string | null;
  status: ClipStatus;
  error: string | null;
  created_at: string;
  updated_at: string;
}

export async function createAndUploadClip(params: {
  userId: string;
  localUri: string;
  durationMs: number;
  client?: SupabaseClient;
}): Promise<ClipRow> {
  const client = params.client ?? getSupabaseClient();
  const filename = `${Date.now()}.m4a`;
  const audioPath = `${params.userId}/${filename}`;

  const fileRes = await fetch(params.localUri);
  const bytes = await fileRes.arrayBuffer();
  if (!bytes.byteLength) throw new Error('recording produced empty file');

  const { error: uploadErr } = await client.storage
    .from('job-audio')
    .upload(audioPath, bytes, {
      contentType: 'audio/m4a',
      upsert: false,
    });
  if (uploadErr) throw new Error(`upload failed: ${uploadErr.message}`);

  const { data, error } = await client
    .from('job_clips')
    .insert({
      audio_path: audioPath,
      duration_ms: Math.round(params.durationMs),
    })
    .select('*')
    .single();

  if (error || !data) {
    await client.storage.from('job-audio').remove([audioPath]).catch(() => {});
    throw new Error(`insert failed: ${error?.message ?? 'no row returned'}`);
  }
  return data as ClipRow;
}

export interface TranscribeResult {
  ok: true;
  clip_id: number;
  transcript_raw: string;
  transcript_clean: string;
  transcript_en_raw: string;
  transcript_en_clean: string;
}

export async function invokeTranscribe(
  clipId: number,
  client?: SupabaseClient,
): Promise<TranscribeResult> {
  const c = client ?? getSupabaseClient();
  const { data, error } = await c.functions.invoke<TranscribeResult>('transcribe-clip', {
    body: { clip_id: clipId },
  });
  if (error) throw new Error(`invoke failed: ${error.message}`);
  if (!data?.ok) throw new Error('invoke returned no result');
  return data;
}

export function subscribeToClip(
  clipId: number,
  onUpdate: (row: ClipRow) => void,
  client?: SupabaseClient,
): () => void {
  const c = client ?? getSupabaseClient();
  const channel: RealtimeChannel = c
    .channel(`clip-${clipId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'job_clips',
        filter: `id=eq.${clipId}`,
      },
      (payload) => {
        const row = payload.new as ClipRow | undefined;
        if (row) onUpdate(row);
      },
    )
    .subscribe();

  return () => {
    c.removeChannel(channel).catch(() => {});
  };
}

/**
 * Ad-hoc audio-to-English via the `transcribe-audio` edge function.
 * Doesn't persist anything — use for voice-into-form-field dictation.
 *
 * React Native can't build Blobs from ArrayBuffers, so we POST directly with
 * the native {uri, name, type} FormData file shape and let the platform
 * stream the file.
 */
export async function transcribeAudioOnce(
  localUri: string,
  client?: SupabaseClient,
): Promise<string> {
  const c = client ?? getSupabaseClient();
  const { data: sessionData } = await c.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) throw new Error('not authenticated');

  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) throw new Error('supabase env missing');

  const form = new FormData();
  form.append('file', {
    uri: localUri,
    name: `dictation-${Date.now()}.m4a`,
    type: 'audio/m4a',
  } as unknown as Blob);

  const res = await fetch(`${supabaseUrl}/functions/v1/transcribe-audio`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: anonKey,
    },
    body: form,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`transcribe-audio ${res.status}: ${text || 'failed'}`);
  }
  const data = (await res.json()) as { ok?: boolean; text?: string; error?: string };
  if (!data.ok) throw new Error(data.error ?? 'invalid response');
  return (data.text ?? '').trim();
}

export async function fetchClip(
  clipId: number,
  client?: SupabaseClient,
): Promise<ClipRow | null> {
  const c = client ?? getSupabaseClient();
  const { data, error } = await c
    .from('job_clips')
    .select('*')
    .eq('id', clipId)
    .maybeSingle();
  if (error) throw new Error(`fetch failed: ${error.message}`);
  return (data as ClipRow | null) ?? null;
}
