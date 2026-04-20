import type { ActivityDay, Job } from '../types/job';
import { genActivity } from '../utils/activity';
import type { JobsRepository } from './JobsRepository';

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

  async getJob(id: number): Promise<Job | null> {
    return this.jobs.find((job) => job.id === id) ?? null;
  }

  async getActivity(weeks: number): Promise<ActivityDay[]> {
    return genActivity(weeks, this.reference);
  }
}
