import type { GoogleEvent } from "packages/features/calendar/types/googleEvent";
import { dayjs } from "packages/utils/date";

const YMD_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const HH_MM_REGEX = /^(\d{1,2}):(\d{2})$/;

/** Default step for create-event time pickers (minutes). */
export const CREATE_EVENT_TIME_STEP_MINUTES = 15;

/**
 * Snap total minutes from midnight to the nearest step (floor) within 0..24h.
 */
export function quantizeMinutesFromMidnight(totalMinutes: number, stepMinutes: number): number {
  if (stepMinutes < 1 || stepMinutes > 60 || 60 % stepMinutes !== 0) {
    return Math.max(0, Math.min(24 * 60 - stepMinutes, totalMinutes));
  }
  const clamped = Math.max(0, Math.min(24 * 60 - 1, totalMinutes));
  const q = Math.floor(clamped / stepMinutes) * stepMinutes;
  return Math.min(q, 24 * 60 - stepMinutes);
}

/**
 * Parse HH:mm; returns null if invalid.
 */
export function parseHourMinute24(
  raw: string | null | undefined
): { hour: number; minute: number } | null {
  if (raw == null || raw.trim() === "") {
    return null;
  }
  const match = raw.trim().match(HH_MM_REGEX);
  if (!match) {
    return null;
  }
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (
    !Number.isInteger(hour) ||
    !Number.isInteger(minute) ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    return null;
  }
  return { hour, minute };
}

/**
 * Ensure minute is on step (e.g. 15); snaps down.
 */
export function quantizeHourMinute(
  hour: number,
  minute: number,
  stepMinutes: number
): { hour: number; minute: number } {
  const total = hour * 60 + minute;
  const q = quantizeMinutesFromMidnight(total, stepMinutes);
  return { hour: Math.floor(q / 60), minute: q % 60 };
}

function isValidYmd(s: string): boolean {
  if (!YMD_REGEX.test(s)) return false;
  return dayjs(s, "YYYY-MM-DD", true).isValid();
}

/**
 * Google all-day: `end.date` is exclusive (day after last inclusive day).
 */
export function inclusiveRangeToGoogleAllDayDates(
  startYmdInclusive: string,
  endYmdInclusive: string
): { startDate: string; endDateExclusive: string } {
  const start = dayjs(startYmdInclusive.trim(), "YYYY-MM-DD", true);
  const endIncl = dayjs(endYmdInclusive.trim(), "YYYY-MM-DD", true);
  if (!start.isValid() || !endIncl.isValid()) {
    throw new Error("Invalid date range.");
  }
  if (endIncl.isBefore(start, "day")) {
    throw new Error("End date must be on or after start date.");
  }
  const endExclusive = endIncl.add(1, "day").format("YYYY-MM-DD");
  return {
    startDate: start.format("YYYY-MM-DD"),
    endDateExclusive: endExclusive,
  };
}

/**
 * Inclusive end date from Google all-day response (`end.date` exclusive).
 */
export function googleAllDayEndExclusiveToInclusiveEndYmd(endDateExclusive: string): string {
  const end = dayjs(endDateExclusive.trim(), "YYYY-MM-DD", true);
  if (!end.isValid()) {
    throw new Error("Invalid end date.");
  }
  return end.subtract(1, "day").format("YYYY-MM-DD");
}

export type BuildCreateEventGooglePayloadParams = {
  isAllDay: boolean;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  timeStepMinutes?: number;
  /**
   * When true, timed `end` is capped to 23:59 on the start date's local calendar day
   * (no spill into the next local day).
   */
  clampTimedEndToStartLocalDay?: boolean;
};

/**
 * Builds `start` / `end` for Google Calendar API from form state.
 */
export function buildCreateEventGoogleStartEnd(
  params: BuildCreateEventGooglePayloadParams
): Pick<GoogleEvent, "start" | "end"> {
  const step = params.timeStepMinutes ?? CREATE_EVENT_TIME_STEP_MINUTES;
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

  if (params.isAllDay) {
    const { startDate, endDateExclusive } = inclusiveRangeToGoogleAllDayDates(
      params.startDate,
      params.endDate
    );
    return {
      start: { date: startDate },
      end: { date: endDateExclusive },
    };
  }

  if (!isValidYmd(params.startDate) || !isValidYmd(params.endDate)) {
    throw new Error("Invalid start or end date.");
  }

  let startHm = parseHourMinute24(params.startTime);
  let endHm = parseHourMinute24(params.endTime);
  if (!startHm || !endHm) {
    throw new Error("Start and end time are required for timed events.");
  }
  startHm = quantizeHourMinute(startHm.hour, startHm.minute, step);
  endHm = quantizeHourMinute(endHm.hour, endHm.minute, step);

  const start = dayjs(params.startDate, "YYYY-MM-DD", true)
    .hour(startHm.hour)
    .minute(startHm.minute)
    .second(0)
    .millisecond(0);
  let end = dayjs(params.endDate, "YYYY-MM-DD", true)
    .hour(endHm.hour)
    .minute(endHm.minute)
    .second(0)
    .millisecond(0);

  if (!start.isValid() || !end.isValid()) {
    throw new Error("Invalid date/time combination.");
  }
  if (!end.isAfter(start)) {
    throw new Error("End must be after start.");
  }

  if (params.clampTimedEndToStartLocalDay) {
    const startYmd = start.format("YYYY-MM-DD");
    if (end.format("YYYY-MM-DD") !== startYmd) {
      end = dayjs(startYmd, "YYYY-MM-DD", true).hour(23).minute(59).second(0).millisecond(0);
    }
    if (!end.isAfter(start)) {
      end = start.add(1, "minute");
      if (end.format("YYYY-MM-DD") !== startYmd) {
        end = dayjs(startYmd, "YYYY-MM-DD", true).hour(23).minute(59).second(0).millisecond(0);
      }
    }
    if (!end.isAfter(start)) {
      throw new Error("End must be after start.");
    }
  }

  return {
    start: { dateTime: start.toISOString(), timeZone: tz },
    end: { dateTime: end.toISOString(), timeZone: tz },
  };
}
