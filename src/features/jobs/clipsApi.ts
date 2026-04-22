import NetInfo from '@react-native-community/netinfo';
import { eq } from 'drizzle-orm';
import { db } from '../../offline/db';
import { job_clips } from '../../offline/schema';
import { newId } from '../../offline/uuid';

// Offline-first clips API. Recording writes a local row with `local_uri` and
// marks it `pending_insert`; the sync engine later uploads the audio blob and
// invokes the transcribe-clip edge function. Transcripts therefore appear
// asynchronously once the device is online — the UI renders what it has.

export type ClipStatus =
  | 'pending'
  | 'transcribing'
  | 'post_processing'
  | 'done'
  | 'error';

export interface ClipRow {
  id: string; // local UUID
  server_id: number | null;
  job_id: string | null;
  user_id: string;
  local_uri: string | null;
  audio_path: string | null;
  duration_ms: number;
  transcript_raw: string | null;
  transcript_clean: string | null;
  transcript_en_raw: string | null;
  transcript_en_clean: string | null;
  status: ClipStatus;
  error: string | null;
}

function toClipRow(r: typeof job_clips.$inferSelect): ClipRow {
  return {
    id: r.id,
    server_id: r.server_id,
    job_id: r.job_id,
    user_id: r.user_id,
    local_uri: r.local_uri,
    audio_path: r.audio_path,
    duration_ms: r.duration_ms,
    transcript_raw: r.transcript_raw,
    transcript_clean: r.transcript_clean,
    transcript_en_raw: r.transcript_en_raw,
    transcript_en_clean: r.transcript_en_clean,
    status: r.status as ClipStatus,
    error: r.error,
  };
}

// Stage a recording locally. No network call — `local_uri` points at the
// file on device and the sync engine uploads it later.
export async function createAndUploadClip(params: {
  userId: string;
  localUri: string;
  durationMs: number;
}): Promise<ClipRow> {
  const id = newId();
  const nowMs = Date.now();
  await db.insert(job_clips).values({
    id,
    user_id: params.userId,
    job_id: null,
    local_uri: params.localUri,
    audio_path: null,
    duration_ms: Math.round(params.durationMs),
    status: 'pending',
    sync_state: 'pending_insert',
    upload_state: 'pending',
    created_at: nowMs,
    updated_at: nowMs,
  });
  const inserted = await db.select().from(job_clips).where(eq(job_clips.id, id)).limit(1);
  return toClipRow(inserted[0]);
}

export async function fetchClip(clipId: string): Promise<ClipRow | null> {
  const rows = await db.select().from(job_clips).where(eq(job_clips.id, clipId)).limit(1);
  return rows[0] ? toClipRow(rows[0]) : null;
}

// Attach a previously-recorded clip to a job. Marks pending_update so the
// sync engine re-pushes the FK change.
export async function linkClipToJob(clipId: string, jobId: string): Promise<void> {
  await db
    .update(job_clips)
    .set({ job_id: jobId, sync_state: 'pending_update', updated_at: Date.now() })
    .where(eq(job_clips.id, clipId));
}

// Dictation — voice into a form field. This is strictly online: the edge
// function does whisper + GPT cleanup in one request. We surface a clear
// error offline so the VoiceTextArea can show a friendly prompt.
export async function transcribeAudioOnce(localUri: string): Promise<string> {
  const net = await NetInfo.fetch();
  if (!net.isConnected || net.isInternetReachable === false) {
    throw new Error('OFFLINE: dictation requires an internet connection');
  }
  const { getSupabaseClient } = await import('../../lib/supabase');
  const c = getSupabaseClient();
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
    headers: { Authorization: `Bearer ${token}`, apikey: anonKey },
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

export function isOfflineError(e: unknown): boolean {
  return e instanceof Error && e.message.startsWith('OFFLINE:');
}
