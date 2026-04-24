import { useCallback, useEffect, useState } from 'react';
import { subscribeLocalDataChanges } from '../../offline/dataBus';
import { errorMessage } from '../../offline/errors';
import type { ActivityDay, Job } from '../../types/job';
import type { JobsRepository } from '../../repositories/JobsRepository';
import { addDaysLocal, localDateIso } from '../../utils/localDate';
import { formatIdle } from '../../utils/idle';

export interface HomeData {
  today: Job[];
  activity: ActivityDay[];
  thisWeekCount: number;
  avgIdle: string;
  streak: number;
  loading: boolean;
  error: Error | null;
  reload(): void;
}

const EMPTY: Omit<HomeData, 'loading' | 'error' | 'reload'> = {
  today: [],
  activity: [],
  thisWeekCount: 0,
  avgIdle: '0h 0m',
  streak: 0,
};

function computeStreak(jobs: Job[], todayIso: string): number {
  const dates = new Set(jobs.map((j) => j.date));
  let streak = 0;
  // Parse todayIso as a local calendar date so day arithmetic stays in
  // the user's timezone — walking back with setUTCDate would fall a day
  // behind for anyone east of UTC around midnight.
  const [y, m, d] = todayIso.split('-').map(Number);
  let cursor = new Date(y, m - 1, d);
  while (dates.has(localDateIso(cursor))) {
    streak++;
    cursor = addDaysLocal(cursor, -1);
  }
  return streak;
}

export function useHomeData(
  repo: JobsRepository,
  clock: () => Date = () => new Date(),
): HomeData {
  const [tick, setTick] = useState(0);
  const [state, setState] = useState<Omit<HomeData, 'reload'>>({
    ...EMPTY,
    loading: true,
    error: null,
  });

  const reload = useCallback(() => setTick((t) => t + 1), []);

  // Any local mutation (saveJob, deletePhoto, sync pull, etc.) bumps the bus
  // so the list refetches immediately — modal dismiss on iOS doesn't always
  // re-fire useFocusEffect, which made new offline jobs look invisible.
  useEffect(() => subscribeLocalDataChanges(reload), [reload]);

  useEffect(() => {
    let cancelled = false;
    const todayIso = localDateIso(clock());
    const weekAgoIso = localDateIso(addDaysLocal(clock(), -6));

    (async () => {
      try {
        // 16 weeks ≈ 3.7 months — covers the current calendar month + last two
        // plus spillover cells on either end of the month grids.
        const [jobs, activity] = await Promise.all([repo.listJobs(), repo.getActivity(16)]);
        if (cancelled) return;

        const today = jobs.filter((j) => j.date === todayIso);
        const thisWeekJobs = jobs.filter((j) => j.date >= weekAgoIso && j.date <= todayIso);
        const totalIdle = thisWeekJobs.reduce((sum, j) => sum + j.idleMinutes, 0);
        const avgIdleMinutes = thisWeekJobs.length === 0
          ? 0
          : Math.floor(totalIdle / thisWeekJobs.length);

        setState({
          today,
          activity,
          thisWeekCount: thisWeekJobs.length,
          avgIdle: formatIdle(avgIdleMinutes),
          streak: computeStreak(jobs, todayIso),
          loading: false,
          error: null,
        });
      } catch (err) {
        if (cancelled) return;
        setState((prev) => ({
          ...prev,
          loading: false,
          error: err instanceof Error ? err : new Error(errorMessage(err)),
        }));
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repo, tick]);

  return { ...state, reload };
}
