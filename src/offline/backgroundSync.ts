import AsyncStorage from '@react-native-async-storage/async-storage';
import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';
import { getSupabaseClient } from '../lib/supabase';
import { runFullSync } from './sync';

// OS-level background sync. Uses expo-background-task, which wraps
// WorkManager on Android and BGTaskScheduler on iOS. The OS decides
// when to fire based on network, battery, and app usage — we just ask
// for a minimum interval and run `runFullSync` when we're woken up.
//
// Must live at module scope: TaskManager.defineTask registers the handler
// against the JS runtime at load time so the OS can invoke it even when
// no UI is mounted.

export const BACKGROUND_SYNC_TASK = 'mendlog-background-sync';

// Minutes — iOS/Android round up and may not honor exactly. 15 matches
// the platform minimum on both; anything smaller is silently coerced.
const MIN_INTERVAL_MINUTES = 15;

const AUTO_SYNC_KEY = '@mendlog/auto_sync';

TaskManager.defineTask(BACKGROUND_SYNC_TASK, async () => {
  try {
    // Honor the user's auto-sync preference — if they've turned it off in
    // the Me screen, the OS can still wake us but we should no-op.
    const pref = await AsyncStorage.getItem(AUTO_SYNC_KEY).catch(() => null);
    if (pref === 'off') return BackgroundTask.BackgroundTaskResult.Success;

    const client = getSupabaseClient();
    const { data, error } = await client.auth.getSession();
    if (error || !data.session) {
      // Not logged in → nothing to sync. Return Success so the OS keeps
      // scheduling us; Failed is for retriable errors only.
      return BackgroundTask.BackgroundTaskResult.Success;
    }

    await runFullSync(client, data.session.user.id);
    return BackgroundTask.BackgroundTaskResult.Success;
  } catch (e) {
    console.warn('background sync failed', e);
    return BackgroundTask.BackgroundTaskResult.Failed;
  }
});

// Idempotent — registering twice is a no-op. Call from the SyncProvider
// once the user is authenticated; unregister on sign-out is optional
// since the handler short-circuits on a missing session.
export async function ensureBackgroundSyncRegistered(): Promise<void> {
  try {
    const status = await BackgroundTask.getStatusAsync();
    if (status === BackgroundTask.BackgroundTaskStatus.Restricted) return;

    const registered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_SYNC_TASK);
    if (registered) return;

    await BackgroundTask.registerTaskAsync(BACKGROUND_SYNC_TASK, {
      minimumInterval: MIN_INTERVAL_MINUTES,
    });
  } catch (e) {
    console.warn('background sync registration failed', e);
  }
}

export async function unregisterBackgroundSync(): Promise<void> {
  try {
    const registered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_SYNC_TASK);
    if (registered) await BackgroundTask.unregisterTaskAsync(BACKGROUND_SYNC_TASK);
  } catch (e) {
    console.warn('background sync unregister failed', e);
  }
}
