import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from './db';
import { jobs, job_clips, job_photos } from './schema';
import { deleteMeta, getMetaString, setMetaString } from './sync/meta';

// Storage keys that hold content tied to the signed-in user.
// The auto-sync preference (@mendlog/auto_sync) is device-level, not per-user.
const PER_USER_ASYNC_STORAGE_KEYS = [
  '@mendlog/recent-searches-v1',
];

const LAST_USER_ID_KEY = 'auth.last_user_id';

// Remove everything that belongs to the signed-in user: their jobs, media,
// sync cursors, and AsyncStorage caches. Catalog tables (departments,
// machines) are intentionally preserved — they're shared reference data
// every user pulls identically.
export async function clearUserScopedData(): Promise<void> {
  await Promise.all([
    db.delete(jobs),
    db.delete(job_photos),
    db.delete(job_clips),
    deleteMeta('jobs.last_pulled_at'),
    deleteMeta('photos.last_pulled_at'),
    deleteMeta('clips.last_pulled_at'),
    deleteMeta(LAST_USER_ID_KEY),
    ...PER_USER_ASYNC_STORAGE_KEYS.map((k) =>
      AsyncStorage.removeItem(k).catch(() => {}),
    ),
  ]);
}

// Called on every sign-in. If the currently-signed-in user differs from
// the one whose data is on disk, wipe first — this is the safety net for
// interrupted sign-outs (app killed mid-wipe) and for accounts switched
// without a clean logout.
export async function ensureUserScopedDataForSession(userId: string): Promise<void> {
  const stored = await getMetaString(LAST_USER_ID_KEY);
  if (stored && stored !== userId) {
    await clearUserScopedData();
  }
  await setMetaString(LAST_USER_ID_KEY, userId);
}
