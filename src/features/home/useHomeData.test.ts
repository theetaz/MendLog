import { renderHook, waitFor } from '@testing-library/react-native';
import { InMemoryJobsRepository } from '../../repositories/InMemoryJobsRepository';
import { SEED_JOBS, SEED_REFERENCE_DATE } from '../../data/seedJobs';
import { useHomeData } from './useHomeData';

const CLOCK = () => SEED_REFERENCE_DATE;

function makeRepo() {
  return new InMemoryJobsRepository(SEED_JOBS, SEED_REFERENCE_DATE);
}

describe('useHomeData', () => {
  it('starts in a loading state', () => {
    const repo = makeRepo();
    const { result } = renderHook(() => useHomeData(repo, CLOCK));
    expect(result.current.loading).toBe(true);
    expect(result.current.today).toEqual([]);
  });

  it('loads today jobs for the clock date', async () => {
    const repo = makeRepo();
    const { result } = renderHook(() => useHomeData(repo, CLOCK));
    await waitFor(() => expect(result.current.loading).toBe(false));
    const ids = result.current.today.map((j) => j.id).sort();
    expect(ids).toEqual([125, 126, 127]);
  });

  it('loads 12 weeks of activity', async () => {
    const repo = makeRepo();
    const { result } = renderHook(() => useHomeData(repo, CLOCK));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.activity).toHaveLength(84);
  });

  it('computes this-week count (jobs in the 7 days up to today)', async () => {
    const repo = makeRepo();
    const { result } = renderHook(() => useHomeData(repo, CLOCK));
    await waitFor(() => expect(result.current.loading).toBe(false));
    // Jobs on/after 2026-03-09: 127, 126, 125 (03-15), 124 (03-14), 123 (03-13), 122 (03-12), 121 (03-10)
    expect(result.current.thisWeekCount).toBe(7);
  });

  it('reports avgIdle formatted as "Xh Ym"', async () => {
    const repo = makeRepo();
    const { result } = renderHook(() => useHomeData(repo, CLOCK));
    await waitFor(() => expect(result.current.loading).toBe(false));
    // seeds: 260, 115, 130, 180, 45, 330, 70 → sum 1130 → avg 161.4 → floored 161 = 2h 41m
    expect(result.current.avgIdle).toBe('2h 41m');
  });

  it('reports streak (consecutive days with jobs including today)', async () => {
    const repo = makeRepo();
    const { result } = renderHook(() => useHomeData(repo, CLOCK));
    await waitFor(() => expect(result.current.loading).toBe(false));
    // Seeds have jobs on 03-15, 03-14, 03-13, 03-12 → streak of 4 (gap on 03-11)
    expect(result.current.streak).toBe(4);
  });

  it('captures errors from the repository', async () => {
    const repo = {
      listJobs: jest.fn().mockRejectedValue(new Error('boom')),
      getJob: jest.fn(),
      getActivity: jest.fn().mockResolvedValue([]),
    };
    const { result } = renderHook(() => useHomeData(repo, CLOCK));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error?.message).toBe('boom');
  });
});
