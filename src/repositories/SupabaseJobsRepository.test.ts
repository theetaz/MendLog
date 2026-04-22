import type { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseJobsRepository } from './SupabaseJobsRepository';
import type { JobRow } from './rowToJob';

function fakeSupabase(rows: JobRow[], activity: { day: string; count: number }[] = []): SupabaseClient {
  const fromMock = jest.fn().mockImplementation(() => ({
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockResolvedValue({ data: rows, error: null }),
    maybeSingle: jest.fn().mockResolvedValue({ data: rows[0] ?? null, error: null }),
  }));
  const rpcMock = jest.fn().mockResolvedValue({ data: activity, error: null });

  return { from: fromMock, rpc: rpcMock } as unknown as SupabaseClient;
}

const ROW: JobRow = {
  id: 127,
  user_id: 'u',
  machine: 'Injection Molder #3',
  dept: 'Moulding',
  inv: 'INV-0331',
  date: '2026-03-15',
  reported_time: '09:14:00',
  completed_at: null,
  idle_minutes: 260,
  status: 'awaiting-tl',
  lang: 'si',
  photos: 3,
  clips: 2,
  root_cause: 'Seal failure',
  description: 'Loud hiss',
  corrective_action: 'Replaced seal kit',
  remarks: '',
  created_at: '',
  updated_at: '',
};

describe('SupabaseJobsRepository', () => {
  it('listJobs maps rows to Job[]', async () => {
    const client = fakeSupabase([ROW]);
    const repo = new SupabaseJobsRepository(client);
    const jobs = await repo.listJobs();
    expect(jobs).toHaveLength(1);
    expect(jobs[0].machine).toBe('Injection Molder #3');
    expect(jobs[0].time).toBe('09:14');
    expect(client.from).toHaveBeenCalledWith('jobs');
  });

  it('getJob returns null when no row is found', async () => {
    const client = fakeSupabase([]);
    const repo = new SupabaseJobsRepository(client);
    const job = await repo.getJob('999');
    expect(job).toBeNull();
  });

  it('getJob maps a single row when found', async () => {
    const client = fakeSupabase([ROW]);
    const repo = new SupabaseJobsRepository(client);
    const job = await repo.getJob('127');
    expect(job?.machine).toBe('Injection Molder #3');
  });

  it('getActivity calls the activity_per_day RPC and normalizes rows', async () => {
    const activity = [
      { day: '2026-03-13', count: 2 },
      { day: '2026-03-14', count: 1 },
      { day: '2026-03-15', count: 3 },
    ];
    const client = fakeSupabase([], activity);
    const clock = () => new Date('2026-03-15T00:00:00Z');
    const repo = new SupabaseJobsRepository(client, clock);
    const result = await repo.getActivity(4);
    expect(client.rpc).toHaveBeenCalledWith(
      'activity_per_day',
      expect.objectContaining({ start_date: expect.any(String), end_date: expect.any(String) }),
    );
    expect(result.find((d) => d.date === '2026-03-15')?.count).toBe(3);
  });
});
