import type { Calendar } from "./types";

/**
 * Find SilverKey calendar from calendars list
 */
export function findSilverKeyCalendar(
  calendars: Calendar[]
): Calendar | undefined {
  if (!calendars || calendars.length === 0) {
    return undefined;
  }
  return calendars.find((cal) => cal.summary === "SilverKey");
}

/**
 * Generate stable key from calendar IDs for change detection
 */
export function getCalendarsKey(calendars: Calendar[]): string {
  if (!calendars || calendars.length === 0) {
    return "";
  }
  return calendars
    .map((cal) => cal.id)
    .sort()
    .join(",");
}

/**
 * Calculate enabled calendar IDs from preferences
 */
export function calculateEnabledCalendarIds(
  calendars: Calendar[],
  disabledCalendars: string[] | undefined,
  silverKeyCalendarId: string | null
): Set<string> {
  if (!calendars || calendars.length === 0) {
    return new Set();
  }
  const disabledSet = new Set(disabledCalendars ?? []);
  return new Set(
    calendars
      .map((cal) => cal.id)
      .filter((id) => {
        if (silverKeyCalendarId && id === silverKeyCalendarId) {
          return true; // Always include SilverKey calendar
        }
        return !disabledSet.has(id);
      })
  );
}

/**
 * Calculate disabled calendar IDs from enabled set
 */
export function calculateDisabledCalendarIds(
  calendars: Calendar[],
  enabledCalendarIds: Set<string>,
  silverKeyCalendarId: string | null
): string[] {
  if (!calendars || calendars.length === 0) {
    return [];
  }
  return calendars
    .map((cal) => cal.id)
    .filter((id) => {
      if (silverKeyCalendarId && id === silverKeyCalendarId) {
        return false; // Never disable SilverKey calendar
      }
      return !enabledCalendarIds.has(id);
    });
}

/**
 * Initialize enabled calendars from preferences
 */
export function initializeEnabledCalendars(
  calendars: Calendar[],
  disabledCalendars: string[] | undefined,
  silverKeyCalendarId: string | null
): Set<string> {
  return calculateEnabledCalendarIds(calendars, disabledCalendars, silverKeyCalendarId);
}
