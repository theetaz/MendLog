import type { JobSyncState } from '../offline/syncState';

export type JobStatus = 'open' | 'awaiting-tl' | 'complete';

export type Lang = 'en' | 'si';

export interface Job {
  // Local UUID for offline-created rows; stringified bigserial for rows
  // sourced from Supabase. Screens pass it through opaquely — only the
  // sync layer cares that both forms can coexist.
  id: string;
  machine: string;
  dept: string;
  inv: string;
  date: string;
  time: string;
  completedAt: string | null;
  idleMinutes: number;
  status: JobStatus;
  lang: Lang;
  photos: number;
  clips: number;
  rootCause: string;
  desc: string;
  action: string;
  remarks: string;
  // Derived by OfflineJobsRepository from the child rows' sync/upload/AI
  // status. Optional so repos that don't have the children loaded (e.g.
  // the legacy Supabase repo or test doubles) can skip the computation.
  syncState?: JobSyncState;
}

export interface ActivityDay {
  date: string;
  count: number;
}
