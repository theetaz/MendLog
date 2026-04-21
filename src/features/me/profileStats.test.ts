import type { ActivityDay, Job } from '../../types/job';
import { computeProfileStats, computeProfileStreaks } from './profileStats';

function job(
  id: number,
  dept: string,
  machine: string,
  idleMinutes = 30,
): Job {
  return {
    id,
    machine,
    dept,
    inv: `INV-${id}`,
    date: '2026-04-21',
    time: '09:00',
    completedAt: null,
    idleMinutes,
    status: 'complete',
    lang: 'en',
    photos: 0,
    clips: 0,
    rootCause: '',
    desc: '',
    action: '',
    remarks: '',
  };
}

describe('computeProfileStats', () => {
  it('returns zeroes for an empty list', () => {
    const stats = computeProfileStats([]);
    expect(stats.totalJobs).toBe(0);
    expect(stats.avgIdleMinutes).toBe(0);
    expect(stats.topMachine).toBeNull();
    expect(stats.topDept).toBeNull();
  });

  it('computes totals, averages, and picks the most common machine / dept', () => {
    const jobs: Job[] = [
      job(1, 'Milling', 'Makino F5 CNC 01', 60),
      job(2, 'Milling', 'Makino F5 CNC 01', 30),
      job(3, 'Milling', 'Mikron Vce 1000 CNC 01', 90),
      job(4, 'Grinding', 'Aba CNC 01', 15),
    ];
    const stats = computeProfileStats(jobs);
    expect(stats.totalJobs).toBe(4);
    expect(stats.avgIdleMinutes).toBe(49); // (60+30+90+15)/4 = 48.75 → 49
    expect(stats.topMachine).toEqual({ name: 'Makino F5 CNC 01', count: 2 });
    expect(stats.topDept).toEqual({ name: 'Milling', count: 3 });
  });
});

describe('computeProfileStreaks', () => {
  function day(date: string, count: number): ActivityDay {
    return { date, count };
  }

  it('returns zeroes for an empty window', () => {
    const s = computeProfileStreaks([], '2026-04-21');
    expect(s.currentStreak).toBe(0);
    expect(s.longestStreak).toBe(0);
  });

  it('walks back from today for the current streak', () => {
    const activity: ActivityDay[] = [
      day('2026-04-18', 0),
      day('2026-04-19', 1),
      day('2026-04-20', 2),
      day('2026-04-21', 1),
    ];
    const s = computeProfileStreaks(activity, '2026-04-21');
    expect(s.currentStreak).toBe(3);
    expect(s.longestStreak).toBe(3);
  });

  it('stops the current streak at the first zero-day going back', () => {
    const activity: ActivityDay[] = [
      day('2026-04-18', 5), // longer run earlier
      day('2026-04-19', 2),
      day('2026-04-20', 0),
      day('2026-04-21', 1), // current = 1
    ];
    const s = computeProfileStreaks(activity, '2026-04-21');
    expect(s.currentStreak).toBe(1);
    expect(s.longestStreak).toBe(2);
  });
});
