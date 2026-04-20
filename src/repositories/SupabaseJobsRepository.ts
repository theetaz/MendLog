import type { SupabaseClient } from '@supabase/supabase-js';
import type { ActivityDay, Job } from '../types/job';
import type { JobsRepository } from './JobsRepository';
import { rowToJob, type JobRow } from './rowToJob';

interface ActivityRow {
  day: string;
  count: number;
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
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

  async getJob(id: number): Promise<Job | null> {
    const { data, error } = await this.client
      .from('jobs')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return rowToJob(data as JobRow);
  }

  async getActivity(weeks: number): Promise<ActivityDay[]> {
    const end = this.clock();
    const start = new Date(end);
    start.setUTCDate(end.getUTCDate() - (weeks * 7 - 1));
    const { data, error } = await this.client.rpc('activity_per_day', {
      start_date: isoDate(start),
      end_date: isoDate(end),
    });
    if (error) throw error;
    const rows = (data ?? []) as ActivityRow[];

    // RPC only returns days with jobs. Fill in zeros for every day in range so
    // the contribution grid has a complete cell for each column.
    const byDate = new Map(rows.map((r) => [r.day, r.count]));
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
