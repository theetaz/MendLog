// Single source of truth for "how synced is this job?" — every UI surface
// (JobCard badge, detail header, AppBar dot aggregation, Me-screen
// breakdown) derives from this so they agree by construction.
//
// We don't store this state on the job row because it's purely a function
// of the child rows and their upload/annotation progress. Recomputing is
// cheap and avoids a whole class of staleness bugs.

// Minimal row shapes the helper needs. Using ad-hoc interfaces (not the
// full Drizzle select types) so this module stays importable from tests
// and doesn't drag in the sqlite layer.
export interface JobLike {
  sync_state: string;
}

export interface PhotoLike {
  sync_state: string;
  upload_state: string;
  status: string;
}

export interface ClipLike {
  sync_state: string;
  upload_state: string;
  status: string;
}

export type JobSyncState =
  | 'offline' // job row never reached the server
  | 'uploading' // files still need to upload, or row push still pending
  | 'processing' // uploaded + row synced, AI workflows in flight
  | 'error' // at least one child is in error status
  | 'synced'; // everything done

// Ordered worst→best so .reduce() style "take the more pessimistic of A|B"
// comparisons work naturally.
const SEVERITY: Record<JobSyncState, number> = {
  offline: 4,
  error: 3,
  uploading: 2,
  processing: 1,
  synced: 0,
};

export function worseOf(a: JobSyncState, b: JobSyncState): JobSyncState {
  return SEVERITY[a] >= SEVERITY[b] ? a : b;
}

// Per-item classifier. A photo is "done" when its file is uploaded, its
// row is pushed, and the AI annotation has finished (status=done).
// Exported so per-item UI (photo tiles, clip rows) can render the same
// badge the aggregate uses.
export function classifyChildSyncState(child: PhotoLike | ClipLike): JobSyncState {
  if (child.upload_state === 'pending' || child.upload_state === 'uploading') {
    return 'uploading';
  }
  if (child.upload_state === 'failed') return 'error';
  if (child.sync_state !== 'synced') return 'uploading'; // row push pending/update
  if (child.status === 'error') return 'error';
  if (child.status === 'done') return 'synced';
  return 'processing'; // pending | annotating | transcribing | post_processing
}

// Entry point used by every sync-aware UI surface.
export function computeJobSyncState(
  job: JobLike,
  photos: readonly PhotoLike[],
  clips: readonly ClipLike[],
): JobSyncState {
  if (job.sync_state !== 'synced') return 'offline';
  let worst: JobSyncState = 'synced';
  for (const p of photos) worst = worseOf(worst, classifyChildSyncState(p));
  for (const c of clips) worst = worseOf(worst, classifyChildSyncState(c));
  return worst;
}

// Flat breakdown used by the Me-screen sync section — lets the UI show
// "3 photos uploading · 2 processing · 1 failed" without classifying
// twice. Returns zeros for every bucket so the consumer can render a
// stable grid without null checks.
export interface JobSyncBreakdown {
  photosUploading: number;
  photosProcessing: number;
  photosError: number;
  photosDone: number;
  clipsUploading: number;
  clipsProcessing: number;
  clipsError: number;
  clipsDone: number;
}

export function computeJobSyncBreakdown(
  photos: readonly PhotoLike[],
  clips: readonly ClipLike[],
): JobSyncBreakdown {
  const b: JobSyncBreakdown = {
    photosUploading: 0,
    photosProcessing: 0,
    photosError: 0,
    photosDone: 0,
    clipsUploading: 0,
    clipsProcessing: 0,
    clipsError: 0,
    clipsDone: 0,
  };
  for (const p of photos) {
    const s = classifyChildSyncState(p);
    if (s === 'uploading' || s === 'offline') b.photosUploading += 1;
    else if (s === 'processing') b.photosProcessing += 1;
    else if (s === 'error') b.photosError += 1;
    else b.photosDone += 1;
  }
  for (const c of clips) {
    const s = classifyChildSyncState(c);
    if (s === 'uploading' || s === 'offline') b.clipsUploading += 1;
    else if (s === 'processing') b.clipsProcessing += 1;
    else if (s === 'error') b.clipsError += 1;
    else b.clipsDone += 1;
  }
  return b;
}

// Human labels for the UI — keyed on state so every surface says the
// same thing.
export const SYNC_STATE_LABEL: Record<JobSyncState, string> = {
  synced: 'Synced',
  processing: 'Processing',
  uploading: 'Uploading',
  error: 'Needs attention',
  offline: 'Not synced',
};
