import NetInfo from '@react-native-community/netinfo';
import { inArray, isNull } from 'drizzle-orm';
import { db } from '../../offline/db';
import { job_photos } from '../../offline/schema';
import { getSupabaseClient } from '../../lib/supabase';

// Photos are read from the local DB. For rows that have been uploaded (they
// carry a `storage_path`) we sign URLs when online; for still-local rows
// we use the `local_uri` directly so they render the moment they're staged.
//
// The legacy `uploadAndInsertPhoto` function is gone — staging happens in
// `saveJob` and the upload queue drains to Supabase.

export interface PhotoThumb {
  url: string;
  blurhash: string | null;
}

const SIGNED_URL_TTL = 60 * 60;

export async function fetchPhotoThumbsForJobs(
  jobIds: string[],
  perJobLimit = 4,
): Promise<Map<string, PhotoThumb[]>> {
  if (jobIds.length === 0) return new Map();

  const rows = await db
    .select()
    .from(job_photos)
    .where(inArray(job_photos.job_id, jobIds));

  // Group by job_id honouring the per-job cap and skipping soft-deleted rows.
  const byJob = new Map<string, (typeof rows)[number][]>();
  for (const row of rows) {
    if (row.deleted_at) continue;
    const list = byJob.get(row.job_id) ?? [];
    if (list.length < perJobLimit) {
      list.push(row);
      byJob.set(row.job_id, list);
    }
  }

  // Split rows by whether they're uploaded. Uploaded rows need a signed URL
  // if we're online; still-local rows use the file:// uri directly.
  const pathsToSign = Array.from(byJob.values())
    .flat()
    .map((r) => r.storage_path)
    .filter((p): p is string => !!p);

  const urlByPath = await maybeSignPaths('job-photos', pathsToSign);

  const out = new Map<string, PhotoThumb[]>();
  for (const [jobId, list] of byJob) {
    const thumbs: PhotoThumb[] = list
      .map((r) => {
        const remote = r.storage_path ? urlByPath.get(r.storage_path) : undefined;
        const url = remote ?? r.local_uri;
        return url ? { url, blurhash: r.blurhash } : null;
      })
      .filter((t): t is PhotoThumb => !!t);
    if (thumbs.length > 0) out.set(jobId, thumbs);
  }
  return out;
}

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

// Silence unused-variable warning — helper kept for future offline cleanup.
void isNull;
