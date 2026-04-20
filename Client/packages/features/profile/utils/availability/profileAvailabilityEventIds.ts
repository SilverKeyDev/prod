const WEEKLY_PREFIX = "avail-weekly-";
const ONCE_PREFIX = "avail-once-";
export const AVAILABILITY_EVENT_SEP = "@@";

export function buildAvailabilityWeeklyInstanceId(ruleId: string, ymd: string): string {
  return `${WEEKLY_PREFIX}${ruleId}${AVAILABILITY_EVENT_SEP}${ymd}`;
}

export function buildAvailabilityOneOffEventId(oneOffId: string): string {
  return `${ONCE_PREFIX}${oneOffId}`;
}

export type ParsedAvailabilityEventId =
  | { kind: "weekly"; ruleId: string; ymd: string }
  | { kind: "oneOff"; oneOffId: string };

export function parseAvailabilitySyntheticEventId(
  id: string | null | undefined
): ParsedAvailabilityEventId | null {
  if (!id) return null;
  if (id.startsWith(ONCE_PREFIX)) {
    const oneOffId = id.slice(ONCE_PREFIX.length);
    return oneOffId ? { kind: "oneOff", oneOffId } : null;
  }
  if (!id.startsWith(WEEKLY_PREFIX)) return null;
  const rest = id.slice(WEEKLY_PREFIX.length);
  const sep = rest.lastIndexOf(AVAILABILITY_EVENT_SEP);
  if (sep === -1) return null;
  const ruleId = rest.slice(0, sep);
  const ymd = rest.slice(sep + AVAILABILITY_EVENT_SEP.length);
  if (!ruleId || !/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return null;
  return { kind: "weekly", ruleId, ymd };
}
