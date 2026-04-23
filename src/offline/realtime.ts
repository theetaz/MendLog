import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';
import { notifyLocalDataChanged } from './dataBus';
import { applyRemoteClip } from './sync/clips';
import { applyRemotePhoto } from './sync/photos';

// Realtime listener for server-side annotation/transcript writes. The
// edge functions `annotate-photo` and `transcribe-clip` update rows
// minutes after the client pushes — realtime lets us surface those
// updates immediately instead of waiting for the next sync pull.
//
// Fire-and-forget semantics: if the channel drops or the user is offline
// the data still lands via the scheduled pull.
export function subscribeRealtimeUpdates(
  client: SupabaseClient,
  userId: string,
): () => void {
  const channel: RealtimeChannel = client
    .channel(`mendlog:user:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'job_photos',
        filter: `user_id=eq.${userId}`,
      },
      async (payload) => {
        try {
          const changed = await applyRemotePhoto(
            payload.new as Record<string, unknown>,
          );
          if (changed) notifyLocalDataChanged();
        } catch (e) {
          console.warn('realtime photo merge failed', e);
        }
      },
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'job_clips',
        filter: `user_id=eq.${userId}`,
      },
      async (payload) => {
        try {
          const changed = await applyRemoteClip(
            payload.new as Record<string, unknown>,
          );
          if (changed) notifyLocalDataChanged();
        } catch (e) {
          console.warn('realtime clip merge failed', e);
        }
      },
    )
    .subscribe();

  return () => {
    client.removeChannel(channel).catch(() => {});
  };
}
