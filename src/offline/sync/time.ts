// Local DB stores timestamps as ms integers (cheap to compare). Supabase
// returns them as ISO strings. These are the only two functions that know
// about the conversion — everywhere else uses `number`.

export function toMs(iso: string): number {
  const n = Date.parse(iso);
  return Number.isNaN(n) ? Date.now() : n;
}

export function toIso(ms: number): string {
  return new Date(ms).toISOString();
}

export const now = (): number => Date.now();
