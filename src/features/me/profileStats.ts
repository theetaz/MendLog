import type { ActivityDay, Job } from '../../types/job';

export interface ProfileStats {
  totalJobs: number;
  avgIdleMinutes: number;
  topMachine: { name: string; count: number } | null;
  topDept: { name: string; count: number } | null;
}

export interface ProfileStreaks {
  currentStreak: number;
  longestStreak: number;
}

function mostCommon(counts: Map<string, number>): { name: string; count: number } | null {
  let best: { name: string; count: number } | null = null;
  for (const [name, count] of counts) {
    if (!best || count > best.count) best = { name, count };
  }
  return best;
}

export function computeProfileStats(jobs: Job[]): ProfileStats {
  const total = jobs.length;
  const totalIdle = jobs.reduce((s, j) => s + (j.idleMinutes ?? 0), 0);
  const avgIdleMinutes = total > 0 ? Math.round(totalIdle / total) : 0;

  const machineCounts = new Map<string, number>();
  const deptCounts = new Map<string, number>();
  for (const job of jobs) {
    if (job.machine) machineCounts.set(job.machine, (machineCounts.get(job.machine) ?? 0) + 1);
    if (job.dept) deptCounts.set(job.dept, (deptCounts.get(job.dept) ?? 0) + 1);
  }

  return {
    totalJobs: total,
    avgIdleMinutes,
    topMachine: mostCommon(machineCounts),
    topDept: mostCommon(deptCounts),
  };
}

/**
 * currentStreak: days leading up to today with activity (count > 0), inclusive.
 * longestStreak: longest run of consecutive active days within the window.
 */
export function computeProfileStreaks(
  activity: ActivityDay[],
  todayIso: string,
): ProfileStreaks {
  // Sort ascending just in case.
  const ordered = activity.slice().sort((a, b) => a.date.localeCompare(b.date));
  const activeByDate = new Map<string, boolean>();
  for (const day of ordered) activeByDate.set(day.date, day.count > 0);

  let longestStreak = 0;
  let running = 0;
  for (const day of ordered) {
    if (day.count > 0) {
      running++;
      if (running > longestStreak) longestStreak = running;
    } else {
      running = 0;
    }
  }

  // Walk back from today
  let currentStreak = 0;
  const cursor = new Date(`${todayIso}T00:00:00Z`);
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const iso = `${cursor.getUTCFullYear()}-${String(cursor.getUTCMonth() + 1).padStart(
      2,
      '0',
    )}-${String(cursor.getUTCDate()).padStart(2, '0')}`;
    if (activeByDate.get(iso)) {
      currentStreak++;
      cursor.setUTCDate(cursor.getUTCDate() - 1);
    } else {
      break;
    }
  }

  return { currentStreak, longestStreak };
}
