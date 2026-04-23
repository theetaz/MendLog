import { and, desc, eq, gte, isNull, lte, sql } from 'drizzle-orm';
import type {
  JobsPage,
  JobsRepository,
} from '../../repositories/JobsRepository';
import type { ActivityDay, Job, JobStatus, Lang } from '../../types/job';
import { db } from '../db';
import { job_clips, job_photos, jobs as jobsTable } from '../schema';
import { computeJobSyncState } from '../syncState';

// JobsRepository implementation that reads entirely from the local SQLite
// mirror. The sync engine (src/offline/sync) keeps this mirror populated by
// pulling from Supabase. Swapped in everywhere `SupabaseJobsRepository` was
// used — keeps list and detail screens consistent now that writes are local.

interface JobRowLocal {
  id: string;
  sync_state: string;
  machine: string;
  dept: string;
  inv: string | null;
  date: string;
  reported_time: string;
  completed_at: string | null;
  idle_minutes: number;
  status: string;
  lang: string;
  description: string;
  root_cause: string;
  corrective_action: string;
  remarks: string;
}

// One query per child table per job — returns only the fields the sync
// classifier needs, so SQLite can serve them fast even on a cold row.
async function childrenForJob(row: JobRowLocal) {
  const [photos, clips] = await Promise.all([
    db
      .select({
        sync_state: job_photos.sync_state,
        upload_state: job_photos.upload_state,
        status: job_photos.status,
      })
      .from(job_photos)
      .where(and(eq(job_photos.job_id, row.id), isNull(job_photos.deleted_at))),
    db
      .select({
        sync_state: job_clips.sync_state,
        upload_state: job_clips.upload_state,
        status: job_clips.status,
      })
      .from(job_clips)
      .where(and(eq(job_clips.job_id, row.id), isNull(job_clips.deleted_at))),
  ]);
  return { photos, clips };
}

async function toJob(row: JobRowLocal): Promise<Job> {
  const { photos, clips } = await childrenForJob(row);
  return {
    id: row.id,
    machine: row.machine,
    dept: row.dept,
    inv: row.inv ?? '',
    date: row.date,
    time: row.reported_time.slice(0, 5),
    completedAt: row.completed_at,
    idleMinutes: row.idle_minutes,
    status: row.status as JobStatus,
    lang: row.lang as Lang,
    photos: photos.length,
    clips: clips.length,
    rootCause: row.root_cause,
    desc: row.description,
    action: row.corrective_action,
    remarks: row.remarks,
    syncState: computeJobSyncState(row, photos, clips),
  };
}

export class OfflineJobsRepository implements JobsRepository {
  constructor(private readonly clock: () => Date = () => new Date()) {}

  async listJobs(): Promise<Job[]> {
    const rows = await db
      .select()
      .from(jobsTable)
      .where(isNull(jobsTable.deleted_at))
      .orderBy(desc(jobsTable.date), desc(jobsTable.reported_time))
      .limit(500);
    return Promise.all(rows.map(toJob));
  }

  async listJobsForDate(
    dateIso: string,
    opts: { limit?: number; offset?: number } = {},
  ): Promise<JobsPage> {
    const limit = Math.max(1, opts.limit ?? 20);
    const offset = Math.max(0, opts.offset ?? 0);
    // Fetch one extra to detect hasMore without a separate count query.
    const rows = await db
      .select()
      .from(jobsTable)
      .where(and(eq(jobsTable.date, dateIso), isNull(jobsTable.deleted_at)))
      .orderBy(jobsTable.reported_time)
      .limit(limit + 1)
      .offset(offset);
    const hasMore = rows.length > limit;
    const slice = hasMore ? rows.slice(0, limit) : rows;
    return { jobs: await Promise.all(slice.map(toJob)), hasMore };
  }

  async getJob(id: string): Promise<Job | null> {
    const rows = await db
      .select()
      .from(jobsTable)
      .where(and(eq(jobsTable.id, id), isNull(jobsTable.deleted_at)))
      .limit(1);
    return rows[0] ? toJob(rows[0]) : null;
  }

  async getActivity(weeks: number): Promise<ActivityDay[]> {
    const end = this.clock();
    const start = new Date(end);
    start.setUTCDate(end.getUTCDate() - (weeks * 7 - 1));
    const startIso = isoDate(start);
    const endIso = isoDate(end);

    const rows = await db
      .select({ date: jobsTable.date, c: sql<number>`count(*)`.as('c') })
      .from(jobsTable)
      .where(
        and(
          isNull(jobsTable.deleted_at),
          gte(jobsTable.date, startIso),
          lte(jobsTable.date, endIso),
        ),
      )
      .groupBy(jobsTable.date);

    const byDate = new Map<string, number>();
    for (const r of rows) byDate.set(r.date, Number(r.c));

    // Fill zeros for every day in range so the contribution grid renders a
    // full column for each week.
    const out: ActivityDay[] = [];
    for (let i = 0; i < weeks * 7; i++) {
      const d = new Date(start);
      d.setUTCDate(start.getUTCDate() + i);
      const date = isoDate(d);
      out.push({ date, count: byDate.get(date) ?? 0 });
    }
    return out;
  }
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}
