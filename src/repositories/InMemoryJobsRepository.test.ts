import { InMemoryJobsRepository } from './InMemoryJobsRepository';
import { SEED_JOBS, SEED_REFERENCE_DATE } from '../data/seedJobs';

describe('InMemoryJobsRepository', () => {
  const repo = new InMemoryJobsRepository(SEED_JOBS, SEED_REFERENCE_DATE);

  describe('listJobs', () => {
    it('returns jobs ordered newest date/time first', async () => {
      const jobs = await repo.listJobs();
      expect(jobs).toHaveLength(SEED_JOBS.length);
      for (let i = 1; i < jobs.length; i++) {
        const prev = `${jobs[i - 1].date}T${jobs[i - 1].time}`;
        const curr = `${jobs[i].date}T${jobs[i].time}`;
        expect(prev >= curr).toBe(true);
      }
    });

    it('never mutates the backing array', async () => {
      const first = await repo.listJobs();
      first.pop();
      const second = await repo.listJobs();
      expect(second).toHaveLength(SEED_JOBS.length);
    });
  });

  describe('getJob', () => {
    it('returns the matching job', async () => {
      const job = await repo.getJob(127);
      expect(job?.machine).toBe('Injection Molder #3');
    });

    it('returns null when the id is unknown', async () => {
      const job = await repo.getJob(9999);
      expect(job).toBeNull();
    });
  });

  describe('getActivity', () => {
    it('returns weeks * 7 entries', async () => {
      const activity = await repo.getActivity(12);
      expect(activity).toHaveLength(84);
    });

    it('last entry date matches the reference', async () => {
      const activity = await repo.getActivity(4);
      expect(activity[activity.length - 1].date).toBe('2026-03-15');
    });
  });
});
