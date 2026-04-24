import type { SupabaseClient } from '@supabase/supabase-js';
import type { ActivityDay, Job } from '../types/job';
import { addDaysLocal, localDateIso } from '../utils/localDate';
import type { JobsPage, JobsRepository } from './JobsRepository';
import { rowToJob, type JobRow } from './rowToJob';

interface ActivityRow {
  day: string;
  count: number;
}

export class SupabaseJobsRepository implements JobsRepository {
  constructor(
    private readonly client: SupabaseClient,
    private readonly clock: () => Date = () => new Date(),
  ) {}

  async listJobs(): Promise<Job[]> {
    const { data, error } = await this.client
      .from('jobs')
      .select('*')
      .order('date', { ascending: false })
      .order('reported_time', { ascending: false })
      .limit(500);
    if (error) throw error;
    const rows = (data ?? []) as JobRow[];
    return rows.map(rowToJob);
  }

  async listJobsForDate(
    dateIso: string,
    opts: { limit?: number; offset?: number } = {},
  ): Promise<JobsPage> {
    const limit = Math.max(1, opts.limit ?? 20);
    const offset = Math.max(0, opts.offset ?? 0);
    // Fetch one extra to detect hasMore without a separate count query
    const { data, error } = await this.client
      .from('jobs')
      .select('*')
      .eq('date', dateIso)
      .order('reported_time', { ascending: true })
      .range(offset, offset + limit);
    if (error) throw error;
    const rows = (data ?? []) as JobRow[];
    const hasMore = rows.length > limit;
    const slice = hasMore ? rows.slice(0, limit) : rows;
    return { jobs: slice.map(rowToJob), hasMore };
  }

  async getJob(id: string): Promise<Job | null> {
    // `id` on the server is bigint. When we fetched it via rowToJob we
    // stringified it; on lookup, coerce back so the equality check works.
    const numericId = Number(id);
    if (!Number.isFinite(numericId)) return null;
    const { data, error } = await this.client
      .from('jobs')
      .select('*')
      .eq('id', numericId)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return rowToJob(data as JobRow);
  }

  async getActivity(weeks: number): Promise<ActivityDay[]> {
    const end = this.clock();
    const start = addDaysLocal(end, -(weeks * 7 - 1));
    const { data, error } = await this.client.rpc('activity_per_day', {
      start_date: localDateIso(start),
      end_date: localDateIso(end),
    });
    if (error) throw error;
    const rows = (data ?? []) as ActivityRow[];

    // RPC only returns days with jobs. Fill in zeros for every day in range so
    // the contribution grid has a complete cell for each column.
    const byDate = new Map(rows.map((r) => [r.day, r.count]));
    const out: ActivityDay[] = [];
    for (let i = 0; i < weeks * 7; i++) {
      const date = localDateIso(addDaysLocal(start, i));
      out.push({ date, count: byDate.get(date) ?? 0 });
    }
    return out;
  }
}
