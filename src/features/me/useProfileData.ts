import { useCallback, useEffect, useState } from 'react';
import { subscribeLocalDataChanges } from '../../offline/dataBus';
import { errorMessage } from '../../offline/errors';
import type { JobsRepository } from '../../repositories/JobsRepository';
import type { ActivityDay, Job } from '../../types/job';
import { localDateIso } from '../../utils/localDate';
import {
  computeProfileStats,
  computeProfileStreaks,
  type ProfileStats,
  type ProfileStreaks,
} from './profileStats';

export interface ProfileData {
  loading: boolean;
  error: Error | null;
  jobs: Job[];
  activity: ActivityDay[];
  stats: ProfileStats;
  streaks: ProfileStreaks;
  reload(): void;
}

const EMPTY_STATS: ProfileStats = {
  totalJobs: 0,
  avgIdleMinutes: 0,
  topMachine: null,
  topDept: null,
};

const EMPTY_STREAKS: ProfileStreaks = { currentStreak: 0, longestStreak: 0 };

function todayIso(clock: () => Date): string {
  return localDateIso(clock());
}

export function useProfileData(
  repo: JobsRepository | null,
  clock: () => Date = () => new Date(),
): ProfileData {
  const [tick, setTick] = useState(0);
  const [state, setState] = useState<Omit<ProfileData, 'reload'>>({
    loading: !!repo,
    error: null,
    jobs: [],
    activity: [],
    stats: EMPTY_STATS,
    streaks: EMPTY_STREAKS,
  });

  const reload = useCallback(() => setTick((t) => t + 1), []);

  // Refetch whenever any local mutation or a sync pull lands.
  useEffect(() => subscribeLocalDataChanges(reload), [reload]);

  useEffect(() => {
    if (!repo) {
      setState((prev) => ({ ...prev, loading: false }));
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const [jobs, activity] = await Promise.all([
          repo.listJobs(),
          repo.getActivity(52),
        ]);
        if (cancelled) return;
        const stats = computeProfileStats(jobs);
        const streaks = computeProfileStreaks(activity, todayIso(clock));
        setState({ loading: false, error: null, jobs, activity, stats, streaks });
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
