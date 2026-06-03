import { CREATE_EVENT_TIME_STEP_MINUTES } from "packages/utils/calendar/createEvent/eventFormGooglePayload";

/**
 * Maps a Y offset within the week/day time grid to nearest step-aligned minutes from midnight.
 * Used for double-click quick-create. Clamps Y to the grid, then rounds minutes to nearest step.
 */
export function localYOffsetToRoundedMinutesFromMidnight(
  localY: number,
  hourRowHeightPx: number,
  totalGridHeightPx: number,
  stepMinutes: number = CREATE_EVENT_TIME_STEP_MINUTES
): number {
  if (hourRowHeightPx <= 0 || totalGridHeightPx <= 0 || stepMinutes < 1) {
    return 0;
  }
  const clampedY = Math.max(0, Math.min(localY, totalGridHeightPx));
  const continuousMinutes = (clampedY / totalGridHeightPx) * 24 * 60;
  const rounded = Math.round(continuousMinutes / stepMinutes) * stepMinutes;
  const maxStart = 24 * 60 - stepMinutes;
  return Math.max(0, Math.min(rounded, maxStart));
}
