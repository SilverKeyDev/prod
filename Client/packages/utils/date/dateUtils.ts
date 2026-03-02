/**
 * Cross-platform date parsing and formatting.
 * Use this instead of new Date() or Date.parse() so behavior is consistent
 * across V8 (web) and Hermes (React Native). All parsing goes through Day.js
 * with explicit handling of ISO and common formats.
 */

import dayjs, { type Dayjs } from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import utc from "dayjs/plugin/utc";

dayjs.extend(customParseFormat);
dayjs.extend(utc);
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

/** Strict format for MM/DD/YYYY */
const DATE_FORMAT = "MM/DD/YYYY";

/**
 * Current date/time (cross-platform). Use instead of new Date().
 */
export function dateNow(): Dayjs {
  return dayjs();
}

/**
 * Parse an ISO 8601 string (e.g. from APIs). Use instead of Date.parse() or new Date(string).
 */
export function dateParseISO(value: string): Dayjs {
  const d = dayjs(value);
  if (!d.isValid()) {
    throw new RangeError(`Invalid ISO date string: ${value}`);
  }
  return d;
}

/**
 * Parse a date string with a known format (strict). Use for user input or non-ISO strings.
 */
export function dateParse(value: string, format: string): Dayjs {
  const d = dayjs(value, format, true);
  if (!d.isValid()) {
    throw new RangeError(`Invalid date string: ${value} for format: ${format}`);
  }
  return d;
}

/**
 * Parse with common formats: ISO first, then MM/DD/YYYY. Returns invalid Dayjs if none match.
 */
export function dateParseLenient(value: string): Dayjs {
  if (!value || typeof value !== "string") {
    return dayjs(null);
  }
  const trimmed = value.trim();
  const iso = dayjs(trimmed);
  if (iso.isValid()) return iso;
  const withFormat = dayjs(trimmed, DATE_FORMAT, true);
  if (withFormat.isValid()) return withFormat;
  return dayjs(null);
}

/**
 * Format a Dayjs (or ISO string) for display. Uses Day.js so formatting is consistent.
 */
export function dateFormat(value: Dayjs | string, format: string = "YYYY-MM-DD"): string {
  const d = typeof value === "string" ? dayjs(value) : value;
  if (!d.isValid()) return "";
  return d.format(format);
}

/**
 * Export Dayjs type and dayjs for advanced use (e.g. calendar arithmetic).
 * Prefer dateNow/dateParseISO/dateParse/dateFormat in app code.
 */
export type { Dayjs };
export { dayjs };
