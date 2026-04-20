export function formatIdle(minutes: number): string {
  const safe = Math.max(0, Math.floor(minutes));
  const hours = Math.floor(safe / 60);
  const mins = safe % 60;
  return `${hours}h ${mins}m`;
}

const IDLE_PATTERN = /^\s*(\d+)\s*h\s*(\d+)\s*m\s*$/;

export function parseIdle(input: string): number {
  const match = IDLE_PATTERN.exec(input);
  if (!match) return 0;
  const [, hours, minutes] = match;
  return parseInt(hours, 10) * 60 + parseInt(minutes, 10);
}
