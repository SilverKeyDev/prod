import type { CalendarQuickCreateState } from "packages/features/calendar/types/calendarQuickCreate";
import type { GoogleEvent } from "packages/features/calendar/types/googleEvent";
import type {
  BuyerAvailabilityPrefs,
  BuyerPreferenceExtensions,
} from "packages/features/profile/types/buyerPreferenceExtensions";
import { dayjs } from "packages/utils/date";
import { getWindow } from "packages/utils/platform";

import { parseAvailabilitySyntheticEventId } from "./profileAvailabilityEventIds";

export function newAvailabilityRuleId(): string {
  const c = getWindow()?.crypto;
  if (c?.randomUUID) return c.randomUUID();
  return `avail-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function ensureExt(ext: BuyerPreferenceExtensions | undefined): BuyerPreferenceExtensions {
  if (ext && ext.v === 1) return { ...ext, v: 1 };
  return { v: 1, ...(ext ?? {}) };
}

function pruneAvailability(
  av: BuyerAvailabilityPrefs | undefined
): BuyerAvailabilityPrefs | undefined {
  if (!av) return undefined;
  const out: BuyerAvailabilityPrefs = {};
  if (av.timezone?.trim()) out.timezone = av.timezone.trim();
  if (av.weekly?.length) out.weekly = av.weekly;
  if (av.oneOff?.length) out.oneOff = av.oneOff;
  if (av.exceptions?.length) out.exceptions = av.exceptions;
  if (!out.timezone && !out.weekly?.length && !out.oneOff?.length && !out.exceptions?.length) {
    return undefined;
  }
  return out;
}

export function addAvailabilityFromQuickCreate(
  ext: BuyerPreferenceExtensions | undefined,
  q: CalendarQuickCreateState
): BuyerPreferenceExtensions {
  const base = ensureExt(ext);
  const prev = base.availability ?? {};
  let zone: string;
  try {
    zone = prev.timezone?.trim() || Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    zone = "UTC";
  }
  const av: BuyerAvailabilityPrefs = { ...prev, timezone: zone };

  if (q.isAllDay) {
    return base;
  }

  const weekday = dayjs(q.startDate, "YYYY-MM-DD", true).day();
  if (q.repeatWeekly) {
    av.weekly = [
      ...(av.weekly ?? []),
      {
        id: newAvailabilityRuleId(),
        weekday,
        start: q.startTime,
        end: q.endTime,
      },
    ];
  } else {
    av.oneOff = [
      ...(av.oneOff ?? []),
      {
        id: newAvailabilityRuleId(),
        date: q.startDate,
        start: q.startTime,
        end: q.endTime,
      },
    ];
  }

  const pruned = pruneAvailability(av);
  if (!pruned) {
    const { availability: _drop, ...rest } = base;
    return { ...rest, v: 1 as const };
  }
  return { ...base, availability: pruned };
}

export function deleteAvailabilityByEventId(
  ext: BuyerPreferenceExtensions | undefined,
  eventId: string
): BuyerPreferenceExtensions {
  const base = ensureExt(ext);
  const parsed = parseAvailabilitySyntheticEventId(eventId);
  if (!parsed) return base;
  const prev = base.availability ?? {};
  const av: BuyerAvailabilityPrefs = { ...prev };

  if (parsed.kind === "oneOff") {
    av.oneOff = (av.oneOff ?? []).filter((x) => x.id !== parsed.oneOffId);
  } else {
    av.exceptions = [
      ...(av.exceptions ?? []),
      {
        id: newAvailabilityRuleId(),
        scope: "weekly",
        ruleId: parsed.ruleId,
        date: parsed.ymd,
      },
    ];
  }

  const pruned = pruneAvailability(av);
  if (!pruned) {
    const { availability: _drop, ...rest } = base;
    return { ...rest, v: 1 as const };
  }
  return { ...base, availability: pruned };
}

export function updateAvailabilityFromEditedEvent(
  ext: BuyerPreferenceExtensions | undefined,
  eventId: string,
  next: GoogleEvent
): BuyerPreferenceExtensions {
  const base = ensureExt(ext);
  const parsed = parseAvailabilitySyntheticEventId(eventId);
  if (!parsed) return base;

  const startRaw = next.start?.dateTime ?? next.start?.date;
  const endRaw = next.end?.dateTime ?? next.end?.date;
  if (!startRaw || !endRaw) return base;

  const sd = dayjs(startRaw);
  const ed = dayjs(endRaw);
  if (!sd.isValid() || !ed.isValid()) return base;

  const startTime = sd.format("HH:mm");
  const endTime = ed.format("HH:mm");
  const ymd = sd.format("YYYY-MM-DD");

  const prev = base.availability ?? {};
  const av: BuyerAvailabilityPrefs = { ...prev };

  if (parsed.kind === "oneOff") {
    av.oneOff = (av.oneOff ?? []).map((o) =>
      o.id === parsed.oneOffId ? { ...o, date: ymd, start: startTime, end: endTime } : o
    );
  } else {
    av.weekly = (av.weekly ?? []).map((r) =>
      r.id === parsed.ruleId ? { ...r, start: startTime, end: endTime } : r
    );
  }

  const pruned = pruneAvailability(av);
  if (!pruned) {
    const { availability: _drop, ...rest } = base;
    return { ...rest, v: 1 as const };
  }
  return { ...base, availability: pruned };
}
