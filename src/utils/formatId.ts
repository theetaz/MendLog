// Job IDs are either a stringified bigserial ("127") from the server or a
// 36-char UUID for rows still living only on the device. Rendering the full
// UUID blows out narrow layouts on small Androids (see JobDetail, DayView),
// so anywhere we surface the id to the user we clip UUIDs to the first hex
// segment — plenty to disambiguate at a glance.

const UUID_HINT = /^[0-9a-f]{8}-/i;

export function formatJobId(id: string | null | undefined): string {
  if (!id) return '';
  if (UUID_HINT.test(id)) return id.slice(0, 8);
  // Non-UUID IDs (server bigserials, legacy numeric, short test fixtures)
  // stay as-is.
  return id;
}
