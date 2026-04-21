export type JobStatus = 'open' | 'awaiting-tl' | 'complete';

export type Lang = 'en' | 'si';

export interface Job {
  id: number;
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
}

export interface ActivityDay {
  date: string;
  count: number;
}
