import type { ActivityDay, Job } from '../types/job';
import { genActivity } from '../utils/activity';
import type { JobsPage, JobsRepository } from './JobsRepository';

function compareJobs(a: Job, b: Job): number {
  if (a.date !== b.date) return a.date < b.date ? 1 : -1;
  if (a.time !== b.time) return a.time < b.time ? 1 : -1;
  return 0;
}

export class InMemoryJobsRepository implements JobsRepository {
  private readonly jobs: Job[];

  constructor(jobs: Job[], private readonly reference: Date = new Date()) {
    this.jobs = [...jobs].sort(compareJobs);
  }

  async listJobs(): Promise<Job[]> {
    return [...this.jobs];
  }

  async listJobsForDate(
    dateIso: string,
    opts: { limit?: number; offset?: number } = {},
  ): Promise<JobsPage> {
    const limit = Math.max(1, opts.limit ?? 20);
    const offset = Math.max(0, opts.offset ?? 0);
    const filtered = this.jobs.filter((job) => job.date === dateIso);
    const slice = filtered.slice(offset, offset + limit);
    return { jobs: slice, hasMore: offset + limit < filtered.length };
  }

  async getJob(id: number): Promise<Job | null> {
    return this.jobs.find((job) => job.id === id) ?? null;
  }

  async getActivity(weeks: number): Promise<ActivityDay[]> {
    return genActivity(weeks, this.reference);
  }
}
