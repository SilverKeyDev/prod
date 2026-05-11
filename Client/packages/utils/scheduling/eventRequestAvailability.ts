import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

import type { FreebusyTimeBlock } from "packages/schemas/scheduling";
import { parseHourMinute24 } from "packages/utils/calendar/eventFormGooglePayload";
import { dateParseISO } from "packages/utils/date";

dayjs.extend(utc);
dayjs.extend(timezone);

/** Optional weekly/one-off profile windows (agents: `extended_buyer_preferences.availability`; buyers do not persist this). */
export type BuyerAvailabilityWeeklySlot = {
  id: string;
  weekday: number;
  start: string;
  end: string;
};

export type BuyerAvailabilityOneOff = {
  id: string;
  date: string;
  start: string;
  end: string;
};

export type BuyerAvailabilityException = {
  id: string;
  scope: "weekly";
  ruleId: string;
  date: string;
};

export type BuyerAvailabilityPrefs = {
  timezone?: string;
  weekly?: BuyerAvailabilityWeeklySlot[];
  oneOff?: BuyerAvailabilityOneOff[];
  exceptions?: BuyerAvailabilityException[];
};

export type EventRequestSlotCheckParams = {
  eventDateYmd: string;
  eventTimeHm: string;
  stepMinutes: number;
  prefs: BuyerAvailabilityPrefs | undefined;
  busyBlocks: FreebusyTimeBlock[];
};

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

function buildExceptionSet(exceptions: BuyerAvailabilityException[] | undefined): Set<string> {
  const exceptionSet = new Set<string>();
  for (const ex of exceptions ?? []) {
    if (ex.scope === "weekly" && ex.ruleId && ex.date) {
      exceptionSet.add(exceptionKey(ex.ruleId, ex.date));
    }
  }
  return exceptionSet;
}

/** True when weekly/one-off rules exist (timezone-only does not restrict). */
export function hasConfiguredBuyerAvailabilitySlots(
  prefs: BuyerAvailabilityPrefs | undefined
): boolean {
  return Boolean(prefs?.weekly?.length || prefs?.oneOff?.length);
}

type IntervalMs = readonly [number, number];

function weeklyIntervalsForYmd(
  ymd: string,
  weekday: number,
  weekly: BuyerAvailabilityWeeklySlot[] | undefined,
  exceptionSet: Set<string>,
  effectiveZone: string
): IntervalMs[] {
  const out: IntervalMs[] = [];
  for (const rule of weekly ?? []) {
    if (rule.weekday !== weekday) continue;
    if (exceptionSet.has(exceptionKey(rule.id, ymd))) continue;
    const sh = parseHourMinute24(rule.start);
    const eh = parseHourMinute24(rule.end);
    if (!sh || !eh || sh.hour * 60 + sh.minute >= eh.hour * 60 + eh.minute) {
      continue;
    }
    const startMs = dayjs
      .tz(
        `${ymd} ${String(sh.hour).padStart(2, "0")}:${String(sh.minute).padStart(2, "0")}`,
        "YYYY-MM-DD HH:mm",
        effectiveZone
      )
      .valueOf();
    const endMs = dayjs
      .tz(
        `${ymd} ${String(eh.hour).padStart(2, "0")}:${String(eh.minute).padStart(2, "0")}`,
        "YYYY-MM-DD HH:mm",
        effectiveZone
      )
      .valueOf();
    out.push([startMs, endMs]);
  }
  return out;
}

function oneOffIntervalsForYmd(
  ymd: string,
  oneOff: BuyerAvailabilityOneOff[] | undefined,
  effectiveZone: string
): IntervalMs[] {
  const out: IntervalMs[] = [];
  for (const slot of oneOff ?? []) {
    if (slot.date !== ymd) continue;
    const sh = parseHourMinute24(slot.start);
    const eh = parseHourMinute24(slot.end);
    if (!sh || !eh || sh.hour * 60 + sh.minute >= eh.hour * 60 + eh.minute) {
      continue;
    }
    const startMs = dayjs
      .tz(
        `${ymd} ${String(sh.hour).padStart(2, "0")}:${String(sh.minute).padStart(2, "0")}`,
        "YYYY-MM-DD HH:mm",
        effectiveZone
      )
      .valueOf();
    const endMs = dayjs
      .tz(
        `${ymd} ${String(eh.hour).padStart(2, "0")}:${String(eh.minute).padStart(2, "0")}`,
        "YYYY-MM-DD HH:mm",
        effectiveZone
      )
      .valueOf();
    out.push([startMs, endMs]);
  }
  return out;
}

function allowedIntervalsMsForYmd(
  prefs: BuyerAvailabilityPrefs | undefined,
  eventDateYmd: string
): IntervalMs[] {
  if (!hasConfiguredBuyerAvailabilitySlots(prefs)) {
    return [];
  }
  const zone = resolvedAvailabilityZone(prefs);
  let zoneOk = true;
  try {
    dayjs.tz("2020-01-01", zone);
  } catch {
    zoneOk = false;
  }
  const effectiveZone = zoneOk ? zone : "UTC";
  const exceptionSet = buildExceptionSet(prefs?.exceptions);
  const weekday = dayjs.tz(eventDateYmd, "YYYY-MM-DD", effectiveZone).day();
  return [
    ...weeklyIntervalsForYmd(eventDateYmd, weekday, prefs?.weekly, exceptionSet, effectiveZone),
    ...oneOffIntervalsForYmd(eventDateYmd, prefs?.oneOff, effectiveZone),
  ];
}

function slotOverlapsBusy(
  slotStartMs: number,
  slotEndMs: number,
  busyBlocks: FreebusyTimeBlock[]
): boolean {
  for (const busy of busyBlocks) {
    if (busy.start == null || busy.end == null) continue;
    const busyStart = dateParseISO(busy.start).valueOf();
    const busyEnd = dateParseISO(busy.end).valueOf();
    if (slotStartMs < busyEnd && slotEndMs > busyStart) {
      return true;
    }
  }
  return false;
}

function slotInsideAllowedProfileWindow(
  slotStartMs: number,
  slotEndMs: number,
  allowed: IntervalMs[]
): boolean {
  for (const [a, b] of allowed) {
    if (slotStartMs >= a && slotEndMs <= b) {
      return true;
    }
  }
  return false;
}

/**
 * A slot is available when it does not overlap Google Calendar busy blocks and,
 * if the user configured profile availability, falls inside at least one allowed window.
 * When profile availability is not configured, only busy blocks restrict the slot.
 */
export function isEventRequestSlotAvailable(p: EventRequestSlotCheckParams): boolean {
  const zone = resolvedAvailabilityZone(p.prefs);
  let zoneOk = true;
  try {
    dayjs.tz("2020-01-01", zone);
  } catch {
    zoneOk = false;
  }
  const effectiveZone = zoneOk ? zone : "UTC";
  const slotStart = dayjs.tz(
    `${p.eventDateYmd} ${p.eventTimeHm}`,
    "YYYY-MM-DD HH:mm",
    effectiveZone
  );
  if (!slotStart.isValid()) {
    return false;
  }
  const slotEnd = slotStart.add(p.stepMinutes, "minute");
  const slotStartMs = slotStart.valueOf();
  const slotEndMs = slotEnd.valueOf();

  if (slotOverlapsBusy(slotStartMs, slotEndMs, p.busyBlocks)) {
    return false;
  }

  if (!hasConfiguredBuyerAvailabilitySlots(p.prefs)) {
    return true;
  }

  const allowed = allowedIntervalsMsForYmd(p.prefs, p.eventDateYmd);
  if (allowed.length === 0) {
    return false;
  }
  return slotInsideAllowedProfileWindow(slotStartMs, slotEndMs, allowed);
}

export function hasAnyAvailableSlotOnDate(p: {
  eventDateYmd: string;
  stepMinutes: number;
  prefs: BuyerAvailabilityPrefs | undefined;
  busyBlocks: FreebusyTimeBlock[];
}): boolean {
  for (let total = 0; total < 24 * 60; total += p.stepMinutes) {
    const hour24 = Math.floor(total / 60);
    const minute = total % 60;
    const hm = `${String(hour24).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
    if (
      isEventRequestSlotAvailable({
        eventDateYmd: p.eventDateYmd,
        eventTimeHm: hm,
        stepMinutes: p.stepMinutes,
        prefs: p.prefs,
        busyBlocks: p.busyBlocks,
      })
    ) {
      return true;
    }
  }
  return false;
}

export type AvailabilityParty = {
  prefs: BuyerAvailabilityPrefs | undefined;
  busyBlocks: FreebusyTimeBlock[];
};

/**
 * Absolute UTC interval vs one person's profile availability + Google busy blocks.
 * When no weekly/one-off slots are configured, only busy blocks restrict the range.
 */
export function isUtcRangeAvailableForPerson(
  slotStartMs: number,
  slotEndMs: number,
  prefs: BuyerAvailabilityPrefs | undefined,
  busyBlocks: FreebusyTimeBlock[]
): boolean {
  if (slotOverlapsBusy(slotStartMs, slotEndMs, busyBlocks)) {
    return false;
  }
  if (!hasConfiguredBuyerAvailabilitySlots(prefs)) {
    return true;
  }
  const zone = resolvedAvailabilityZone(prefs);
  let zoneOk = true;
  try {
    dayjs.tz("2020-01-01", zone);
  } catch {
    zoneOk = false;
  }
  const effectiveZone = zoneOk ? zone : "UTC";
  const ymd = dayjs(slotStartMs).tz(effectiveZone).format("YYYY-MM-DD");
  const allowed = allowedIntervalsMsForYmd(prefs, ymd);
  if (allowed.length === 0) {
    return false;
  }
  return slotInsideAllowedProfileWindow(slotStartMs, slotEndMs, allowed);
}

/** Both parties must be free (profile rules + calendars). */
export function isMutualUtcRangeAvailable(
  slotStartMs: number,
  slotEndMs: number,
  a: AvailabilityParty,
  b: AvailabilityParty
): boolean {
  return (
    isUtcRangeAvailableForPerson(slotStartMs, slotEndMs, a.prefs, a.busyBlocks) &&
    isUtcRangeAvailableForPerson(slotStartMs, slotEndMs, b.prefs, b.busyBlocks)
  );
}

/**
 * Whether any step-sized slot on this calendar day (in the viewer's timezone) works for both parties.
 */
export function mutualDayHasAvailableSlot(p: {
  ymd: string;
  stepMinutes: number;
  viewerTimeZone: string;
  a: AvailabilityParty;
  b: AvailabilityParty;
}): boolean {
  for (let total = 0; total < 24 * 60; total += p.stepMinutes) {
    const hour24 = Math.floor(total / 60);
    const minute = total % 60;
    const hm = `${String(hour24).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
    const slotStart = dayjs.tz(`${p.ymd} ${hm}`, "YYYY-MM-DD HH:mm", p.viewerTimeZone);
    if (!slotStart.isValid()) {
      continue;
    }
    const slotEnd = slotStart.add(p.stepMinutes, "minute");
    const s = slotStart.valueOf();
    const e = slotEnd.valueOf();
    if (isMutualUtcRangeAvailable(s, e, p.a, p.b)) {
      return true;
    }
  }
  return false;
}
