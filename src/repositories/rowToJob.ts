import type { Job, JobStatus, Lang } from '../types/job';

export interface JobRow {
  id: number | string;
  user_id: string;
  machine: string;
  dept: string;
  inv: string | null;
  date: string;
  reported_time: string;
  idle_minutes: number;
  status: JobStatus;
  lang: Lang;
  photos: number;
  clips: number;
  root_cause: string;
  description: string;
  corrective_action: string;
  remarks: string;
  created_at: string;
  updated_at: string;
}

export function rowToJob(row: JobRow): Job {
  return {
    id: typeof row.id === 'string' ? parseInt(row.id, 10) : row.id,
    machine: row.machine,
    dept: row.dept,
    inv: row.inv ?? '',
    date: row.date,
    time: row.reported_time.slice(0, 5),
    idleMinutes: row.idle_minutes,
    status: row.status,
    lang: row.lang,
    photos: row.photos,
    clips: row.clips,
    rootCause: row.root_cause,
    desc: row.description,
    action: row.corrective_action,
    remarks: row.remarks,
  };
}
