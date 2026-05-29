import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

import type { BuyerAvailabilityPrefs } from "packages/features/profile/types/sections/buyerPreferenceExtensions";
import type { ExtendedGoogleEvent } from "packages/types/calendar/extendedGoogleEvent";
import { parseHourMinute24 } from "packages/utils/calendar/createEvent/eventFormGooglePayload";

import {
  buildAvailabilityOneOffEventId,
  buildAvailabilityWeeklyInstanceId,
} from "./profileAvailabilityEventIds";

dayjs.extend(utc);
dayjs.extend(timezone);

function resolvedAvailabilityZone(prefs: BuyerAvailabilityPrefs | undefined): string {
  const z = prefs?.timezone?.trim();
  if (z) return z;
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return "UTC";
  }
}

function exceptionKey(ruleId: string, ymd: string): string {
  return `${ruleId}|${ymd}`;
}

/**
 * Expands stored availability preferences into synthetic calendar events for the time grid.
 * Uses IANA timezone from prefs (or device default).
 */
function zonedLocalIso(ymd: string, hour: number, minute: number, effectiveZone: string): string {
  return dayjs
    .tz(
      `${ymd} ${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
      "YYYY-MM-DD HH:mm",
      effectiveZone
    )
    .toISOString();
}

export function expandProfileAvailabilityToEvents(
  prefs: BuyerAvailabilityPrefs | undefined,
  timeMinIso: string,
  timeMaxIso: string,
  summaryLabel = "Available"
): ExtendedGoogleEvent[] {
  if (!prefs) return [];
  if (!(prefs.weekly?.length || prefs.oneOff?.length)) return [];

  const zone = resolvedAvailabilityZone(prefs);
  let zoneOk = true;
  try {
    dayjs.tz("2020-01-01", zone);
  } catch {
    zoneOk = false;
  }
  const effectiveZone = zoneOk ? zone : "UTC";

  const exceptionSet = new Set<string>();
  for (const ex of prefs.exceptions ?? []) {
    if (ex.scope === "weekly" && ex.ruleId && ex.date) {
      exceptionSet.add(exceptionKey(ex.ruleId, ex.date));
    }
  }

  const rangeStart = dayjs(timeMinIso).tz(effectiveZone).format("YYYY-MM-DD");
  const rangeEnd = dayjs(timeMaxIso).tz(effectiveZone).format("YYYY-MM-DD");

  let cursor = dayjs.tz(rangeStart, "YYYY-MM-DD", effectiveZone).startOf("day");
  const endDay = dayjs.tz(rangeEnd, "YYYY-MM-DD", effectiveZone).startOf("day");

  const out: ExtendedGoogleEvent[] = [];

  while (!cursor.isAfter(endDay)) {
    const ymd = cursor.format("YYYY-MM-DD");
    const weekday = cursor.day();

    for (const rule of prefs.weekly ?? []) {
      if (rule.weekday !== weekday) continue;
      if (exceptionSet.has(exceptionKey(rule.id, ymd))) continue;
      const sh = parseHourMinute24(rule.start);
      const eh = parseHourMinute24(rule.end);
      if (!sh || !eh || sh.hour * 60 + sh.minute >= eh.hour * 60 + eh.minute) {
        continue;
      }
      const start = zonedLocalIso(ymd, sh.hour, sh.minute, effectiveZone);
      const end = zonedLocalIso(ymd, eh.hour, eh.minute, effectiveZone);
      out.push({
        id: buildAvailabilityWeeklyInstanceId(rule.id, ymd),
        summary: summaryLabel,
        start: { dateTime: start, timeZone: effectiveZone },
        end: { dateTime: end, timeZone: effectiveZone },
        isProfileAvailabilityEvent: true,
        availabilityMeta: {
          kind: "weekly",
          ruleId: rule.id,
          date: ymd,
        },
      });
    }

    cursor = cursor.add(1, "day");
  }

  for (const slot of prefs.oneOff ?? []) {
    if (!slot.date || slot.date < rangeStart || slot.date > rangeEnd) continue;
    const sh = parseHourMinute24(slot.start);
    const eh = parseHourMinute24(slot.end);
    if (!sh || !eh || sh.hour * 60 + sh.minute >= eh.hour * 60 + eh.minute) {
      continue;
    }
    const ymd = slot.date;
    const start = zonedLocalIso(ymd, sh.hour, sh.minute, effectiveZone);
    const end = zonedLocalIso(ymd, eh.hour, eh.minute, effectiveZone);
    out.push({
      id: buildAvailabilityOneOffEventId(slot.id),
      summary: summaryLabel,
      start: { dateTime: start, timeZone: effectiveZone },
      end: { dateTime: end, timeZone: effectiveZone },
      isProfileAvailabilityEvent: true,
      availabilityMeta: { kind: "oneOff", oneOffId: slot.id },
    });
  }

  return out;
}
