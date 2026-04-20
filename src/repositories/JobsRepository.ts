import type { ActivityDay, Job } from '../types/job';

export interface JobsRepository {
  listJobs(): Promise<Job[]>;
  getJob(id: number): Promise<Job | null>;
  getActivity(weeks: number): Promise<ActivityDay[]>;
}
