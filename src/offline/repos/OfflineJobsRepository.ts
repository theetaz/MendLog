import { and, desc, eq, gte, isNull, lte, sql } from 'drizzle-orm';
import type {
  JobsPage,
  JobsRepository,
} from '../../repositories/JobsRepository';
import type { ActivityDay, Job, JobStatus, Lang } from '../../types/job';
import { db } from '../db';
import { job_clips, job_photos, jobs as jobsTable } from '../schema';

// JobsRepository implementation that reads entirely from the local SQLite
// mirror. The sync engine (src/offline/sync) keeps this mirror populated by
// pulling from Supabase. Swapped in everywhere `SupabaseJobsRepository` was
// used — keeps list and detail screens consistent now that writes are local.

interface JobRowLocal {
  id: string;
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

async function countForJob(
  table: typeof job_photos | typeof job_clips,
  jobId: string,
): Promise<number> {
  const rows = await db
    .select({ c: sql<number>`count(*)`.as('c') })
    .from(table)
    .where(and(eq(table.job_id, jobId), isNull(table.deleted_at)));
  return Number(rows[0]?.c ?? 0);
}

async function toJob(row: JobRowLocal): Promise<Job> {
  const [photoCount, clipCount] = await Promise.all([
    countForJob(job_photos, row.id),
    countForJob(job_clips, row.id),
  ]);
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
    photos: photoCount,
    clips: clipCount,
    rootCause: row.root_cause,
    desc: row.description,
    action: row.corrective_action,
    remarks: row.remarks,
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
