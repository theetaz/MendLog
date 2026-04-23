import type { ActivityDay, Job } from '../types/job';

export interface JobsPage {
  jobs: Job[];
  hasMore: boolean;
}

export interface JobsRepository {
  listJobs(): Promise<Job[]>;
  listJobsForDate(dateIso: string, opts?: { limit?: number; offset?: number }): Promise<JobsPage>;
  getJob(id: string): Promise<Job | null>;
  getActivity(weeks: number): Promise<ActivityDay[]>;
}
