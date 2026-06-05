/**
 * Consistent en-US date/time display via Intl (V8/Hermes).
 * Prefer these over ad-hoc toLocale* calls scattered in features.
 */

import { dateParseISO, dateParseLenient } from "./dateUtils";

export function formatLocaleTime12HourEnUs(date: Date): string {
  try {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return "";
  }
}

export function formatLocaleWeekdayShortMonthDayEnUs(date: Date): string {
  try {
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

/** e.g. Jan 15 (no year) */
export function formatLocaleMonthDayShortEnUs(date: Date): string {
  try {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

/** e.g. Jan 15, 2025 */
export function formatLocaleMonthDayYearShortEnUs(date: Date): string {
  try {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

/** e.g. Wed, Jan 15, 2025 — used for compact event request summaries */
export function formatLocaleWeekdayMonthDayYearShortEnUs(date: Date): string {
  try {
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

/** e.g. Wednesday, January 15 — message dividers / human-readable lines (current year) */
export function formatLocaleLongWeekdayMonthDayEnUs(date: Date): string {
  try {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

/** e.g. Wednesday, January 15, 2025 */
export function formatLocaleLongWeekdayMonthDayYearEnUs(date: Date): string {
  try {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

/**
 * Parse common API/user date strings leniently; display as MMM D, YYYY or "" if unparseable.
 */
export function formatOptionalDateStringEnUs(value: string | null | undefined): string {
  if (value == null || typeof value !== "string") return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  const d = dateParseLenient(trimmed);
  if (!d.isValid()) return "";
  return d.toDate().toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Single line: Wed, Jan 15, 2025 at 1:00 PM – 2:00 PM
 */
export function formatEventRequestRangeSummaryEnUs(startIso: string, endIso: string): string {
  const startDate = dateParseISO(startIso).toDate();
  const endDate = dateParseISO(endIso).toDate();
  const dateStr = formatLocaleWeekdayMonthDayYearShortEnUs(startDate);
  const timeStr = `${formatLocaleTime12HourEnUs(startDate)} – ${formatLocaleTime12HourEnUs(endDate)}`;
  return `${dateStr} at ${timeStr}`;
}
