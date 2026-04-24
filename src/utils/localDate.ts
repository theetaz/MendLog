// Jobs are stamped with a `date` column in the user's **local** calendar
// timezone (see `toDateOnly` in jobsApi.ts). Any code that compares against
// that column or walks day-by-day for activity/streaks must stay in the same
// timezone or it falls off by a day around midnight UTC. Use these helpers
// everywhere that crosses the line.

export function localDateIso(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')}`;
}

export function addDaysLocal(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}
