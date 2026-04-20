import type { ActivityDay } from '../types/job';

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function pseudoRandomCount(date: Date): number {
  const seed = date.getUTCFullYear() * 1000 + date.getUTCMonth() * 40 + date.getUTCDate();
  const r = (Math.sin(seed) * 10000) % 1;
  const n = Math.abs(r);
  let count: number;
  if (n < 0.32) count = 0;
  else if (n < 0.58) count = 1;
  else if (n < 0.78) count = 2;
  else if (n < 0.92) count = 4;
  else count = 7;
  const dow = date.getUTCDay();
  if (dow === 0 || dow === 6) count = Math.max(0, count - 2);
  return count;
}

export function genActivity(weeks: number, reference: Date = new Date()): ActivityDay[] {
  const ref = new Date(Date.UTC(
    reference.getUTCFullYear(),
    reference.getUTCMonth(),
    reference.getUTCDate(),
  ));
  const out: ActivityDay[] = [];
  for (let w = weeks - 1; w >= 0; w--) {
    for (let d = 0; d < 7; d++) {
      const day = new Date(ref);
      day.setUTCDate(ref.getUTCDate() - (w * 7 + (6 - d)));
      out.push({ date: isoDate(day), count: pseudoRandomCount(day) });
    }
  }
  return out;
}
